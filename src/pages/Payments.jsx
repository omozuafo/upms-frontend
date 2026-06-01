import { useState, useEffect, useCallback } from "react";
import useRealtime from "../hooks/useRealtime";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useRefresh } from "../contexts/RefreshContext";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const { triggerRefresh } = useRefresh();
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "All",
    type: searchParams.get("type") || "All",
    search: searchParams.get("search") || "",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [statModal, setStatModal] = useState(null);
  const [isRentPaid, setIsRentPaid] = useState(true);
  const navigate = useNavigate();
  
  const formatCompact = (val) => {
    const num = Number(val || 0);
    if (!num) return "0";
    if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toLocaleString();
  };

  const fetchPayments = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);

        const response = await api.get("/payments");
        setPayments(response.data);

        // Also refresh rent status if tenant
        if (sessionStorage.getItem("role") === "tenant") {
          try {
            const statsRes = await api.get("/dashboard/stats");
            setIsRentPaid(statsRes.data.rent_paid);
          } catch (err) {
            console.error("Failed to check rent status:", err);
          }
        }
      } catch (error) {
        console.error("Failed to fetch payments:", error);
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchPayments(true);

    // Call API to mark payment notifications as read and refresh the layout badge
    if (sessionStorage.getItem("token")) {
      api.put("/notifications/read-type", { 
        types: ["payment", "payment_status", "payment_submission", "wallet_funded"] 
      }).then(() => {
        triggerRefresh();
      }).catch(err => console.error("Failed to mark notifications as read:", err));
    }
  }, [fetchPayments, triggerRefresh]);

  useRealtime('payment', {
    onCreated: (newPayment) => {
       setPayments(prev => {
          if (prev.find(p => p.id === newPayment.id)) return prev;
          return [newPayment, ...prev];
       });
       fetchPayments(false); // Refetch to get relationships (tenant name, property name) properly loaded
    },
    onUpdated: (updatedPayment) => {
       setPayments(prev => prev.map(p => p.id === updatedPayment.id ? { ...p, ...updatedPayment } : p));
    },
    onDeleted: (deletedData) => {
       setPayments(prev => prev.filter(p => p.id !== deletedData.id));
    }
  });

  const handleStatusUpdate = async (id, status) => {
    if (
      !window.confirm(
        `Are you sure you want to mark this payment as ${status}?`,
      )
    )
      return;
    try {
      await api.put(`/payments/${id}`, { status });
      setPayments(payments.map((p) => (p.id === id ? { ...p, status } : p)));
      setShowModal(false);
      triggerRefresh();
      alert(`Payment marked as ${status}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update payment status");
    }
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  // Using backend `index` returning all payments, the stats cards will now compute
  // from the entire dataset, so clicking a type shouldn't zero out the others.

  const stats = {
    totalCollected: payments
      .filter((p) => p.status === "Paid")
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
    rent: payments
      .filter((p) => p.type === "Rent" && p.status === "Paid")
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
    serviceCharge: payments
      .filter((p) => p.type === "Service Charge" && p.status === "Paid")
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
    power: payments
      .filter((p) => p.type === "Power/Electricity" && p.status === "Paid")
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
    diesel: payments
      .filter((p) => p.type === "Diesel" && p.status === "Paid")
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
    assetReplacement: payments
      .filter((p) => p.type === "Asset Replacement" && p.status === "Paid")
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
  };

  const allPaymentTypes = [
    {
      name: "All",
      icon: "bi-check-circle",
      count: payments.length,
      total: stats.totalCollected,
      color: "success",
    },
    {
      name: "Rent",
      icon: "bi-house",
      count: payments.filter((p) => p.type === "Rent").length,
      total: stats.rent,
      color: "primary",
    },
    {
      name: "Service Charge",
      icon: "bi-tools",
      count: payments.filter((p) => p.type === "Service Charge").length,
      total: stats.serviceCharge,
      color: "info",
    },
    {
      name: "Power/Electricity",
      icon: "bi-lightning",
      count: payments.filter((p) => p.type === "Power/Electricity").length,
      total: stats.power,
      color: "warning",
    },
    {
      name: "Diesel",
      icon: "bi-fuel-pump",
      count: payments.filter((p) => p.type === "Diesel").length,
      total: stats.diesel,
      color: "danger",
    },
    {
      name: "Asset Replacement",
      icon: "bi-credit-card",
      count: payments.filter((p) => p.type === "Asset Replacement").length,
      total: stats.assetReplacement,
      color: "secondary",
    },
  ];

  const paymentTypes = sessionStorage.getItem("role") === "tenant" 
    ? allPaymentTypes.filter(t => t.name === "All" || t.name === "Rent")
    : allPaymentTypes;

  const displayedPayments = payments.filter((p) => {
    // Type filter
    if (filters.type !== "All" && p.type !== filters.type) return false;
    
    // Status filter
    if (filters.status !== "All" && p.status !== filters.status) return false;

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const tenantName = p.tenant?.name?.toLowerCase() || "";
      const propertyName = p.property?.name?.toLowerCase() || p.unit?.property?.name?.toLowerCase() || "";
      const receipt = p.receipt_number?.toLowerCase() || "";
      
      if (!tenantName.includes(searchTerm) && 
          !propertyName.includes(searchTerm) && 
          !receipt.includes(searchTerm)) {
        return false;
      }
    }

    // Date filters
    if (filters.dateFrom) {
      if (new Date(p.payment_date) < new Date(filters.dateFrom)) return false;
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (new Date(p.payment_date) > toDate) return false;
    }

    return true;
  });

  const handleExportCSV = () => {
    const headers = [
      "Tenant",
      "Property",
      "Type",
      "Amount",
      "Date",
      "Method",
      "Status",
      "Receipt",
    ];
    const rows = displayedPayments.map((payment) => [
      payment.tenant?.name || "-",
      payment.property?.name || payment.unit?.property?.name || "-",
      payment.type,
      `₦${parseFloat(payment.amount || 0).toLocaleString()}`,
      new Date(payment.payment_date).toLocaleDateString(),
      payment.method,
      payment.status,
      payment.receipt_number || "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Paid":
        return "bg-success";
      case "Pending":
        return "bg-warning text-dark";
      case "Overdue":
        return "bg-danger";
      case "Declined":
        return "bg-secondary";
      default:
        return "bg-secondary";
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

  return (
    <div className="min-vh-100 p-4 bg-light">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Payments</h1>
          <p className="text-muted mb-0">
            Track rent, service charges, and other payments
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            onClick={handleExportCSV}
            className="btn btn-outline-secondary"
          >
            <i className="bi bi-download me-2"></i>
            Export CSV
          </button>
          {sessionStorage.getItem("role") !== "tenant" && (
            <Link to="/audit-trail" className="btn btn-dark">
              <i className="bi bi-journal-text me-2"></i>
              View Audit Trail
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        {paymentTypes.map((type) => (
          <div key={type.name} className="col-md-6 col-lg-4 col-xl-2">
            <div
              className={`payment-stat-card ${
                filters.type === type.name
                  ? `border border-${type.color} border-3`
                  : ""
              } ${
                sessionStorage.getItem("role") === "tenant" &&
                !isRentPaid &&
                type.name !== "Rent" &&
                type.name !== "All"
                  ? "opacity-50 grayscale cursor-not-allowed"
                  : ""
              }`}
              onClick={() => {
                // Determine the action that used to happen on card click
                const role = sessionStorage.getItem("role");
                let actionFn = null;
                
                if (role === "tenant" && type.name !== "All") {
                  if (!isRentPaid && type.name !== "Rent") {
                    // Locked, do nothing
                  } else {
                    actionFn = () => navigate(`/payments/new?type=${encodeURIComponent(type.name)}`);
                  }
                } else {
                  actionFn = () => setFilters((prev) => ({ ...prev, type: type.name }));
                }

                // Show the modal with accurate figure and pass the action so they can still proceed
                setStatModal({ ...type, actionFn });
              }}
              style={{
                cursor:
                  sessionStorage.getItem("role") === "tenant" &&
                  !isRentPaid &&
                  type.name !== "Rent" &&
                  type.name !== "All"
                    ? "not-allowed"
                    : "pointer",
              }}
              title={`₦${Number(type.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Click for details)`}
            >
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <p className="payment-stat-label">{type.name}</p>
                  <h3 className="payment-stat-value">
                    ₦{formatCompact(type.total)}
                  </h3>
                </div>
                <div
                  className={`payment-stat-icon payment-stat-icon-${type.color}`}
                >
                  <i className={`bi ${type.icon}`}></i>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="payment-filter-tabs mb-4">
        {paymentTypes.map((type) => (
          <button
            key={type.name}
            onClick={() => setFilters((prev) => ({ ...prev, type: type.name }))}
            className={`payment-filter-tab ${filters.type === type.name ? "active" : ""}`}
          >
            {type.name} ({type.count})
          </button>
        ))}
      </div>

      {/* Filters Form */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 bg-light"
                  placeholder="Search by receipt, tenant..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="col-6 col-md-2">
              <select
                className="form-select bg-light border-0"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="All">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
                <option value="Declined">Declined</option>
              </select>
            </div>
            <div className="col-12 col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-light border-0">From</span>
                <input
                  type="date"
                  className="form-control bg-light border-0"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters({ ...filters, dateFrom: e.target.value })
                  }
                />
                <span className="input-group-text bg-light border-0">To</span>
                <input
                  type="date"
                  className="form-control bg-light border-0"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters({ ...filters, dateTo: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card-light p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="payment-table-header">
              <tr>
                <th className="ps-4">Receipt</th>
                <th>Date</th>
                <th>Tenant</th>
                <th>Property</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedPayments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                    No payments found
                  </td>
                </tr>
              ) : (
                displayedPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="ps-4 fw-medium">{payment.receipt_number}</td>
                    <td>
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td>{payment.tenant?.name || payment.tenant_name || payment.user?.name || (payment.tenant_id ? `Tenant #${payment.tenant_id}` : 'Unknown')}</td>
                    <td>
                      {payment.property?.name ||
                        payment.unit?.property?.name ||
                        "-"}
                    </td>
                    <td>
                      <span className="payment-type-badge">
                        <i
                          className={`bi ${
                            payment.type === "Rent"
                              ? "bi-house"
                              : payment.type === "Service Charge"
                                ? "bi-tools"
                                : payment.type === "Power/Electricity"
                                  ? "bi-lightning"
                                  : payment.type === "Diesel"
                                    ? "bi-fuel-pump"
                                    : "bi-credit-card"
                          } me-1`}
                        ></i>
                        {payment.type}
                      </span>
                    </td>
                    <td className="fw-semibold">
                      ₦{Number(payment.amount).toLocaleString()}
                    </td>
                    <td>{payment.method}</td>
                    <td>
                      <span
                        className={`badge ${getStatusBadgeClass(payment.status)}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td>
                      {sessionStorage.getItem("role") !== "tenant" ? (
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleViewPayment(payment)}
                        >
                          View
                        </button>
                      ) : (
                        payment.status === "Declined" && (
                          <Link
                            to={`/payments/new?type=${encodeURIComponent(payment.type)}`}
                            className="btn btn-sm btn-outline-danger"
                          >
                            Retry
                          </Link>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details Modal */}
      {showModal && selectedPayment && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Payment Details - {selectedPayment.receipt_number}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <p>
                      <strong>Tenant:</strong> {selectedPayment.tenant?.name}
                    </p>
                    <p>
                      <strong>Amount:</strong> ₦
                      {Number(selectedPayment.amount).toLocaleString()}
                    </p>
                    <p>
                      <strong>Type:</strong> {selectedPayment.type}
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(
                        selectedPayment.payment_date,
                      ).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span
                        className={`badge ${getStatusBadgeClass(selectedPayment.status)}`}
                      >
                        {selectedPayment.status}
                      </span>
                    </p>
                    <p>
                      <strong>Notes:</strong> {selectedPayment.notes || "N/A"}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <strong>Evidence:</strong>
                    <div className="mt-2 border rounded p-2 text-center bg-light">
                      {selectedPayment.evidence_path ? (
                        <>
                          {selectedPayment.evidence_path
                            .toLowerCase()
                            .endsWith(".pdf") ? (
                            <div>
                              <embed
                                src={`http://localhost:8000/${selectedPayment.evidence_path}`}
                                type="application/pdf"
                                width="100%"
                                height="400px"
                              />
                              <div className="mt-2">
                                <a
                                  href={`http://localhost:8000/${selectedPayment.evidence_path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  <i className="bi bi-download me-1"></i>
                                  Download PDF
                                </a>
                              </div>
                            </div>
                          ) : (
                            <img
                              src={`http://localhost:8000/${selectedPayment.evidence_path}`}
                              alt="Payment Evidence"
                              className="img-fluid"
                              style={{ maxHeight: "400px" }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><text x="50%" y="50%" text-anchor="middle" fill="gray">Image not found</text></svg>';
                              }}
                            />
                          )}
                        </>
                      ) : (
                        <p className="text-muted mb-0 py-5">
                          No evidence uploaded
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                {selectedPayment.status === "Pending" && (
                  <>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() =>
                        handleStatusUpdate(selectedPayment.id, "Declined")
                      }
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() =>
                        handleStatusUpdate(selectedPayment.id, "Paid")
                      }
                    >
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accurate Figure Modal */}
      {statModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
          onClick={() => setStatModal(null)}
        >
          <div className="modal-dialog modal-sm modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setStatModal(null)}
                ></button>
              </div>
              <div className="modal-body text-center pt-0">
                <div 
                  className={`payment-stat-icon payment-stat-icon-${statModal.color} mx-auto mb-3`}
                  style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}
                >
                  <i className={`bi ${statModal.icon}`}></i>
                </div>
                <h6 className="text-uppercase text-muted fw-bold mb-2">{statModal.name} Total</h6>
                <h3 className="fw-bold mb-4 text-dark">
                  ₦{statModal.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                
                {statModal.actionFn && (
                  <button 
                    className={`btn btn-${statModal.color} w-100 py-2`}
                    onClick={() => {
                      statModal.actionFn();
                      setStatModal(null);
                    }}
                  >
                    {sessionStorage.getItem("role") === "tenant" && statModal.name !== "All" 
                      ? "Proceed to Payment" 
                      : "Filter Records"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
