import { useEffect, useState, useCallback } from "react";
import useAutoRefresh from "../hooks/useAutoRefresh";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Units() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUnits = useCallback(async (isInitial = false) => {
    try {
      const response = await api.get("/units");
      setUnits(response.data);
      if (isInitial) setLoading(false);
    } catch (error) {
      console.error("Failed to fetch units:", error);
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits(true);
  }, [fetchUnits]);

  useAutoRefresh(() => fetchUnits(false));

  const filteredUnits = units.filter(
    (unit) =>
      (unit.unit_number?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      ) ||
      (unit.property?.name?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      ),
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 p-4 bg-light">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Units</h1>
          <p className="text-muted mb-0">Manage all property units</p>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Search by unit number or property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th className="p-3 fw-semibold">Unit Number</th>
                <th className="p-3 fw-semibold">Property</th>
                <th className="p-3 fw-semibold">Rent Amount</th>
                <th className="p-3 fw-semibold">Tenant</th>
                <th className="p-3 fw-semibold">Status</th>
                <th className="p-3 fw-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.length > 0 ? (
                filteredUnits.map((unit) => (
                  <tr key={unit.id}>
                    <td className="p-3 fw-semibold">{unit.unit_number}</td>
                    <td className="p-3">{unit.property?.name || "N/A"}</td>
                    <td className="p-3">
                      ₦{parseFloat(unit.rent_amount || 0).toLocaleString()}
                    </td>
                    <td className="p-3">
                      {unit.tenant ? (
                        <span className="fw-medium text-dark">
                          {unit.tenant.name}
                        </span>
                      ) : (
                        <span className="text-muted small">None</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`badge ${
                          unit.status === "Occupied"
                            ? "bg-success"
                            : unit.status === "Vacant"
                              ? "bg-warning text-dark"
                              : "bg-secondary"
                        }`}
                      >
                        {unit.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {/* Link to property detail as we don't have standalone unit detail page yet */}
                      <Link
                        to={`/properties/${unit.property_id}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        View Property
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-muted">
                    No units found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
