import { useEffect, useState, useCallback } from "react";
import useRealtime from "../hooks/useRealtime";
import { Link } from "react-router-dom";

import api from "../services/api";

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTenants = useCallback(async (isInitial = false) => {
    try {
      const response = await api.get("/tenants");
      const data = response.data.data || response.data;
      setTenants(Array.isArray(data) ? data : []);
      if (isInitial) setLoading(false);
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants(true);
  }, [fetchTenants]);

  useRealtime('user', {
    onCreated: (newUser) => {
       if (newUser.role === 'tenant') {
           setTenants(prev => {
              if (prev.find(t => t.id === newUser.id)) return prev;
              return [newUser, ...prev];
           });
       }
    },
    onUpdated: (updatedUser) => {
       setTenants(prev => prev.map(t => t.id === updatedUser.id ? { ...t, ...updatedUser } : t));
    },
    onDeleted: (deletedData) => {
       setTenants(prev => prev.filter(t => t.id !== deletedData.id));
    }
  });

  const [searchTerm, setSearchTerm] = useState("");

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-vh-100 p-4 bg-light">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 fw-bold mb-0">Tenants</h1>
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
              placeholder="Search tenants by name or email..."
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
                <th className="p-3 fw-semibold">Name</th>
                <th className="p-3 fw-semibold">Email</th>
                <th className="p-3 fw-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.length > 0 ? (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td className="p-3">{tenant.name}</td>
                    <td className="p-3">{tenant.email}</td>
                    <td className="p-3">
                      <Link
                        to={`/tenants/${tenant.id}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-muted">
                    No tenants found matching "{searchTerm}"
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
