import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import useAutoRefresh from "../hooks/useAutoRefresh";
import api from "../services/api";

const FALLBACK_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f1f5f9"/><g fill="%2394a3b8"><path d="M160 120h80v100h-80z"/><path d="M200 80l-70 50h140z"/><rect x="180" y="150" width="15" height="30" fill="%23cbd5e1"/><rect x="205" y="150" width="15" height="30" fill="%23cbd5e1"/></g><text x="50%" y="85%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="%2364748b">Property Photo Placeholder</text></svg>`;

const getImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== "string") return FALLBACK_IMAGE;
  if (imagePath.startsWith("data:") || imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const baseUrl = (import.meta.env.VITE_API_URL || "https://upms-backend.onrender.com").replace(/\/api\/?$/, "");
  const clean = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
  if (clean.startsWith("storage/")) {
    return `${baseUrl}/${clean}`;
  }
  return `${baseUrl}/storage/${clean}`;
};

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unitFilter, setUnitFilter] = useState("All");
  const userRole = sessionStorage.getItem("role");
  const [showLandlordModal, setShowLandlordModal] = useState(false);
  const [landlordsList, setLandlordsList] = useState([]);
  const [selectedLandlordId, setSelectedLandlordId] = useState("");
  const [assigningLoading, setAssigningLoading] = useState(false);

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [newPhotosBase64, setNewPhotosBase64] = useState([]);

  const handlePhotoFileSelect = (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    const base64Promises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(base64Promises).then((base64Strings) => {
      setNewPhotosBase64(base64Strings);
    });
  };

  const handleSavePhotos = async (e) => {
    e.preventDefault();
    if (newPhotosBase64.length === 0) return;
    setUploadingPhotos(true);
    try {
      await api.put(`/properties/${id}`, { images: newPhotosBase64 });
      setShowPhotoModal(false);
      setNewPhotosBase64([]);
      fetchPropertyDetails(false);
    } catch (err) {
      console.error("Failed to update photos:", err);
      alert("Failed to save property photos");
    } finally {
      setUploadingPhotos(false);
    }
  };

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

  const openLandlordModal = async () => {
    try {
      const res = await api.get("/landlords");
      setLandlordsList(Array.isArray(res.data) ? res.data : []);
      setSelectedLandlordId(data?.property?.landlord_id || "");
      setShowLandlordModal(true);
    } catch (err) {
      console.error("Failed to fetch landlords list:", err);
    }
  };

  const handleSaveLandlord = async (e) => {
    e.preventDefault();
    setAssigningLoading(true);
    try {
      await api.put(`/properties/${id}`, { landlord_id: selectedLandlordId || null });
      setShowLandlordModal(false);
      fetchPropertyDetails(false);
    } catch (err) {
      console.error("Failed to update landlord:", err);
      alert("Failed to update landlord assignment");
    } finally {
      setAssigningLoading(false);
    }
  };

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
      <div className="card-light p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">
            <i className="bi bi-images me-2"></i>
            Property Photos
          </h5>
          {(userRole === "super_admin" || userRole === "admin" || userRole === "property_officer") && (
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => setShowPhotoModal(true)}
            >
              <i className="bi bi-upload me-1"></i>
              {images && images.length > 0 ? "Manage Photos" : "+ Upload Photos"}
            </button>
          )}
        </div>

        {images && images.length > 0 ? (
          <div className="row g-3">
            {images.map((image, index) => (
              <div key={index} className="col-md-6 col-lg-3">
                <div
                  className="position-relative overflow-hidden rounded shadow-sm border"
                  style={{
                    height: "200px",
                    cursor: "pointer",
                    transition: "transform 0.3s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.03)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  <img
                    src={getImageUrl(image)}
                    alt={`${property.name} - Photo ${index + 1}`}
                    className="w-100 h-100 object-fit-cover"
                    onError={(e) => {
                      e.target.src = FALLBACK_IMAGE;
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 bg-white rounded border border-dashed">
            <i className="bi bi-camera text-muted fs-1 d-block mb-2"></i>
            <p className="text-muted small mb-3">
              No photos uploaded for this property yet.
            </p>
            {(userRole === "super_admin" || userRole === "admin" || userRole === "property_officer") && (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setShowPhotoModal(true)}
              >
                <i className="bi bi-cloud-upload me-1"></i> Upload Photos Now
              </button>
            )}
          </div>
        )}
      </div>

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
        {/* Landlord Information (Or Unassigned Card) */}
        <div className="col-md-6">
          <div className="card-light p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-person-circle me-2"></i>
                Landlord Information
              </h5>
              {(userRole === "super_admin" || userRole === "admin" || userRole === "property_officer") && (
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={openLandlordModal}
                >
                  <i className="bi bi-pencil-square me-1"></i>
                  {property.landlord ? "Change Landlord" : "Assign Landlord"}
                </button>
              )}
            </div>

            {property.landlord ? (
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
            ) : (
              <div className="text-center py-3">
                <div className="badge bg-warning text-dark mb-2 px-3 py-2 fs-6">
                  <i className="bi bi-exclamation-circle me-1"></i> Unassigned Property
                </div>
                <p className="text-muted small mb-3">
                  No landlord is currently assigned to this property.
                </p>
                {(userRole === "super_admin" || userRole === "admin" || userRole === "property_officer") && (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={openLandlordModal}
                  >
                    <i className="bi bi-person-plus me-1"></i> Assign Landlord Now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

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

      {/* Assign / Change Landlord Modal */}
      {showLandlordModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-person-fill-gear me-2"></i>
                  {property.landlord ? "Change Property Landlord" : "Assign Landlord to Property"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowLandlordModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSaveLandlord}>
                <div className="modal-body p-4">
                  <p className="text-muted small mb-3">
                    Select a landlord to associate with <strong>{property.name}</strong>. You can change or remove landlord assignment at any time.
                  </p>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Select Landlord</label>
                    <select
                      className="form-select border-primary"
                      value={selectedLandlordId}
                      onChange={(e) => setSelectedLandlordId(e.target.value)}
                    >
                      <option value="">-- Unassigned (No Landlord) --</option>
                      {landlordsList.map((ll) => (
                        <option key={ll.id} value={ll.id}>
                          {ll.name} {ll.company_name ? `(${ll.company_name})` : ""} [{ll.email}]
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowLandlordModal(false)}
                    disabled={assigningLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 fw-bold"
                    disabled={assigningLoading}
                  >
                    {assigningLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving...
                      </>
                    ) : (
                      "Save Assignment"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {showPhotoModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-images me-2"></i>
                  Manage Property Photos - {property.name}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowPhotoModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSavePhotos}>
                <div className="modal-body p-4">
                  <p className="text-muted small mb-3">
                    Upload photos for <strong>{property.name}</strong>. Selected photos are stored persistently. Select up to 4 images.
                  </p>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Select Images (Max 4)</label>
                    <input
                      type="file"
                      className="form-control border-primary"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoFileSelect}
                    />
                    <small className="text-muted">Choose 1 to 4 image files (PNG, JPG, WEBP)</small>
                  </div>

                  {newPhotosBase64.length > 0 && (
                    <div className="mt-3">
                      <label className="form-label fw-bold small text-muted">Preview Selected Photos:</label>
                      <div className="row g-2">
                        {newPhotosBase64.map((b64, idx) => (
                          <div key={idx} className="col-3">
                            <img
                              src={b64}
                              alt={`Preview ${idx + 1}`}
                              className="w-100 rounded border"
                              style={{ height: "90px", objectFit: "cover" }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPhotoModal(false)}
                    disabled={uploadingPhotos}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 fw-bold"
                    disabled={uploadingPhotos || newPhotosBase64.length === 0}
                  >
                    {uploadingPhotos ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Uploading...
                      </>
                    ) : (
                      "Save Property Photos"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
