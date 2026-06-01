import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useRefresh } from "../contexts/RefreshContext";
import { toast } from "react-toastify";

export default function MaintenanceForm() {
  const navigate = useNavigate();
  const { triggerRefresh } = useRefresh();
  const [properties, setProperties] = useState([]);
  const [isTenant, setIsTenant] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "General", // Default to General for staff
    description: "",
    property_id: "",
    priority: "Low",
    unit_id: "",
  });
  const [activeContext, setActiveContext] = useState(null);
  const [tenantName, setTenantName] = useState("");
  const [image, setImage] = useState(null);

  // New states for budget splitting on creation
  const [propertyUnits, setPropertyUnits] = useState([]);
  const [tenantSplits, setTenantSplits] = useState({});
  const [budgetCost, setBudgetCost] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await api.post("/auth/me");
        const user = userRes.data;
        setTenantName(user.name);

        if (user.role === "tenant") {
          setIsTenant(true);

          // 1. Try to get Active Context first
          try {
            const contextRes = await api.get("/tenants/active-context");
            if (contextRes.data.has_active_context) {
              const ctx = contextRes.data.context;
              setActiveContext(ctx);
              setFormData((prev) => ({
                ...prev,
                property_id: ctx.property_id,
                unit_id: ctx.unit_id,
              }));
              // Create a mock property object for the dropdown so it displays correctly
              setProperties([{ id: ctx.property_id, name: ctx.property_name }]);
            } else {
              // Fallback to Lease if no active context (but rent not paid/approved yet)
              const leaseRes = await api.get(`/leases?tenant_id=${user.id}`);
              if (leaseRes.data.length > 0) {
                const lease = leaseRes.data[0];
                setFormData((prev) => ({
                  ...prev,
                  property_id: lease.unit?.property?.id || lease.property_id,
                  unit_id: lease.unit?.id || lease.unit_id,
                }));
                const propRes = await api.get(
                  `/properties/${lease.unit?.property?.id || lease.property_id}`,
                );
                setProperties([propRes.data]);
              }
            }
          } catch (e) {
            console.error("Failed to fetch context/lease", e);
          }
        } else {
          // Admin/Manager flow
          const response = await api.get("/properties");
          const propertiesData = response.data.data || response.data; // Handle both paginated and non-paginated
          setProperties(propertiesData);
          if (propertiesData.length > 0) {
            setFormData((prev) => ({
              ...prev,
              property_id: propertiesData[0].id,
            }));
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to initialize form", error);
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!isTenant && formData.property_id) {
      api.get(`/units?property_id=${formData.property_id}`).then((res) => {
        const units = res.data.filter((u) => u.tenant_id && u.status === "Occupied");
        setPropertyUnits(units);
        const initialSplits = {};
        units.forEach((u) => {
          initialSplits[u.tenant_id] = { amount: "", name: u.tenant?.name || 'Tenant', unit_number: u.unit_number };
        });
        setTenantSplits(initialSplits);
      }).catch(err => console.error("Failed to load units", err));
    }
  }, [formData.property_id, isTenant]);

  const handleSplitChange = (tenantId, value) => {
    const newSplits = { ...tenantSplits, [tenantId]: { ...tenantSplits[tenantId], amount: value } };
    setTenantSplits(newSplits);
    
    let total = 0;
    Object.values(newSplits).forEach((s) => {
      total += parseFloat(s.amount || 0);
    });
    setBudgetCost(total > 0 ? total.toString() : "");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create FormData object for file upload
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("property_id", formData.property_id);
    data.append("priority", formData.priority);

    if (formData.unit_id) {
      data.append("unit_id", formData.unit_id);
    }

    if (image) {
      data.append("image", image);
    }

    // Append budget split data if applicable
    if (!isTenant && propertyUnits.length > 0) {
      const splitArray = Object.keys(tenantSplits).map((tId) => ({
        tenant_id: tId,
        amount: parseFloat(tenantSplits[tId].amount || 0),
      }));
      data.append("tenant_budget_split", JSON.stringify(splitArray));
      data.append("budget_cost", parseFloat(budgetCost || 0));
    }

    try {
      await api.post("/issues", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      triggerRefresh();
      navigate(isTenant ? "/portal" : "/maintenance");
    } catch (error) {
      console.error("Failed to report issue:", error);
      toast.error("Failed to report issue");
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="card shadow" style={{ width: "100%", maxWidth: "550px" }}>
        <div className="card-body p-4">
          <h2 className="card-title text-center mb-4 h3 fw-bold">
            Report Maintenance Issue
          </h2>
          {activeContext && (
            <div className="alert alert-success mb-3">
              <small className="fw-bold d-block">
                Active Property Context:
              </small>
              {tenantName} - {activeContext.property_name} - Unit {activeContext.unit_number}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-bold">Property</label>
              <select
                name="property_id"
                onChange={handleChange}
                className="form-select"
                value={formData.property_id}
                disabled={isTenant}
              required >
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name}
                  </option>
                ))}
                {properties.length === 0 && (
                  <option>Loading or No Property Linked</option>
                )}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Title</label>
              <input
                name="title"
                type="text"
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Description</label>
              <textarea
                name="description"
                onChange={handleChange}
                className="form-control"
                rows="4"
                required
              ></textarea>
            </div>
            <div className="mb-3">
              <label className="form-label fw-bold">Priority</label>
              <select
                name="priority"
                onChange={handleChange}
                className="form-select"
                value={formData.priority}
              required >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold">
                Attach Image (Optional)
              </label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={handleImageChange}
              required />
              <div className="form-text">
                Upload a photo to help us understand the issue better.
              </div>
            </div>

            {!isTenant && propertyUnits.length > 0 && (
              <div className="mb-4">
                 <label className="form-label fw-bold text-primary">Property Tenants Budget Allocation</label>
                 <div className="p-3 bg-light rounded border border-primary border-opacity-25 shadow-sm">
                     {propertyUnits.map(unit => (
                         <div key={unit.tenant_id} className="d-flex align-items-center justify-content-between mb-3 bg-white p-2 border rounded">
                             <div>
                                 <span className="fw-bold fs-6 d-block text-dark">{tenantSplits[unit.tenant_id]?.name || `Tenant #${unit.tenant_id}`}</span>
                                 <small className="text-muted">Unit {unit.unit_number}</small>
                             </div>
                             <div className="input-group input-group-sm" style={{ width: '150px' }}>
                                 <span className="input-group-text bg-light fw-bold">₦</span>
                                 <input 
                                     type="number" 
                                     className="form-control" 
                                     placeholder="Amount" 
                                     value={tenantSplits[unit.tenant_id]?.amount || ""}
                                     onChange={(e) => handleSplitChange(unit.tenant_id, e.target.value)}
                                     min="0"
                                     step="0.01"
                                 />
                             </div>
                         </div>
                     ))}
                     <hr />
                     <div className="d-flex justify-content-between align-items-center mt-2">
                         <span className="fw-bold text-uppercase small text-muted">Grand Total:</span>
                         <span className="fs-4 fw-bold text-dark">₦{parseFloat(budgetCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                     </div>
                 </div>
              </div>
            )}

            <div className="d-flex justify-content-between mt-4">
              <button
                type="button"
                onClick={() => navigate(isTenant ? "/portal" : "/maintenance")}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Submit Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
