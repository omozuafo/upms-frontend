import { useEffect, useState, useCallback } from "react";
import useAutoRefresh from "../hooks/useAutoRefresh";
import { Link } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";

export default function Landlords() {
  const [landlords, setLandlords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLandlords = useCallback(async (isInitial = false) => {
    try {
      const response = await api.get("/landlords");
      setLandlords(response.data);
      if (isInitial) setLoading(false);
    } catch (error) {
      console.error("Failed to fetch landlords:", error);
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLandlords(true);
  }, [fetchLandlords]);

  useAutoRefresh(() => fetchLandlords(false));

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this landlord?")) {
      return;
    }

    try {
      await api.delete(`/landlords/${id}`);
      setLandlords(landlords.filter((landlord) => landlord.id !== id));
      toast.success("Landlord deleted successfully");
      fetchLandlords(); // Ensure sync
    } catch (error) {
      console.error("Failed to delete landlord:", error);
      toast.error(error.response?.data?.error || "Failed to delete landlord");
    }
  };

  const filteredLandlords = landlords.filter(
    (landlord) =>
      landlord.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      landlord.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (landlord.company_name &&
        landlord.company_name.toLowerCase().includes(searchTerm.toLowerCase())),
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
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">Landlord Management</h1>
          <p className="text-muted mb-0">
            Manage property owners and their assignments
          </p>
        </div>
        <Link to="/landlords/new" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>
          Add Landlord
        </Link>
      </div>

      {/* Search and Stats */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-8">
          <div className="card-light p-3">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search landlords by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="metric-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="metric-label mb-1">Total Landlords</p>
                <h3 className="metric-value mb-0">{landlords.length}</h3>
              </div>
              <div
                className="metric-icon"
                style={{
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  width: "50px",
                  height: "50px",
                }}
              >
                <i className="bi bi-person-circle text-white"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Landlords Table */}
      <div className="card-light">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="bg-light">
              <tr>
                <th className="px-4 py-3 text-dark fw-semibold">Name</th>
                <th className="px-4 py-3 text-dark fw-semibold">Email</th>
                <th className="px-4 py-3 text-dark fw-semibold">Company</th>
                <th className="px-4 py-3 text-dark fw-semibold">Phone</th>
                <th className="px-4 py-3 text-dark fw-semibold text-center">
                  Properties
                </th>
                <th className="px-4 py-3 text-dark fw-semibold text-end">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLandlords.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                    {searchTerm
                      ? "No landlords found matching your search"
                      : "No landlords found. Add your first landlord to get started."}
                  </td>
                </tr>
              ) : (
                filteredLandlords.map((landlord) => (
                  <tr key={landlord.id}>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center">
                        <div
                          className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{ width: "40px", height: "40px" }}
                        >
                          {landlord.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-semibold text-dark">
                            {landlord.name}
                          </div>
                          <small className="text-muted">
                            ID: {landlord.id}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-dark">{landlord.email}</td>
                    <td className="px-4 py-3">
                      {landlord.company_name ? (
                        <span className="text-dark">
                          {landlord.company_name}
                        </span>
                      ) : (
                        <span className="text-muted fst-italic">
                          Not specified
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {landlord.phone ? (
                        <span className="text-dark">{landlord.phone}</span>
                      ) : (
                        <span className="text-muted fst-italic">
                          Not specified
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="badge bg-primary rounded-pill">
                        {landlord.properties_count || 0}{" "}
                        {landlord.properties_count === 1
                          ? "Property"
                          : "Properties"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="btn-group">
                        <Link
                          to={`/landlords/${landlord.id}/edit`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          <i className="bi bi-pencil"></i>
                        </Link>
                        <Link
                          to={`/landlords/${landlord.id}/properties`}
                          className="btn btn-sm btn-outline-info"
                          title="View Properties"
                        >
                          <i className="bi bi-building"></i>
                        </Link>
                        <button
                          onClick={() => handleDelete(landlord.id)}
                          className="btn btn-sm btn-outline-danger"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      {landlords.length > 0 && (
        <div className="row g-4 mt-2">
          <div className="col-12">
            <div className="card-light p-4">
              <h6 className="fw-bold mb-3">Quick Stats</h6>
              <div className="row g-3">
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <h4 className="text-primary fw-bold mb-1">
                      {landlords.reduce(
                        (acc, l) => acc + (l.properties_count || 0),
                        0,
                      )}
                    </h4>
                    <p className="text-muted small mb-0">
                      Total Properties Managed
                    </p>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <h4 className="text-success fw-bold mb-1">
                      {landlords.filter((l) => l.properties_count > 0).length}
                    </h4>
                    <p className="text-muted small mb-0">Active Landlords</p>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <h4 className="text-warning fw-bold mb-1">
                      {
                        landlords.filter(
                          (l) =>
                            !l.properties_count || l.properties_count === 0,
                        ).length
                      }
                    </h4>
                    <p className="text-muted small mb-0">Without Properties</p>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <h4 className="text-info fw-bold mb-1">
                      {landlords.filter((l) => l.company_name).length}
                    </h4>
                    <p className="text-muted small mb-0">Corporate Landlords</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
