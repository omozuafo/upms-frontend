import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useRefresh } from "../contexts/RefreshContext";
import { toast } from "react-toastify";

export default function PaymentForm() {
  const navigate = useNavigate();
  const { triggerRefresh } = useRefresh();
  const [searchParams] = useSearchParams();
  const paymentType = searchParams.get("type") || "Rent";

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    method: "Bank Transfer",
    notes: "",
    evidence: null,
  });

  const [tenantId, setTenantId] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [property, setProperty] = useState(null);
  const [unit, setUnit] = useState(null);

  // New state for manual selection
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [activeContext, setActiveContext] = useState(null); // New state for active context

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const authRes = await api.post("/auth/me");
        setTenantId(authRes.data.id);
        setTenantName(authRes.data.name);

        if (authRes.data.role === "tenant") {
          // 1. Fetch Active Context FIRST
          try {
            const contextRes = await api.get("/tenants/active-context");
            if (contextRes.data.has_active_context) {
              const ctx = contextRes.data.context;
              setActiveContext(ctx);

              // Pre-fill and lock
              setProperty({ id: ctx.property_id, name: ctx.property_name });
              setUnit({ id: ctx.unit_id, unit_number: ctx.unit_number });

              // Fetch rent amount from unit to pre-fill if type is Rent
              try {
                const uRes = await api.get(`/units/${ctx.unit_id}`);
                if (paymentType === "Rent") {
                  setFormData((prev) => ({
                    ...prev,
                    amount: uRes.data.rent_amount,
                  }));
                }
              } catch (e) {
                console.error("Failed to fetch unit details", e);
              }
            }
          } catch (e) {
            console.error("Failed to fetch active context", e);
          }

          // The existing statsRes logic for tenants is now superseded by activeContext for auto-selection.
          // If activeContext exists, we use that. If not, and it's a tenant, we might still want to fetch stats
          // for other purposes, but not for auto-selecting property/unit for payment if activeContext is the strict requirement.
          // For now, we'll keep it commented out as per the instruction's implication to prioritize activeContext.
          /*
          const statsRes = await api.get("/dashboard/stats");
          // Only auto-select if valid property data is returned
          if (statsRes.data.property && statsRes.data.property.id) {
            setProperty(statsRes.data.property);
            setUnit(statsRes.data.unit);

            // Only set amount for Rent
            if (paymentType === "Rent") {
              setFormData((prev) => ({
                ...prev,
                amount: statsRes.data.unit.rent_amount,
              }));
            }

            // Also fetch units for this property so the dropdown isn't empty if they want to change (though unlikely)
            try {
              const unitsRes = await api.get(
                `/units?property_id=${statsRes.data.property.id}`,
              );
              setUnits(unitsRes.data);
            } catch (e) {
              console.error(
                "Failed to fetch units for auto-selected property",
                e,
              );
            }
          }
          */
        }

        // Fetch all properties for manual selection (only if needed or for landlord/admin)
        // If tenant has active context, they can't change property anyway, but good to have for reference?
        // actually, we might want to hide other properties if context is locked.
        const propsRes = await api.get("/properties");
        setProperties(propsRes.data.data || propsRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInitialData();
  }, [paymentType]);

  const handlePropertyChange = async (propertyId) => {
    if (!propertyId) {
      setProperty(null);
      setUnit(null);
      setUnits([]);
      return;
    }

    const selectedProp = properties.find((p) => p.id == propertyId);
    setProperty(selectedProp);
    setUnit(null); // Reset unit when property changes

    try {
      const res = await api.get(`/units?property_id=${propertyId}`);
      setUnits(res.data);
    } catch (err) {
      console.error("Failed to fetch units:", err);
      setUnits([]);
    }
  };

  const handleUnitChange = (unitId) => {
    if (!unitId) {
      setUnit(null);
      return;
    }
    const selectedUnit = units.find((u) => u.id == unitId);
    setUnit(selectedUnit);
    if (selectedUnit) {
      setFormData((prev) => ({
        ...prev,
        amount: selectedUnit.rent_amount || "",
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      evidence: e.target.files[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append("tenant_id", tenantId);
      data.append("type", paymentType);
      data.append("amount", formData.amount);
      data.append("payment_date", formData.payment_date);
      data.append("method", formData.method);
      data.append("notes", formData.notes);

      if (property) data.append("property_id", property.id);
      if (unit) data.append("unit_id", unit.id);

      if (formData.evidence) {
        data.append("evidence", formData.evidence);
      }

      await api.post("/payments", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Payment submitted successfully! Reference pending approval.");
      triggerRefresh();
      navigate("/payments");
    } catch (error) {
      console.error("Failed to submit payment:", error);
      toast.error(error.response?.data?.message || "Failed to submit payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 p-4 bg-light d-flex justify-content-center align-items-center">
      <div
        className="card shadow-sm"
        style={{ maxWidth: "600px", width: "100%" }}
      >
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">Record Payment: {paymentType}</h4>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            {/* Active Context Information - Replaces standard display */}
            {activeContext && (
              <div className="alert alert-success mb-3">
                <div className="d-flex align-items-center">
                  <i className="bi bi-check-circle-fill fs-4 me-3"></i>
                  <div>
                    <h6 className="mb-0 fw-bold">Active Property Context</h6>
                    <p className="mb-0 small">
                      {tenantName} • {activeContext.property_name} • Unit{" "}
                      {activeContext.unit_number}
                    </p>
                    <small className="text-muted">
                      Linked to approved rent payment set on{" "}
                      {new Date(
                        activeContext.rent_payment_date,
                      ).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              </div>
            )}

            {/* Warning if NO active context and trying to pay something else */}
            {!activeContext && tenantId && paymentType !== "Rent" && (
              <div className="alert alert-warning mb-3">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>Restricted Access:</strong> You must have an approved
                Rent payment to access this service. Please pay Rent first.
              </div>
            )}

            {/* Property Display for Tenants (All Payment Types) - Fallback or if context is null but manual select happened */}
            {tenantId &&
              property &&
              unit &&
              !activeContext &&
              paymentType !== "Rent" && (
                <div className="alert alert-info mb-3">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-house-door-fill fs-4 me-3"></i>
                    <div>
                      <h6 className="mb-0 fw-bold">{property.name}</h6>
                      <small>
                        {property.address} • Unit {unit.unit_number}
                      </small>
                    </div>
                  </div>
                </div>
              )}

            {/* Property and Unit Selection (Visible for Rent payments if NO context, or Non-Tenants) */}
            {((paymentType === "Rent" && !activeContext) || !tenantId) && (
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">
                    Property <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="property_id"
                    value={property?.id || ""}
                    onChange={(e) => handlePropertyChange(e.target.value)}
                    required
                  >
                    <option value="">Select Property</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Unit <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="unit_id"
                    value={unit?.id || ""}
                    onChange={(e) => handleUnitChange(e.target.value)}
                    required
                    disabled={!property}
                  >
                    <option value="">Select Unit</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unit_number} ({u.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label">Amount (₦)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Payment Date</label>
              <input
                type="date"
                name="payment_date"
                value={formData.payment_date}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Payment Method</label>
              <select
                name="method"
                value={formData.method}
                onChange={handleChange}
                className="form-select"
                disabled={!activeContext && paymentType !== "Rent" && tenantId} // Disable if no context and not rent (double security)
              required >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="POS">POS</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Upload Evidence</label>
              <input
                type="file"
                name="evidence"
                onChange={handleFileChange}
                className="form-control"
                accept="image/*,.pdf"
              required />
              <small className="text-muted">
                Upload receipt or proof of payment (Image/PDF)
              </small>
            </div>

            <div className="mb-3">
              <label className="form-label">Notes (Optional)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="form-control"
                rows="3"
              required ></textarea>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                onClick={() => navigate("/payments")}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  loading ||
                  (!activeContext && paymentType !== "Rent" && tenantId)
                }
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Submitting...
                  </>
                ) : (
                  "Submit Payment"
                )}
              </button>
            </div>
            {/* Logic: If no active context, and trying to pay something else, block submit */}
            {!activeContext && paymentType !== "Rent" && tenantId && (
              <div className="text-danger text-center mt-2 small">
                Cannot submit {paymentType} without confirmed Rent payment
                history.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
