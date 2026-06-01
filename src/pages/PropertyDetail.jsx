import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import useAutoRefresh from "../hooks/useAutoRefresh";
import api from "../services/api";

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unitFilter, setUnitFilter] = useState("All");
  const userRole = sessionStorage.getItem("role");

  const fetchPropertyDetails = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);
        const response = await api.get(`/properties/${id}`);
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch property details:", error);
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    fetchPropertyDetails(true);
  }, [fetchPropertyDetails]);

  useAutoRefresh(() => fetchPropertyDetails(false));

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-vh-100 p-4 bg-light">
        <div className="alert alert-danger">Property not found</div>
      </div>
    );
  }

  const { property, stats, tenants } = data;

  const filteredUnits = property.units
    ? property.units.filter((unit) => {
        if (unitFilter === "All") return true;
        return unit.status === unitFilter;
      })
    : [];

  const images = property.images
    ? typeof property.images === "string"
      ? JSON.parse(property.images)
      : property.images
    : [];

  return (
    <div className="min-vh-100 p-4 bg-light">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button
            onClick={() => navigate("/properties")}
            className="btn btn-link text-primary p-0 mb-2"
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Properties
          </button>
          <h1 className="h4 fw-bold text-dark mb-1">
            <i className="bi bi-building me-2"></i>
            {property.name}
          </h1>
          <p className="text-muted mb-0">
            <i className="bi bi-geo-alt me-2"></i>
            {property.address}
          </p>
        </div>
        <div>
          <span
            className={`badge ${property.status === "Active" ? "bg-success" : "bg-secondary"} me-2`}
          >
            {property.status}
          </span>
          <span className="badge bg-info">{property.type}</span>
        </div>
      </div>

      {/* Property Photos Gallery */}
      {images && images.length > 0 && (
        <div className="card-light p-4 mb-4">
          <h5 className="fw-bold mb-3">
            <i className="bi bi-images me-2"></i>
            Property Photos
          </h5>
          <div className="row g-3">
            {images.map((image, index) => (
              <div key={index} className="col-md-6 col-lg-3">
                <div
                  className="position-relative overflow-hidden rounded"
                  style={{
                    height: "200px",
                    cursor: "pointer",
                    transition: "transform 0.3s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.05)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  <img
                    src={`http://127.0.0.1:8000/storage/${image}`}
                    alt={`${property.name} - Photo ${index + 1}`}
                    className="w-100 h-100 object-fit-cover"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/400x300?text=Image+Not+Found";
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted small mb-1">Total Units</p>
                <h3 className="h4 fw-bold mb-0">{stats.total_units}</h3>
              </div>
              <div
                className="metric-icon"
                style={{
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                }}
              >
                <i className="bi bi-grid-3x3 text-white"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted small mb-1">Occupied Units</p>
                <h3 className="h4 fw-bold mb-0">{stats.occupied_units}</h3>
              </div>
              <div
                className="metric-icon"
                style={{
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                }}
              >
                <i className="bi bi-check-circle text-white"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted small mb-1">Vacant Units</p>
                <h3 className="h4 fw-bold mb-0">{stats.vacant_units}</h3>
              </div>
              <div
                className="metric-icon"
                style={{
                  background:
                    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                }}
              >
                <i className="bi bi-door-open text-white"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="metric-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted small mb-1">Occupancy Rate</p>
                <h3 className="h4 fw-bold mb-0">{stats.occupancy_rate}%</h3>
              </div>
              <div
                className="metric-icon"
                style={{
                  background:
                    "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                }}
              >
                <i className="bi bi-percent text-white"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Landlord Information */}
        {property.landlord && (
          <div className="col-md-6">
            <div className="card-light p-4 h-100">
              <h5 className="fw-bold mb-3">
                <i className="bi bi-person-circle me-2"></i>
                Landlord Information
              </h5>
              <div className="d-flex align-items-start">
                <div
                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: "50px", height: "50px", flexShrink: 0 }}
                >
                  <i className="bi bi-person-fill fs-4"></i>
                </div>
                <div>
                  <h6 className="fw-semibold mb-1">{property.landlord.name}</h6>
                  {property.landlord.company_name && (
                    <p className="text-muted small mb-2">
                      <i className="bi bi-building me-1"></i>
                      {property.landlord.company_name}
                    </p>
                  )}
                  <p className="text-muted small mb-1">
                    <i className="bi bi-envelope me-2"></i>
                    {property.landlord.email}
                  </p>
                  {property.landlord.phone && (
                    <p className="text-muted small mb-0">
                      <i className="bi bi-telephone me-2"></i>
                      {property.landlord.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Property Description */}
        {property.description && (
          <div className="col-md-6">
            <div className="card-light p-4 h-100">
              <h5 className="fw-bold mb-3">
                <i className="bi bi-info-circle me-2"></i>
                Description
              </h5>
              <p className="text-muted mb-0">{property.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Units Table */}
      <div className="card-light p-4 mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">
            <i className="bi bi-door-closed me-2"></i>
            Units ({property.units?.length || 0})
          </h5>
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn btn-sm ${unitFilter === "All" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setUnitFilter("All")}
            >
              All
            </button>
            <button
              type="button"
              className={`btn btn-sm ${unitFilter === "Occupied" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setUnitFilter("Occupied")}
            >
              Occupied
            </button>
            <button
              type="button"
              className={`btn btn-sm ${unitFilter === "Vacant" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setUnitFilter("Vacant")}
            >
              Vacant
            </button>
          </div>
        </div>

        {filteredUnits && filteredUnits.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>
                    <i className="bi bi-hash me-1"></i>Unit Number
                  </th>
                  <th>
                    <i className="bi bi-door-open me-1"></i>Type
                  </th>
                  <th>
                    <i className="bi bi-cash me-1"></i>Rent
                  </th>
                  <th>
                    <i className="bi bi-info-circle me-1"></i>Status
                  </th>
                  <th>
                    <i className="bi bi-person me-1"></i>Current Tenant
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUnits.map((unit) => (
                  <tr key={unit.id}>
                    <td className="fw-semibold">{unit.unit_number}</td>
                    <td>{unit.type}</td>
                    <td>
                      ₦{parseFloat(unit.rent_amount || 0).toLocaleString()}
                    </td>
                    <td>
                      <span
                        className={`badge ${unit.status === "Occupied" ? "bg-success" : unit.status === "Vacant" ? "bg-warning" : "bg-secondary"}`}
                      >
                        {unit.status}
                      </span>
                    </td>
                    <td>
                      {unit.tenant ? (
                        <div>
                          <div className="fw-semibold">{unit.tenant.name}</div>
                          <small className="text-muted d-block mb-2">
                            {unit.tenant.email}
                          </small>
                          {userRole === "accounting_staff" && (
                            <Link to={`/tenants/${unit.tenant.id}`} className="btn btn-sm btn-outline-primary" style={{ padding: '0.125rem 0.5rem', fontSize: '0.75rem' }}>
                              <i className="bi bi-eye me-1"></i> View Payments
                            </Link>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted text-center py-4 mb-0">No units found</p>
        )}
      </div>

      {/* Tenants List */}
      {tenants && tenants.length > 0 && (
        <div className="card-light p-4 mt-4">
          <h5 className="fw-bold mb-3">
            <i className="bi bi-people me-2"></i>
            Tenants ({tenants.length})
          </h5>
          {userRole === "accounting_staff" ? (
             <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                        <tr>
                            <th>Tenant Name</th>
                            <th>Unit Acquired</th>
                            <th>Rent Expiration</th>
                            <th>Total Paid</th>
                            <th>Outstanding</th>
                            <th className="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tenants.map(tenant => (
                            <tr key={tenant.id}>
                                <td>
                                    <div className="fw-semibold">{tenant.name}</div>
                                    <div className="small text-muted">{tenant.email}</div>
                                </td>
                                <td><span className="badge bg-secondary">{tenant.unit_number || "N/A"}</span></td>
                                <td>
                                    {tenant.rent_expiration ? (
                                        <span className="text-danger small"><i className="bi bi-calendar-event me-1"></i>{tenant.rent_expiration}</span>
                                    ) : <span className="text-muted">-</span>}
                                </td>
                                <td className="text-success fw-semibold">₦{parseFloat(tenant.total_paid || 0).toLocaleString()}</td>
                                <td className="text-danger fw-bold">₦{parseFloat(tenant.outstanding_balance || 0).toLocaleString()}</td>
                                <td className="text-end">
                                    <Link to={`/tenants/${tenant.id}`} className="btn btn-sm btn-outline-primary">
                                        <i className="bi bi-eye me-1"></i> View Payments
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
          ) : (
            <div className="row g-3">
              {tenants.map((tenant) => (
                <div key={tenant.id} className="col-md-6 col-lg-4">
                  <div className="border rounded p-3">
                    <div className="d-flex align-items-start">
                      <div
                        className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{ width: "40px", height: "40px", flexShrink: 0 }}
                      >
                        <i className="bi bi-person-fill"></i>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="fw-semibold mb-1">{tenant.name}</h6>
                        <p className="text-muted small mb-1">
                          <i className="bi bi-envelope me-1"></i>
                          {tenant.email}
                        </p>
                        {tenant.phone && (
                          <p className="text-muted small mb-1">
                            <i className="bi bi-telephone me-1"></i>
                            {tenant.phone}
                          </p>
                        )}
                        {tenant.rent_expiration && (
                          <p className="text-danger small mb-1">
                            <i className="bi bi-calendar-event me-1"></i>
                            Expires: {tenant.rent_expiration}
                          </p>
                        )}

                        <div className="mt-2 pt-2 border-top">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="small text-muted">Total Paid:</span>
                            <span className="small fw-bold text-success">
                              ₦{parseFloat(tenant.total_paid || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="small text-muted">Outstanding:</span>
                            <span className="small fw-bold text-danger">
                              ₦{parseFloat(tenant.outstanding_balance || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
