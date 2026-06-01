import { useEffect, useState, useCallback } from "react";
import useAutoRefresh from "../hooks/useAutoRefresh";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletDescription, setWalletDescription] = useState("");
  const navigate = useNavigate();
  const userRole = sessionStorage.getItem("role");

  const fetchUsers = useCallback(async (isInitial = false) => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
      if (isInitial) setLoading(false);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if user is super admin or admin
    if (userRole !== "super_admin" && userRole !== "admin") {
      navigate("/dashboard");
      return;
    }

    fetchUsers(true);
  }, [userRole, navigate, fetchUsers]);

  useAutoRefresh(() => fetchUsers(false));

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await api.delete(`/users/${id}`);
        setUsers(users.filter((user) => user.id !== id));
        toast.success("User deleted successfully");
        fetchUsers();
      } catch (error) {
        console.error("Failed to delete user:", error);
        toast.error(error.response?.data?.error || "Failed to delete user");
      }
    }
  };

  const handleFundWallet = (user) => {
    setSelectedUser(user);
    setShowWalletModal(true);
  };

  const submitFundWallet = async (e) => {
    e.preventDefault();
    try {
      await api.post("/wallet/add-funds", {
        user_id: selectedUser.id,
        amount: parseFloat(walletAmount),
        description: walletDescription,
      });
      toast.success(
        `Successfully added ₦${parseFloat(walletAmount).toLocaleString()} to ${selectedUser.name}'s wallet`,
      );
      setShowWalletModal(false);
      setWalletAmount("");
      setWalletDescription("");
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Failed to fund wallet:", error);
      toast.error(error.response?.data?.message || "Failed to fund wallet");
    }
  };

  const getRoleBadgeClass = (role) => {
    const badges = {
      super_admin: "bg-dark",
      admin: "bg-primary",
      property_officer: "bg-info",
      landlord: "bg-success",
      tenant: "bg-secondary",
      accounting_staff: "bg-warning text-dark",
      maintenance_staff: "bg-light text-dark border",
    };
    return badges[role] || "bg-secondary";
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">User Management</h1>
          <p className="text-muted mb-0">Manage all system users and roles</p>
        </div>
        <Link to="/users/new" className="btn btn-primary">
          <i className="bi bi-person-plus me-2"></i>
          Create User
        </Link>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-12 col-md-6">
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="property_officer">Property Officer</option>
                <option value="accounting_staff">Accounting Staff</option>
                <option value="maintenance_staff">Maintenance Staff</option>
                <option value="landlord">Landlord</option>
                <option value="tenant">Tenant</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="py-3">Email</th>
                  <th className="py-3">Role</th>
                  <th className="py-3">Created</th>
                  <th className="py-3 text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center">
                          <div
                            className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                            style={{ width: "40px", height: "40px" }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-semibold">{user.name}</div>
                            <div className="text-muted small">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">{user.email}</td>
                      <td className="py-3">
                        <span
                          className={`badge ${getRoleBadgeClass(user.role)}`}
                        >
                          {user.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 text-muted">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-end pe-4">
                        <div className="d-flex justify-content-end gap-2">
                          {user.role === "tenant" && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleFundWallet(user)}
                              title="Fund Wallet"
                            >
                              <i className="bi bi-wallet2"></i>
                            </button>
                          )}
                          <Link
                            to={`/users/${user.id}/edit`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button
                            onClick={() => handleDelete(user.id, user.name)}
                            className="btn btn-sm btn-outline-danger"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="mt-3 text-muted small">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* Fund Wallet Modal */}
      {showWalletModal && selectedUser && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Fund Wallet - {selectedUser.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowWalletModal(false)}
                ></button>
              </div>
              <form onSubmit={submitFundWallet}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Amount (₦)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={walletAmount}
                      onChange={(e) => setWalletAmount(e.target.value)}
                      placeholder="Enter amount"
                      required
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description (Optional)</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={walletDescription}
                      onChange={(e) => setWalletDescription(e.target.value)}
                      placeholder="Enter description..."
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowWalletModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    Add Funds
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
