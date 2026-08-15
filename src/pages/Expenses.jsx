import { useState, useEffect, useCallback } from "react";
import useRealtime from "../hooks/useRealtime";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useRefresh } from "../contexts/RefreshContext";
import { toast } from "react-toastify";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [properties, setProperties] = useState([]);
  const { triggerRefresh } = useRefresh();
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const userRole = sessionStorage.getItem("role") || "";
  const isAdmin = ["super_admin", "admin"].includes(userRole);

  const [filters, setFilters] = useState({
    propertyId: "All",
    category: "All",
    status: "All",
    search: "",
    dateFrom: "",
    dateTo: "",
  });

  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Form State matching specification:
  // receipt_number, expense purpose, account_name, account_number, amount_paid, timestamp, description
  const [formData, setFormData] = useState({
    receipt_number: "",
    purpose: "",
    account_name: "",
    account_number: "",
    amount: "",
    payment_timestamp: new Date().toISOString().slice(0, 16),
    date: new Date().toISOString().split("T")[0],
    property_id: "",
    category: "Maintenance",
    vendor: "",
    invoice_number: "",
    description: "",
  });

  // Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingExpense, setRejectingExpense] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const categories = [
    "Maintenance",
    "Utilities",
    "Taxes",
    "Salary / Payroll",
    "Insurance",
    "Supplies",
    "Rent / Lease",
    "Marketing",
    "Legal & Professional",
    "Miscellaneous",
  ];

  const statuses = ["Pending", "Approved", "Rejected", "Paid"];

  const formatCompact = (val) => {
    const num = Number(val || 0);
    if (!num) return "0";
    if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toLocaleString();
  };

  const fetchExpenses = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const response = await api.get("/expenses");
      setExpenses(response.data);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await api.get("/properties");
      setProperties(response.data);
      if (response.data.length > 0 && !formData.property_id) {
        setFormData((prev) => ({ ...prev, property_id: response.data[0].id }));
      }
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const checkRoleAndFetch = async () => {
      let role = sessionStorage.getItem("role");
      if (!role) {
        try {
          const res = await api.post("/auth/me");
          role = res.data?.role;
          if (role) {
            sessionStorage.setItem("role", role);
          }
        } catch (e) {
          console.error("Failed to verify user session:", e);
          navigate("/login");
          return;
        }
      }

      const allowedRoles = ["super_admin", "admin", "accounting_staff"];
      if (!allowedRoles.includes(role)) {
        navigate("/dashboard");
        return;
      }

      await fetchExpenses(true);
      await fetchProperties();
    };

    checkRoleAndFetch();
  }, [fetchExpenses, navigate]);

  useRealtime("expense", {
    onCreated: (newExpense) => {
      setExpenses((prev) => {
        if (prev.find((e) => e.id === newExpense.id)) return prev;
        return [newExpense, ...prev];
      });
      fetchExpenses(false);
    },
    onUpdated: (updatedExpense) => {
      setExpenses((prev) =>
        prev.map((e) => (e.id === updatedExpense.id ? { ...e, ...updatedExpense } : e))
      );
    },
    onDeleted: (deletedData) => {
      setExpenses((prev) => prev.filter((e) => e.id !== deletedData.id));
    },
  });

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormData({
      receipt_number: `RCP-${Math.floor(100000 + Math.random() * 900000)}`,
      purpose: "",
      account_name: "",
      account_number: "",
      amount: "",
      payment_timestamp: new Date().toISOString().slice(0, 16),
      date: new Date().toISOString().split("T")[0],
      property_id: properties[0]?.id || "",
      category: "Maintenance",
      vendor: "",
      invoice_number: "",
      description: "",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      receipt_number: expense.receipt_number || "",
      purpose: expense.purpose || expense.category || "",
      account_name: expense.account_name || "",
      account_number: expense.account_number || "",
      amount: expense.amount || "",
      payment_timestamp: expense.payment_timestamp
        ? new Date(expense.payment_timestamp).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      date: expense.date ? expense.date.split("T")[0] : new Date().toISOString().split("T")[0],
      property_id: expense.property_id || "",
      category: expense.category || "Maintenance",
      vendor: expense.vendor || "",
      invoice_number: expense.invoice_number || "",
      description: expense.description || "",
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit to Admin
  const handleSubmitToAdmin = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        status: "Pending", // Always sent as Pending to Admin
      };

      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, payload);
        toast.success("Expense request updated and sent to Admin.");
      } else {
        await api.post("/expenses", payload);
        toast.success("Expense form submitted to Admin for approval.");
      }
      setShowModal(false);
      fetchExpenses(false);
      triggerRefresh();
    } catch (error) {
      console.error("Failed to save expense:", error);
      toast.error(error.response?.data?.message || "Failed to submit expense request");
    }
  };

  // Admin Approve Action
  const handleApprove = async (id) => {
    try {
      await api.post(`/expenses/${id}/approve`);
      toast.success("Expense approved! Notification sent to accounting staff.");
      fetchExpenses(false);
      triggerRefresh();
    } catch (error) {
      console.error("Failed to approve expense:", error);
      toast.error(error.response?.data?.message || "Failed to approve expense");
    }
  };

  // Admin Reject Action Trigger
  const handleOpenRejectModal = (expense) => {
    setRejectingExpense(expense);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error("Please provide a description for the rejection.");
      return;
    }
    setRejectSubmitting(true);
    try {
      await api.post(`/expenses/${rejectingExpense.id}/reject`, {
        rejection_reason: rejectionReason.trim(),
      });
      toast.info("Expense rejected with notification sent to accounting staff.");
      setShowRejectModal(false);
      setRejectingExpense(null);
      fetchExpenses(false);
      triggerRefresh();
    } catch (error) {
      console.error("Failed to reject expense:", error);
      toast.error(error.response?.data?.message || "Failed to reject expense");
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense claim?")) return;
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses(expenses.filter((e) => e.id !== id));
      triggerRefresh();
      toast.success("Expense deleted successfully");
    } catch (error) {
      console.error("Failed to delete expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Receipt No.",
      "Purpose",
      "Property",
      "Account Name",
      "Account Number",
      "Amount",
      "Date Paid",
      "Status",
      "Rejection Reason",
    ];
    const rows = displayedExpenses.map((expense) => [
      expense.receipt_number || "-",
      expense.purpose || expense.category,
      expense.property?.name || "-",
      expense.account_name || "-",
      expense.account_number || "-",
      `₦${parseFloat(expense.amount || 0).toLocaleString()}`,
      expense.payment_timestamp
        ? new Date(expense.payment_timestamp).toLocaleString()
        : new Date(expense.date).toLocaleDateString(),
      expense.status,
      expense.rejection_reason || "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Paid":
      case "Approved":
        return "bg-success";
      case "Pending":
        return "bg-warning text-dark";
      case "Rejected":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  const displayedExpenses = expenses.filter((e) => {
    if (filters.propertyId !== "All" && String(e.property_id) !== String(filters.propertyId)) return false;
    if (filters.category !== "All" && e.category !== filters.category) return false;
    if (filters.status !== "All" && e.status !== filters.status) return false;

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const receipt = e.receipt_number?.toLowerCase() || "";
      const purpose = e.purpose?.toLowerCase() || "";
      const accName = e.account_name?.toLowerCase() || "";
      const accNum = e.account_number?.toLowerCase() || "";
      const category = e.category?.toLowerCase() || "";
      const propName = e.property?.name?.toLowerCase() || "";

      if (
        !receipt.includes(searchTerm) &&
        !purpose.includes(searchTerm) &&
        !accName.includes(searchTerm) &&
        !accNum.includes(searchTerm) &&
        !category.includes(searchTerm) &&
        !propName.includes(searchTerm)
      ) {
        return false;
      }
    }

    if (filters.dateFrom) {
      if (new Date(e.date) < new Date(filters.dateFrom)) return false;
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (new Date(e.date) > toDate) return false;
    }

    return true;
  });

  const stats = {
    total: expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
    pendingCount: expenses.filter((e) => e.status === "Pending").length,
    approvedCount: expenses.filter((e) => e.status === "Approved" || e.status === "Paid").length,
    rejectedCount: expenses.filter((e) => e.status === "Rejected").length,
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

  return (
    <div className="min-vh-100 p-4 bg-light">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Expenses & Approvals</h1>
          <p className="text-muted mb-0">
            Submit expense forms for Admin review, manage accounts paid to, and track approval status.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={handleExportCSV} className="btn btn-outline-secondary">
            <i className="bi bi-download me-2"></i>
            Export CSV
          </button>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <i className="bi bi-plus-lg me-2"></i>
            Fill Expense Form
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted small mb-1">Total Expenses</p>
                <h4 className="fw-bold mb-0 text-dark">₦{formatCompact(stats.total)}</h4>
              </div>
              <div className="bg-primary-subtle text-primary p-3 rounded-circle">
                <i className="bi bi-cash-coin fs-4"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted small mb-1">Pending Approval</p>
                <h4 className="fw-bold mb-0 text-warning">{stats.pendingCount}</h4>
              </div>
              <div className="bg-warning-subtle text-warning p-3 rounded-circle">
                <i className="bi bi-hourglass-split fs-4"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted small mb-1">Approved Claims</p>
                <h4 className="fw-bold mb-0 text-success">{stats.approvedCount}</h4>
              </div>
              <div className="bg-success-subtle text-success p-3 rounded-circle">
                <i className="bi bi-check-circle fs-4"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted small mb-1">Rejected Claims</p>
                <h4 className="fw-bold mb-0 text-danger">{stats.rejectedCount}</h4>
              </div>
              <div className="bg-danger-subtle text-danger p-3 rounded-circle">
                <i className="bi bi-x-circle fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Form */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="row g-3">
            <div className="col-12 col-md-3">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 bg-light"
                  placeholder="Receipt #, Purpose, Account..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select bg-light border-0"
                value={filters.propertyId}
                onChange={(e) => setFilters({ ...filters, propertyId: e.target.value })}
              >
                <option value="All">All Properties</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select bg-light border-0"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="All">All Statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-3">
              <div className="input-group">
                <input
                  type="date"
                  className="form-control bg-light border-0"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
                <span className="input-group-text bg-light border-0">to</span>
                <input
                  type="date"
                  className="form-control bg-light border-0"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card border-0 shadow-sm p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4">Receipt No.</th>
                <th>Expense Purpose</th>
                <th>Property</th>
                <th>Account Paid To</th>
                <th>Amount Paid</th>
                <th>Timestamp / Date</th>
                <th>Status</th>
                <th className="pe-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedExpenses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                    No expense claims found
                  </td>
                </tr>
              ) : (
                displayedExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="ps-4 fw-medium text-dark">
                      {expense.receipt_number || expense.invoice_number || "N/A"}
                    </td>
                    <td>
                      <span className="fw-semibold text-dark">
                        {expense.purpose || expense.category}
                      </span>
                      {expense.description && (
                        <small className="d-block text-muted text-truncate" style={{ maxWidth: "200px" }}>
                          {expense.description}
                        </small>
                      )}
                    </td>
                    <td>{expense.property?.name || "N/A"}</td>
                    <td>
                      {expense.account_name || expense.account_number ? (
                        <div>
                          <span className="d-block text-dark fw-medium">
                            {expense.account_name || "Account"}
                          </span>
                          <small className="text-muted">{expense.account_number}</small>
                        </div>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                    <td className="fw-bold text-danger">
                      ₦{Number(expense.amount).toLocaleString()}
                    </td>
                    <td>
                      {expense.payment_timestamp
                        ? new Date(expense.payment_timestamp).toLocaleString()
                        : new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(expense.status)} px-2 py-1`}>
                        {expense.status}
                      </span>
                      {expense.status === "Rejected" && expense.rejection_reason && (
                        <div
                          className="text-danger small mt-1"
                          style={{ maxWidth: "180px", fontSize: "0.75rem" }}
                          title={expense.rejection_reason}
                        >
                          <i className="bi bi-exclamation-triangle-fill me-1"></i>
                          {expense.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td className="pe-4 text-end">
                      {/* Admin Approve & Reject Buttons */}
                      {isAdmin && expense.status === "Pending" && (
                        <div className="btn-group btn-group-sm me-2">
                          <button
                            onClick={() => handleApprove(expense.id)}
                            className="btn btn-sm btn-success text-white"
                            title="Approve Expense"
                          >
                            <i className="bi bi-check-lg me-1"></i> Approve
                          </button>
                          <button
                            onClick={() => handleOpenRejectModal(expense)}
                            className="btn btn-sm btn-danger text-white"
                            title="Reject Expense"
                          >
                            <i className="bi bi-x-lg me-1"></i> Reject
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => handleOpenEdit(expense)}
                        className="btn btn-sm btn-outline-secondary me-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="btn btn-sm btn-outline-danger"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record / Edit Expense Form Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold">
                  {editingExpense ? "Edit Expense Claim" : "Expense Form (Submit to Admin)"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmitToAdmin}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Receipt Number */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Receipt Number *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="receipt_number"
                        value={formData.receipt_number}
                        onChange={handleInputChange}
                        placeholder="e.g. RCP-89401"
                        required
                      />
                    </div>

                    {/* Property */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Property *</label>
                      <select
                        className="form-select"
                        name="property_id"
                        value={formData.property_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="" disabled>
                          Select Property
                        </option>
                        {properties.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Expense Purpose */}
                    <div className="col-md-12">
                      <label className="form-label fw-semibold">Expense Purpose *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleInputChange}
                        placeholder="e.g. Repair generator, Purchase office supplies, Plumbing service..."
                        required
                      />
                    </div>

                    {/* Account Paid To Section */}
                    <div className="col-12">
                      <div className="p-3 bg-light rounded border">
                        <h6 className="fw-bold mb-3 text-secondary">Account Paid To</h6>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label small fw-semibold">Account Name *</label>
                            <input
                              type="text"
                              className="form-control"
                              name="account_name"
                              value={formData.account_name}
                              onChange={handleInputChange}
                              placeholder="e.g. Zenith Bank / John Doe Services"
                              required
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label small fw-semibold">Account Number *</label>
                            <input
                              type="text"
                              className="form-control"
                              name="account_number"
                              value={formData.account_number}
                              onChange={handleInputChange}
                              placeholder="e.g. 0123456789"
                              required
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label small fw-semibold">Amount Paid (₦) *</label>
                            <input
                              type="number"
                              className="form-control"
                              name="amount"
                              value={formData.amount}
                              onChange={handleInputChange}
                              placeholder="0.00"
                              min="0"
                              step="any"
                              required
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label small fw-semibold">Timestamp / Date Paid *</label>
                            <input
                              type="datetime-local"
                              className="form-control"
                              name="payment_timestamp"
                              value={formData.payment_timestamp}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="col-md-12">
                      <label className="form-label fw-semibold">Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Detailed explanation of the expense..."
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Form Buttons as requested: Cancel and To Admin */}
                <div className="modal-footer bg-light d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4">
                    <i className="bi bi-send me-2"></i> To Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Admin Rejection Modal */}
      {showRejectModal && rejectingExpense && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
        >
          <div className="modal-dialog">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">Reject Expense Claim</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowRejectModal(false)}
                ></button>
              </div>
              <form onSubmit={handleConfirmReject}>
                <div className="modal-body p-4">
                  <p className="text-dark">
                    You are rejecting expense claim{" "}
                    <strong>
                      {rejectingExpense.receipt_number || `#${rejectingExpense.id}`}
                    </strong>{" "}
                    (₦{Number(rejectingExpense.amount).toLocaleString()}).
                  </p>
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-danger">
                      Rejection Description / Reason *
                    </label>
                    <textarea
                      className="form-control border-danger"
                      rows="4"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain to the accounting staff why this expense was rejected..."
                      required
                    ></textarea>
                    <small className="text-muted mt-1 d-block">
                      This description will be sent as a notification to the accounting staff.
                    </small>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowRejectModal(false)}
                    disabled={rejectSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={rejectSubmitting}
                  >
                    {rejectSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Rejecting...
                      </>
                    ) : (
                      "Confirm Rejection"
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
