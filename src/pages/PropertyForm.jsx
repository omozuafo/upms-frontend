import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import ImageUpload from "../components/ImageUpload";
import { useRefresh } from "../contexts/RefreshContext";

export default function PropertyForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    type: "Residential",
    status: "Active",
    units_count: "", // Keep as string for input
    landlord_id: "",
    loading: false,
  });
  const { triggerRefresh } = useRefresh();
  const [currentUser, setCurrentUser] = useState(null);
  const [landlords, setLandlords] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const fetchUserAndLandlords = async () => {
      try {
        const response = await api.post("/auth/me");
        const user = response.data;
        setCurrentUser(user);
        
        if (user.role === "landlord") {
          setFormData((prev) => ({ ...prev, landlord_id: user.id }));
        } else if (user.role === "admin" || user.role === "super_admin") {
          // Fetch landlords for admin
          const landlordsRes = await api.get("/landlords");
          setLandlords(landlordsRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      }
    };
    fetchUserAndLandlords();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError("");
  };

  const handleImagesChange = (images) => {
    setSelectedImages(images);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that exactly 4 images are uploaded
    if (selectedImages.length !== 4) {
      setFormError(
        `Please upload exactly 4 images. Currently: ${selectedImages.length}/4`,
      );
      return;
    }

    try {
      setFormData((prev) => ({ ...prev, loading: true }));
      const formDataToSend = new FormData();

      // Append text fields
      formDataToSend.append("name", formData.name);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("type", formData.type);
      formDataToSend.append("status", formData.status);

      // Ensure units_count is an integer
      const unitsCount = parseInt(formData.units_count, 10);
      formDataToSend.append("units_count", isNaN(unitsCount) ? 0 : unitsCount);

      formDataToSend.append("landlord_id", formData.landlord_id);

      // Append images
      selectedImages.forEach((image) => {
        formDataToSend.append("images[]", image);
      });

      await api.post("/properties", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      triggerRefresh();
      navigate("/properties");
    } catch (error) {
      console.error("Failed to create property:", error);
      const errData = error.response?.data;
      if (typeof errData === 'object' && !errData.message && !errData.error) {
        // Validation error object
        const messages = Object.values(errData).flat().join(" ");
        setFormError(messages || "Validation failed. Please check your inputs.");
      } else {
        setFormError(
          errData?.message ||
            errData?.error ||
            "Failed to create property. Please try again.",
        );
      }
    } finally {
      setFormData((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light py-5">
      <div
        className="card shadow-lg"
        style={{ width: "100%", maxWidth: "700px" }}
      >
        <div className="card-body p-4">
          <h2 className="card-title text-center mb-4 h3 fw-bold">
            Add New Property
          </h2>

          {formError && (
            <div className="alert alert-danger" role="alert">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-bold">Property Name</label>
              <input
                name="name"
                type="text"
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Address</label>
              <input
                name="address"
                type="text"
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label fw-bold">Type</label>
                <select
                  name="type"
                  onChange={handleChange}
                  className="form-select"
                  value={formData.type}
                required >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Status</label>
                <select
                  name="status"
                  onChange={handleChange}
                  className="form-select"
                  value={formData.status}
                required >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Number of Units</label>
                <input
                  name="units_count"
                  type="number"
                  min="0"
                  onChange={handleChange}
                  value={formData.units_count}
                  className="form-control"
                  placeholder="e.g., 10"
                  required
                />
              </div>
            </div>

            {/* If Admin, show Landlord selection */}
            {currentUser && currentUser.role !== "landlord" && (
              <div className="mb-4">
                <label className="form-label fw-bold">
                  Select Landlord
                </label>
                <select
                  name="landlord_id"
                  onChange={handleChange}
                  value={formData.landlord_id}
                  className="form-select"
                  required
                >
                  <option value="" disabled>Select a Landlord</option>
                  {landlords.map(ll => (
                    <option key={ll.id} value={ll.id}>
                      {ll.name} {ll.company_name ? `(${ll.company_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Modern Image Upload Component */}
            <div className="mb-4">
              <ImageUpload
                onImagesChange={handleImagesChange}
                maxImages={4}
                maxSizeMB={5}
              />
            </div>

            <div className="d-flex justify-content-between mt-4">
              <button
                type="button"
                onClick={() => navigate("/properties")}
                className="btn btn-secondary px-4"
                disabled={formData.loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary px-4"
                disabled={selectedImages.length !== 4 || formData.loading}
              >
                {formData.loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Creating...
                  </>
                ) : (
                  "Create Property"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
