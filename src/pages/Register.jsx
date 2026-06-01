import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    role: "tenant", // Default role
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const validateField = async (name, value, currentFormData = formData) => {
    let error = "";
    const trimmedVal = value.trim();

    if (!trimmedVal) {
      if (name !== 'role') error = "This field is required.";
      setErrors((prev) => ({ ...prev, [name]: error }));
      return error;
    }

    switch (name) {
      case "name":
        if (trimmedVal.length < 2) error = "Name is too short.";
        break;
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedVal)) {
          error = "Please enter a valid email address.";
        } else {
          try {
            const res = await api.post("/auth/check-duplicate", { field: "email", value: trimmedVal });
            if (res.data.exists) error = "This email is already registered.";
          } catch (err) {}
        }
        break;
      case "phone":
        const phoneRegex = /^\d{10,15}$/;
        if (!phoneRegex.test(trimmedVal)) {
          error = "Phone number must be a valid numeric format, 10-15 digits.";
        } else {
          try {
            const res = await api.post("/auth/check-duplicate", { field: "phone", value: trimmedVal });
            if (res.data.exists) error = "This phone number is already in use.";
          } catch (err) {}
        }
        break;
      case "username":
        const usernameRegex = /^[a-zA-Z0-9]{3,20}$/;
        if (!usernameRegex.test(trimmedVal)) {
          error = "Username must be alphanumeric only, 3-20 characters, no spaces.";
        } else {
          try {
            const res = await api.post("/auth/check-duplicate", { field: "username", value: trimmedVal });
            if (res.data.exists) error = "This username is already taken.";
          } catch (err) {}
        }
        break;
      case "password":
        if (value.length < 8) {
          error = "Password must be at least 8 characters.";
        } else if (!/[A-Z]/.test(value)) {
          error = "Password must contain at least one uppercase letter.";
        } else if (!/[0-9]/.test(value)) {
          error = "Password must contain at least one number.";
        } else if (!/[^a-zA-Z0-9]/.test(value)) {
          error = "Password must contain at least one special character.";
        }
        break;
      case "password_confirmation":
        if (value !== currentFormData.password) {
          error = "Passwords do not match.";
        }
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error locally on change to allow user to retry typing
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleBlur = async (e) => {
    const { name, value } = e.target;
    await validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Trigger validation for all fields
    const newErrors = {};
    let hasError = false;
    for (const key of Object.keys(formData)) {
      if (key !== "role") {
        const error = await validateField(key, formData[key], formData);
        if (error) {
          newErrors[key] = error;
          hasError = true;
        }
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
    }

    if (hasError) {
      toast.error("Please fix the errors in the form before submitting.");
      return;
    }

    try {
      const response = await api.post("/auth/register", formData);
      navigate("/login");
      toast.success("Registration successful! Please sign in.");
    } catch (error) {
      console.error("Registration failed:", error);
      if (error.response?.data) {
          let errorMsg = "Registration failed.";
          if (typeof error.response.data === 'object' && !error.response.data.message && !error.response.data.error) {
              // Laravel validation format
              const firstKey = Object.keys(error.response.data)[0];
              errorMsg = error.response.data[firstKey][0];
              const backendErrors = {};
              for (const key in error.response.data) {
                  backendErrors[key] = error.response.data[key][0];
              }
              setErrors(prev => ({...prev, ...backendErrors}));
          } else {
             errorMsg = error.response.data.error || error.response.data.message || error.message;
          }
          toast.error(errorMsg);
      } else {
        toast.error("Registration failed: " + error.message);
      }
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light py-5">
      <div className="card shadow" style={{ width: "100%", maxWidth: "500px" }}>
        <div className="card-body p-4 p-md-5">
          <h2 className="card-title text-center mb-4 h3 fw-bold" style={{ color: "#059669" }}>Register</h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label fw-bold">Full Name</label>
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                required
              />
              {errors.name && <div className="invalid-feedback">{errors.name}</div>}
            </div>
            
            <div className="mb-3">
              <label className="form-label fw-bold">Username</label>
              <input
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                required
              />
              {errors.username ? (
                 <div className="invalid-feedback">{errors.username}</div>
              ) : (
                 <small className="text-muted d-block mt-1">Alphanumeric, 3-20 chars</small>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                required
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>
            
            <div className="mb-3">
              <label className="form-label fw-bold">Phone Number</label>
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                required
              />
              {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
            </div>
            
            <div className="mb-3">
              <label className="form-label fw-bold">Password</label>
              <div className="input-group">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>
              {!errors.password && (
                <small className="text-muted d-block mt-1">Min 8 chars, 1 uppercase, 1 number, 1 special</small>
              )}
            </div>
            
            <div className="mb-3">
              <label className="form-label fw-bold">Confirm Password</label>
              <div className="input-group">
                <input
                  name="password_confirmation"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-control ${errors.password_confirmation ? 'is-invalid' : ''}`}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
                {errors.password_confirmation && <div className="invalid-feedback">{errors.password_confirmation}</div>}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="form-label fw-bold">Account Type</label>
              <select
                name="role"
                onChange={handleChange}
                className="form-select"
                value={formData.role}
                required
              >
                <option value="tenant">Tenant</option>
                <option value="landlord">Landlord</option>
                <option value="super_admin" disabled hidden>Super Admin</option>
                <option value="admin" disabled hidden>Admin</option>
                <option value="property_officer" disabled hidden>Property Officer</option>
                <option value="accounting_staff" disabled hidden>Accounting Staff</option>
                <option value="maintenance_staff" disabled hidden>Maintenance Staff</option>
              </select>
            </div>
            
            <button type="submit" className="btn btn-success w-100 fw-bold py-2 shadow-sm" style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", border: "none" }}>
              Create Account
            </button>
            <div className="text-center mt-4">
              <span className="text-muted">Already have an account? </span>
              <a href="/login" className="text-decoration-none fw-semibold" style={{ color: "#059669" }}>Login</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
