import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useRefresh } from "../contexts/RefreshContext";

export default function LandlordForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { triggerRefresh } = useRefresh();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    company_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const userRole = sessionStorage.getItem("role");
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (isEdit) {
      fetchLandlord();
    }
  }, [id]);

  const fetchLandlord = async () => {
    try {
      const response = await api.get(`/landlords/${id}`);
      setFormData({
        name: response.data.name,
        email: response.data.email,
        password: "", // Don't populate password
        phone: response.data.phone || "",
        company_name: response.data.company_name || "",
      });
    } catch (error) {
      console.error("Failed to fetch landlord:", error);
      setError("Failed to load landlord data");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    if (e.target.files.length > 4) {
      alert("You can only upload up to 4 images");
      return;
    }
    setImages(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = new FormData();
      // Append basic fields
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          // Skip empty password on edit
          if (key === "password" && isEdit && !formData[key]) return;
          data.append(key, formData[key]);
        }
      });

      // Append images if any
      if (images.length > 0) {
        images.forEach((image) => {
          data.append("property_images[]", image);
        });
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      if (isEdit) {
        await api.post(`/landlords/${id}?_method=PUT`, data, config);
      } else {
        await api.post("/landlords", data, config);
      }
      triggerRefresh();
      navigate("/landlords");
    } catch (error) {
      console.error("Failed to save landlord:", error);
      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to save landlord",
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 p-4 bg-light">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">
            {isEdit ? "Edit Landlord" : "Add New Landlord"}
          </h1>
          <p className="text-muted mb-0">
            {isEdit
              ? "Update landlord information"
              : "Create a new landlord account"}
          </p>
        </div>
        <button
          onClick={() => navigate("/landlords")}
          className="btn btn-outline-secondary"
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back
        </button>
      </div>

      {/* Form */}
      <div className="row">
        <div className="col-12 col-lg-8 col-xl-6">
          <div className="card-light p-4">
            <form onSubmit={handleSubmit}>
              {error && (
                <div
                  className="alert alert-danger alert-dismissible fade show"
                  role="alert"
                >
                  {error}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setError("")}
                  ></button>
                </div>
              )}

              {/* Basic Information */}
              <h6 className="fw-bold mb-3 text-dark">
                <i className="bi bi-person-circle me-2"></i>
                Basic Information
              </h6>

              <div className="mb-3">
                <label htmlFor="name" className="form-label fw-semibold">
                  Full Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter full name"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="email" className="form-label fw-semibold">
                  Email Address <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="landlord@example.com"
                />
                <small className="text-muted">
                  This will be used for login credentials
                </small>
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="form-label fw-semibold">
                  Password {!isEdit && <span className="text-danger">*</span>}
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!isEdit}
                  placeholder={
                    isEdit
                      ? "Leave blank to keep current password"
                      : "Min. 8 characters"
                  }
                  minLength={8}
                />
                {isEdit && (
                  <small className="text-muted">
                    Leave blank to keep the current password
                  </small>
                )}
              </div>

              {/* Contact Information */}
              <h6 className="fw-bold mb-3 mt-4 text-dark">
                <i className="bi bi-telephone me-2"></i>
                Contact Information
              </h6>

              <div className="mb-3">
                <label htmlFor="phone" className="form-label fw-semibold">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="form-control"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                required />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="company_name"
                  className="form-label fw-semibold"
                >
                  Company Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Company or business name (optional)"
                required />
                <small className="text-muted">
                  Optional company or business name for corporate landlords
                </small>
              </div>

              {/* Action Buttons */}
              <div className="d-flex gap-3 mt-4">
                <button
                  type="submit"
                  className="btn btn-primary flex-grow-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {isEdit ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <i
                        className={`bi ${isEdit ? "bi-check-circle" : "bi-plus-circle"} me-2`}
                      ></i>
                      {isEdit ? "Update Landlord" : "Create Landlord"}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => navigate("/landlords")}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Property & Unit Information (Admin Only) */}
          {(userRole === "super_admin" || userRole === "admin") && !isEdit && (
            <div className="card-light p-4 mt-4">
              <h6 className="fw-bold mb-3 text-dark">
                <i className="bi bi-building me-2"></i>
                Property & Unit Details (Optional)
              </h6>
              <p className="text-muted small mb-3">
                Add an initial property and unit for this landlord.
              </p>

              {/* Property Details */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Property Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="property_name"
                  value={formData.property_name || ""}
                  onChange={handleChange}
                  placeholder="e.g. Sunset Apartments"
                required />
              </div>

              {formData.property_name && (
                <>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Address *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="property_address"
                      value={formData.property_address || ""}
                      onChange={handleChange}
                      required
                      placeholder="Property Address"
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Type</label>
                      <select
                        className="form-select"
                        name="property_type"
                        value={formData.property_type || "Residential"}
                        onChange={handleChange}
                      required >
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Industrial">Industrial</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Description
                    </label>
                    <textarea
                      className="form-control"
                      name="property_description"
                      value={formData.property_description || ""}
                      onChange={handleChange}
                      rows="2"
                    required ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Images (Max 4)
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                    required />
                    <small className="text-muted">Select up to 4 images</small>
                  </div>

                  <hr className="my-4" />

                  <h6 className="fw-bold mb-3 text-dark">
                    <i className="bi bi-door-open me-2"></i>
                    Initial Unit Details
                  </h6>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">
                        Unit Number *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="unit_number"
                        value={formData.unit_number || ""}
                        onChange={handleChange}
                        required
                        placeholder="e.g. 101"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">
                        Rent Amount *
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        name="unit_rent"
                        value={formData.unit_rent || ""}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">
                        Unit Type
                      </label>
                      <select
                        className="form-select"
                        name="unit_type"
                        value={formData.unit_type || "1BHK"}
                        onChange={handleChange}
                      required >
                        <option value="Studio">Studio</option>
                        <option value="1BHK">1BHK</option>
                        <option value="2BHK">2BHK</option>
                        <option value="3BHK">3BHK</option>
                        <option value="Penthouse">Penthouse</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Floor</label>
                      <input
                        type="number"
                        className="form-control"
                        name="unit_floor"
                        value={formData.unit_floor || ""}
                        onChange={handleChange}
                        placeholder="Floor number"
                      required />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Info Card */}
          <div className="card-light p-4 mt-3">
            <h6 className="fw-bold mb-3 text-dark">
              <i className="bi bi-info-circle me-2"></i>
              Information
            </h6>
            <ul className="list-unstyled mb-0 small text-muted">
              <li className="mb-2">
                <i className="bi bi-check-circle text-success me-2"></i>
                Landlords can manage their assigned properties
              </li>
              <li className="mb-2">
                <i className="bi bi-check-circle text-success me-2"></i>
                View tenants and lease information for their properties
              </li>
              <li className="mb-2">
                <i className="bi bi-check-circle text-success me-2"></i>
                Track rent payments and property occupancy
              </li>
              <li>
                <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                {isEdit
                  ? "Changing the email will update login credentials"
                  : "Email will be used for login access"}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
