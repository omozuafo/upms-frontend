import { useEffect, useState, useCallback } from "react";
import useRealtime from "../hooks/useRealtime";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Leases() {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLeases = useCallback(async (isInitial = false) => {
    try {
      const response = await api.get("/leases");
      setLeases(response.data);
      if (isInitial) setLoading(false);
    } catch (error) {
      console.error("Failed to fetch leases:", error);
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeases(true);
  }, [fetchLeases]);

  useRealtime('lease', {
    onCreated: (newLease) => {
       setLeases(prev => {
          if (prev.find(p => p.id === newLease.id)) return prev;
          return [newLease, ...prev];
       });
       fetchLeases(false);
    },
    onUpdated: (updatedLease) => {
       setLeases(prev => prev.map(p => p.id === updatedLease.id ? { ...p, ...updatedLease } : p));
    },
    onDeleted: (deletedData) => {
       setLeases(prev => prev.filter(p => p.id !== deletedData.id));
    }
  });

  const filteredLeases = leases.filter(
    (lease) =>
      (lease.tenant?.name?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      ) ||
      (lease.unit?.property?.name?.toLowerCase() || "").includes(
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
          <h1 className="h3 fw-bold text-dark mb-1">Leases</h1>
          <p className="text-muted mb-0">
            Manage all active and inactive leases
          </p>
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
              placeholder="Search by tenant or property..."
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
                <th className="p-3 fw-semibold">Tenant</th>
                <th className="p-3 fw-semibold">Property</th>
                <th className="p-3 fw-semibold">Unit</th>
                <th className="p-3 fw-semibold">Start Date</th>
                <th className="p-3 fw-semibold">End Date</th>
                <th className="p-3 fw-semibold">Status</th>
                <th className="p-3 fw-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeases.length > 0 ? (
                filteredLeases.map((lease) => (
                  <tr key={lease.id}>
                    <td className="p-3 fw-semibold">
                      {lease.tenant?.name || "N/A"}
                    </td>
                    <td className="p-3">
                      {lease.unit?.property?.name || "N/A"}
                    </td>
                    <td className="p-3">{lease.unit?.unit_number || "N/A"}</td>
                    <td className="p-3">
                      {new Date(lease.start_date).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      {new Date(lease.end_date).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <span
                        className={`badge ${
                          lease.status === "Active"
                            ? "bg-success"
                            : lease.status === "Expired"
                              ? "bg-danger"
                              : "bg-secondary"
                        }`}
                      >
                        {lease.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <Link
                        to={`/tenants/${lease.tenant_id}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        View Tenant
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-muted">
                    No leases found matching "{searchTerm}"
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
