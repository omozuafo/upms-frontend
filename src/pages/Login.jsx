import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError("");
    try {
      console.log("Attempting login with:", { email, password: "***" });
      const response = await api.post("/auth/login", { email, password });
      console.log("Login successful:", response.data);
      sessionStorage.setItem("token", response.data.access_token);
      sessionStorage.setItem("role", response.data.user.role);
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.response?.data);
      const errorMessage =
        error.response?.data?.error === "Unauthorized" ? "Invalid email or password. Please try again." : 
        (error.response?.data?.error ||
        error.response?.data?.message ||
        "Invalid email or password. Please try again.");
        
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="card shadow" style={{ width: "100%", maxWidth: "400px" }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <div
              className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{ width: "60px", height: "60px" }}
            >
              <i className="bi bi-building fs-2"></i>
            </div>
            <h2 className="h3 fw-bold mb-1">Welcome Back</h2>
            <p className="text-muted small">Sign in to your account</p>
          </div>
          
          {formError && (
            <div className="alert alert-danger d-flex align-items-center mb-4 shadow-sm border-0" role="alert">
              <i className="bi bi-exclamation-octagon-fill text-danger fs-4 me-3"></i>
              <div className="text-start">
                  <div className="fw-bold text-danger-emphasis">Login Failed</div>
                  <small className="text-danger-emphasis">{formError}</small>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">
                <i className="bi bi-envelope me-2"></i>
                Email
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <i className="bi bi-at"></i>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">
                <i className="bi bi-lock me-2"></i>
                Password
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <i className="bi bi-key"></i>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100 fw-bold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Signing in...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Sign In
                </>
              )}
            </button>
            <div className="text-center mt-3">
              <a href="/register" className="text-decoration-none small">
                <i className="bi bi-person-plus me-1"></i>
                Don't have an account? Register
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
