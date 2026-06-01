import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useRefresh } from "../contexts/RefreshContext";

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { triggerRefresh } = useRefresh();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "tenant",
  });

  useEffect(() => {
    // Check if user is super admin or admin
    const userRole = sessionStorage.getItem("role");
    if (userRole !== "super_admin" && userRole !== "admin") {
      navigate("/dashboard");
      return;
    }

    if (isEdit) {
      fetchUser();
    }
  }, [id, isEdit, navigate]);

  const fetchUser = async () => {
    try {
      const response = await api.get(`/users/${id}`);
      setFormData({
        name: response.data.name,
        email: response.data.email,
        password: "", // Don't populate password for security
        role: response.data.role,
      });
    } catch (error) {
      console.error("Failed to fetch user:", error);
      alert("Failed to load user data");
      navigate("/users");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data - exclude empty password for edit
      const submitData = { ...formData };
      if (isEdit && !submitData.password) {
        delete submitData.password;
      }

      if (isEdit) {
        await api.put(`/users/${id}`, submitData);
        alert("User updated successfully");
      } else {
        if (!submitData.password) {
          alert("Password is required");
          setLoading(false);
          return;
        }
        await api.post("/users", submitData);
        alert("User created successfully");
      }
      triggerRefresh();
      navigate("/users");
    } catch (error) {
      console.error("Failed to save user:", error);
      const errorMessage =
        error.response?.data?.message ||
        JSON.stringify(error.response?.data) ||
        "Failed to save user";
      alert(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-4">
      <div className="card shadow" style={{ width: "100%", maxWidth: "600px" }}>
        <div className="card-body p-4">
          <div className="mb-4">
            <h2 className="h3 fw-bold mb-1">
              {isEdit ? "Edit User" : "Create New User"}
            </h2>
            <p className="text-muted mb-0">
              {isEdit
                ? "Update user information and role"
                : "Add a new user to the system"}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold">
                  Full Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">
                  Email Address <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">
                  Password {!isEdit && <span className="text-danger">*</span>}
                  {isEdit && (
                    <span className="text-muted small">
                      {" "}
                      (leave blank to keep current)
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-control"
                  placeholder={
                    isEdit ? "Enter new password (optional)" : "Enter password"
                  }
                  required={!isEdit}
                  minLength="6"
                />
                {!isEdit && (
                  <div className="form-text">
                    Password must be at least 6 characters long
                  </div>
                )}
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">
                  Role <span className="text-danger">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="property_officer">Property Officer</option>
                  <option value="accounting_staff">Accounting Staff</option>
                  <option value="maintenance_staff">Maintenance Staff</option>
                  <option value="landlord">Landlord</option>
                  <option value="tenant">Tenant</option>
                </select>
                <div className="form-text">
                  Select the user's role in the system
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between gap-2 mt-4 pt-3 border-top">
              <button
                type="button"
                onClick={() => navigate("/users")}
                className="btn btn-outline-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary px-4"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    {isEdit ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{isEdit ? "Update User" : "Create User"}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
