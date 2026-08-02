import { useState, useEffect, useCallback } from "react";
import useRealtime from "../hooks/useRealtime";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useRefresh } from "../contexts/RefreshContext";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [properties, setProperties] = useState([]);
  const { triggerRefresh } = useRefresh();
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
  const [formData, setFormData] = useState({
    property_id: "",
    category: "Maintenance",
    amount: "",
    date: "",
    vendor: "",
    invoice_number: "",
    status: "Pending",
    description: "",
  });

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

  const statuses = ["Pending", "Approved", "Paid", "Rejected"];

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
    const role = sessionStorage.getItem("role");
    const allowedRoles = ["super_admin", "admin", "accounting_staff"];
    if (!allowedRoles.includes(role)) {
      navigate("/dashboard");
      return;
    }

    fetchExpenses(true);
    fetchProperties();
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
      property_id: properties[0]?.id || "",
      category: "Maintenance",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      vendor: "",
      invoice_number: "",
      status: "Pending",
      description: "",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      property_id: expense.property_id || "",
      category: expense.category || "Maintenance",
      amount: expense.amount || "",
      date: expense.date ? expense.date.split("T")[0] : "",
      vendor: expense.vendor || "",
      invoice_number: expense.invoice_number || "",
      status: expense.status || "Pending",
      description: expense.description || "",
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, formData);
        alert("Expense updated successfully");
      } else {
        await api.post("/expenses", formData);
        alert("Expense created successfully");
      }
      setShowModal(false);
      fetchExpenses(false);
      triggerRefresh();
    } catch (error) {
      console.error("Failed to save expense:", error);
      alert(error.response?.data?.message || "Failed to save expense");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses(expenses.filter((e) => e.id !== id));
      triggerRefresh();
      alert("Expense deleted successfully");
    } catch (error) {
      console.error("Failed to delete expense:", error);
      alert("Failed to delete expense");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Property",
      "Category",
      "Amount",
      "Date",
      "Vendor",
      "Invoice Number",
      "Status",
      "Description",
    ];
    const rows = displayedExpenses.map((expense) => [
      expense.property?.name || "-",
      expense.category,
      `₦${parseFloat(expense.amount || 0).toLocaleString()}`,
      new Date(expense.date).toLocaleDateString(),
      expense.vendor || "-",
      expense.invoice_number || "-",
      expense.status,
      expense.description || "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
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
        return "bg-success";
      case "Approved":
        return "bg-info";
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
      const vendorName = e.vendor?.toLowerCase() || "";
      const category = e.category?.toLowerCase() || "";
      const invoice = e.invoice_number?.toLowerCase() || "";
      const propName = e.property?.name?.toLowerCase() || "";

      if (
        !vendorName.includes(searchTerm) &&
        !category.includes(searchTerm) &&
        !invoice.includes(searchTerm) &&
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

  // Calculate statistics
  const stats = {
    total: expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
    maintenance: expenses
      .filter((e) => e.category === "Maintenance")
      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
    utilities: expenses
      .filter((e) => e.category === "Utilities")
      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
    payroll: expenses
      .filter((e) => e.category === "Salary / Payroll")
      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
    misc: expenses
      .filter((e) => e.category === "Miscellaneous")
      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Expenses</h1>
          <p className="text-muted mb-0">Manage property expenses, utility bills, and maintenance costs</p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={handleExportCSV} className="btn btn-outline-secondary">
            <i className="bi bi-download me-2"></i>
            Export CSV
          </button>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <i className="bi bi-plus-lg me-2"></i>
            Record Expense
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        {[
          { name: "Total Expenses", total: stats.total, color: "danger", icon: "bi-graph-down-arrow" },
          { name: "Maintenance", total: stats.maintenance, color: "primary", icon: "bi-tools" },
          { name: "Utilities", total: stats.utilities, color: "warning", icon: "bi-lightning" },
          { name: "Salary & Payroll", total: stats.payroll, color: "success", icon: "bi-people" },
          { name: "Miscellaneous", total: stats.misc, color: "secondary", icon: "bi-cash-stack" },
        ].map((type) => (
          <div key={type.name} className="col-md-6 col-lg">
            <div className="payment-stat-card">
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <p className="payment-stat-label">{type.name}</p>
                  <h3 className="payment-stat-value">₦{formatCompact(type.total)}</h3>
                </div>
                <div className={`payment-stat-icon payment-stat-icon-${type.color}`}>
                  <i className={`bi ${type.icon}`}></i>
                </div>
              </div>
            </div>
          </div>
        ))}
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
                  placeholder="Search vendor, invoice..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
            <div className="col-6 col-md-2">
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
            <div className="col-6 col-md-2">
              <select
                className="form-select bg-light border-0"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-2">
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
          <table className="table table-hover mb-0">
            <thead className="payment-table-header">
              <tr>
                <th className="ps-4">Invoice No.</th>
                <th>Property</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Vendor</th>
                <th>Status</th>
                <th className="pe-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedExpenses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                    No expenses found
                  </td>
                </tr>
              ) : (
                displayedExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="ps-4 fw-medium text-secondary">{expense.invoice_number || "N/A"}</td>
                    <td>{expense.property?.name || "N/A"}</td>
                    <td>
                      <span className="payment-type-badge">{expense.category}</span>
                    </td>
                    <td className="fw-semibold text-danger">₦{Number(expense.amount).toLocaleString()}</td>
                    <td>{new Date(expense.date).toLocaleDateString()}</td>
                    <td>{expense.vendor || "N/A"}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(expense.status)}`}>{expense.status}</span>
                    </td>
                    <td className="pe-4 text-end">
                      <button
                        onClick={() => handleOpenEdit(expense)}
                        className="btn btn-sm btn-outline-secondary me-2"
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

      {/* Record / Edit Expense Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingExpense ? "Edit Expense" : "Record Expense"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label className="form-label">Property *</label>
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

                    <div className="col-md-6">
                      <label className="form-label">Category *</label>
                      <select
                        className="form-select"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Amount (₦) *</label>
                      <input
                        type="number"
                        className="form-control"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Status *</label>
                      <select
                        className="form-select"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        required
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Vendor</label>
                      <input
                        type="text"
                        className="form-control"
                        name="vendor"
                        value={formData.vendor}
                        onChange={handleInputChange}
                        placeholder="Vendor name"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Invoice Number</label>
                      <input
                        type="text"
                        className="form-control"
                        name="invoice_number"
                        value={formData.invoice_number}
                        placeholder="INV-XXXXX"
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="col-md-12">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Describe the expense details..."
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingExpense ? "Save Changes" : "Record Expense"}
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
