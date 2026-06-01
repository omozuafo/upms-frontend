import { useEffect, useState, useCallback } from "react";
import useRealtime from "../hooks/useRealtime";
import { Link } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";
import ConfirmationModal from "../components/ConfirmationModal";

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const userRole = sessionStorage.getItem("role");

  const fetchProperties = useCallback(async (isInitial = false) => {
    try {
      const response = await api.get("/properties");
      // Handle both paginated and non-paginated responses
      const propertiesData = response.data.data || response.data;
      setProperties(Array.isArray(propertiesData) ? propertiesData : []);
      if (isInitial) setLoading(false);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties(true);
  }, [fetchProperties]);

  useRealtime('property', {
    onCreated: (newProperty) => {
       setProperties(prev => {
          if (prev.find(p => p.id === newProperty.id)) return prev;
          return [newProperty, ...prev];
       });
    },
    onUpdated: (updatedProperty) => {
       setProperties(prev => prev.map(p => p.id === updatedProperty.id ? { ...p, ...updatedProperty } : p));
    },
    onDeleted: (deletedData) => {
       setProperties(prev => prev.filter(p => p.id !== deletedData.id));
    }
  });

  const handleDeleteClick = (property) => {
    setPropertyToDelete(property);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;
    try {
      await api.delete(`/properties/${propertyToDelete.id}`);
      setShowDeleteModal(false);
      setPropertyToDelete(null);
      toast.success("Property deleted successfully");
      fetchProperties(); // Refresh list
    } catch (error) {
      console.error("Failed to delete property:", error);
      toast.error("Failed to delete property");
      setShowDeleteModal(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-vh-100 p-4 bg-light">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">
            <i className="bi bi-building me-2"></i>
            Properties
          </h1>
          <p className="text-muted mb-0">Manage all property listings</p>
        </div>
        {(userRole === "admin" || userRole === "super_admin") && (
          <Link to="/properties/new" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>
            Add Property
          </Link>
        )}
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-4">
            <i
              className="bi bi-building text-muted"
              style={{ fontSize: "64px" }}
            ></i>
          </div>
          <h5 className="text-muted">No properties found</h5>
          <p className="text-muted">There are no properties matching your query.</p>
          {(userRole === "admin" || userRole === "super_admin") && (
            <Link to="/properties/new" className="btn btn-primary mt-3">
              <i className="bi bi-plus-circle me-2"></i>
              Add Property
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search properties by name or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {userRole === "accounting_staff" ? (
            <div className="card-light rounded overflow-hidden">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Property Name</th>
                      <th>Location</th>
                      <th>Units</th>
                      <th>Tenants</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties
                      .filter(
                        (property) =>
                          property.name
                            ?.toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                          property.address
                            ?.toLowerCase()
                            .includes(searchTerm.toLowerCase()),
                      )
                      .map((property) => (
                        <tr key={property.id}>
                          <td className="fw-semibold">
                            <div className="d-flex align-items-center">
                              <div className="bg-primary bg-opacity-10 p-2 rounded me-3 text-primary">
                                <i className="bi bi-building"></i>
                              </div>
                              {property.name}
                            </div>
                          </td>
                          <td className="text-muted"><i className="bi bi-geo-alt me-1"></i>{property.address}</td>
                          <td>{property.units_count || 0}</td>
                          <td><span className="badge bg-info text-dark">{property.tenants_count || 0}</span></td>
                          <td>
                            <span className={`badge ${property.status === "Active" ? "bg-success" : "bg-secondary"}`}>
                              {property.status}
                            </span>
                          </td>
                          <td className="text-end">
                            <Link to={`/properties/${property.id}`} className="btn btn-sm btn-outline-primary">
                              <i className="bi bi-eye me-1"></i> View
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="row g-4">
              {properties
                .filter(
                  (property) =>
                    property.name
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    property.address
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase()),
                )
                .map((property) => (
                  <div key={property.id} className="col-12 col-md-6 col-lg-4">
                    <div className="card-light h-100 p-0 overflow-hidden">
                      {/* Property Image */}
                      <div style={{ height: "200px", overflow: "hidden" }}>
                        <img
                          src={
                            property.images &&
                            JSON.parse(property.images).length > 0
                              ? `http://127.0.0.1:8000/storage/${JSON.parse(property.images)[0]}`
                              : "https://via.placeholder.com/400x200?text=No+Image"
                          }
                          alt={property.name}
                          className="w-100 h-100 object-fit-cover"
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/400x200?text=Image+Error";
                          }}
                        />
                      </div>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <h2 className="h5 fw-bold mb-0">{property.name}</h2>
                          <span
                            className={`badge ${property.status === "Active" ? "bg-success" : "bg-secondary"}`}
                          >
                            {property.status}
                          </span>
                        </div>
                        <p className="text-muted mb-2">
                          <i className="bi bi-geo-alt me-2"></i>
                          {property.address}
                        </p>
                        <p className="text-muted small mb-3">
                          <i className="bi bi-house-door me-2"></i>
                          Type: {property.type}
                        </p>
                        {property.units_count !== undefined && (
                          <p className="text-muted small mb-3">
                            <i className="bi bi-grid-3x3 me-2"></i>
                            Units: {property.units_count || 0}
                          </p>
                        )}
                        <div className="d-flex justify-content-between mt-3 border-top pt-3">
                          <Link
                            to={`/properties/${property.id}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="bi bi-eye me-1"></i>
                            View
                          </Link>
                          {(userRole === "admin" ||
                            userRole === "super_admin") && (
                            <button
                              onClick={() => handleDeleteClick(property)}
                              className="btn btn-sm btn-outline-danger"
                            >
                              <i className="bi bi-trash me-1"></i>
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Property"
        message={`Are you sure you want to delete "${propertyToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Property"
      />
    </div>
  );
}
