import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useAutoRefresh from "../hooks/useAutoRefresh";
import api from "../services/api";
import { useRefresh } from "../contexts/RefreshContext";

export default function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { triggerRefresh } = useRefresh();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletDescription, setWalletDescription] = useState("");
  const [fundingWallet, setFundingWallet] = useState(false);
  const [fundSuccess, setFundSuccess] = useState("");
  
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState(null);
  const [categoryPayments, setCategoryPayments] = useState([]);
  const [loadingCategoryPayments, setLoadingCategoryPayments] = useState(false);

  const fetchTenantDetails = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);
        const response = await api.get(`/tenants/${id}`);
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch tenant details:", error);
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    fetchTenantDetails(true);
  }, [fetchTenantDetails]);

  useAutoRefresh(() => fetchTenantDetails(false));

  const handleFundWallet = async (e) => {
    e.preventDefault();
    setFundingWallet(true);
    try {
      const res = await api.post("/wallet/add-funds", {
        user_id: id,
        amount: parseFloat(walletAmount),
        description: walletDescription,
      });
      setFundSuccess(
        `Successfully added ₦${parseFloat(walletAmount).toLocaleString()} to wallet. New balance: ₦${parseFloat(res.data.new_balance).toLocaleString()}`,
      );
      setShowWalletModal(false);
      setWalletAmount("");
      setWalletDescription("");
      fetchTenantDetails(); // Refresh data
      triggerRefresh();
      setTimeout(() => setFundSuccess(""), 5000);
    } catch (error) {
      console.error("Failed to fund wallet:", error);
      alert(error.response?.data?.message || "Failed to fund wallet");
    } finally {
      setFundingWallet(false);
    }
  };

  const handleCategoryClick = async (category) => {
    setSelectedCategoryDetails(category);
    setLoadingCategoryPayments(true);
    try {
      const response = await api.get('/payments', { params: { tenant_id: id, type: category } });
      setCategoryPayments(response.data);
    } catch (error) {
      console.error("Failed to fetch category payments:", error);
      alert("Failed to load payment details");
    } finally {
      setLoadingCategoryPayments(false);
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

  if (!data || !data.tenant) {
    return (
      <div className="min-vh-100 p-4 bg-light">
        <div className="alert alert-danger">Tenant not found</div>
      </div>
    );
  }

  const { tenant, payments, issues, stats } = data;

  return (
    <div className="min-vh-100 p-4 bg-light">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button
            onClick={() => navigate("/tenants")}
            className="btn btn-link text-primary p-0 mb-2"
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Tenants
          </button>
          <h1 className="h4 fw-bold text-dark mb-1">
            <i className="bi bi-person-circle me-2"></i>
            {tenant.name}
          </h1>
          <p className="text-muted mb-0">{tenant.email}</p>
        </div>
      </div>

      {/* Fund Wallet Success Message */}
      {fundSuccess && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-check-circle me-2"></i>
          {fundSuccess}
          <button
            type="button"
            className="btn-close"
            onClick={() => setFundSuccess("")}
          ></button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card-light p-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted small mb-1">Total Paid</p>
                <h3 className="h4 fw-bold mb-0">
                  ₦{parseFloat(stats.total_paid || 0).toLocaleString()}
                </h3>
              </div>
              <div
                className="metric-icon"
                style={{
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                }}
              >
                <i className="bi bi-check-circle text-white"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card-light p-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted small mb-1">Pending Payments</p>
                <h3 className="h4 fw-bold mb-0">
                  ₦{parseFloat(stats.pending_payments || 0).toLocaleString()}
                </h3>
              </div>
              <div
                className="metric-icon"
                style={{
                  background:
                    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                }}
              >
                <i className="bi bi-clock text-white"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-light p-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted small mb-1">Wallet Balance</p>
                <h3 className="h4 fw-bold mb-0">
                  ₦{parseFloat(tenant.wallet_balance || 0).toLocaleString()}
                </h3>
              </div>
              <div
                className="metric-icon"
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                }}
              >
                <i className="bi bi-wallet2 text-white"></i>
              </div>
            </div>
            <button
              className="btn btn-success btn-sm w-100 mt-3"
              onClick={() => setShowWalletModal(true)}
            >
              <i className="bi bi-plus-circle me-1"></i>
              Fund Wallet
            </button>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card-light p-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted small mb-1">Maintenance Requests</p>
                <h3 className="h4 fw-bold mb-0">
                  {stats.maintenance_requests}
                </h3>
              </div>
              <div
                className="metric-icon"
                style={{
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                }}
              >
                <i className="bi bi-tools text-white"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Personal Information */}
        <div className="col-md-6">
          <div className="card-light p-4 h-100">
            <h5 className="fw-bold mb-3">
              <i className="bi bi-person me-2"></i>
              Personal Information
            </h5>
            <div className="mb-3">
              <small className="text-muted d-block">Full Name</small>
              <span className="fw-semibold">{tenant.name}</span>
            </div>
            <div className="mb-3">
              <small className="text-muted d-block">Email</small>
              <span className="fw-semibold">{tenant.email}</span>
            </div>
            <div>
              <small className="text-muted d-block">Phone</small>
              <span className="fw-semibold">
                {tenant.phone || "Not provided"}
              </span>
            </div>
          </div>
        </div>

        {/* Property & Landlord */}
        <div className="col-md-6">
          <div className="card-light p-4 h-100">
            <h5 className="fw-bold mb-3">
              <i className="bi bi-building me-2"></i>
              Property & Landlord
            </h5>
            {tenant.unit ? (
              <>
                <div className="mb-3">
                  <small className="text-muted d-block">Property</small>
                  <span className="fw-semibold">
                    {tenant.unit.property?.name || "N/A"}
                  </span>
                  <br />
                  <small className="text-muted">
                    {tenant.unit.property?.address || ""}
                  </small>
                </div>
                <div className="mb-3">
                  <small className="text-muted d-block">Unit Number</small>
                  <span className="fw-semibold">{tenant.unit.unit_number}</span>
                </div>
                {tenant.unit.property?.landlord && (
                  <div>
                    <small className="text-muted d-block">Landlord</small>
                    <span className="fw-semibold d-block">
                      {tenant.unit.property.landlord.name}
                    </span>
                    <small className="text-muted">
                      {tenant.unit.property.landlord.email}
                    </small>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted mb-0">No property assigned</p>
            )}
          </div>
        </div>

        {/* Lease Information */}
        {tenant.unit?.lease && (
          <div className="col-12">
            <div className="card-light p-4">
              <h5 className="fw-bold mb-3">
                <i className="bi bi-file-earmark-text me-2"></i>
                Lease Information
              </h5>
              <div className="row">
                <div className="col-md-3">
                  <small className="text-muted d-block">Start Date</small>
                  <span className="fw-semibold">
                    {new Date(
                      tenant.unit.lease.start_date,
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="col-md-3">
                  <small className="text-muted d-block">End Date</small>
                  <span className="fw-semibold">
                    {new Date(tenant.unit.lease.end_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="col-md-3">
                  <small className="text-muted d-block">Rent Amount</small>
                  <span className="fw-semibold">
                    ₦
                    {parseFloat(
                      tenant.unit.lease.rent_amount || 0,
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="col-md-3">
                  <small className="text-muted d-block">Status</small>
                  <span
                    className={`badge ${tenant.unit.lease.status === "Active" ? "bg-success" : "bg-secondary"}`}
                  >
                    {tenant.unit.lease.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Categories Status */}
        {stats.payment_category_status && (
          <div className="col-12">
            <div className="card-light p-4">
              <h5 className="fw-bold mb-3">
                <i className="bi bi-ui-checks-grid me-2"></i>
                Payment Categories Status
              </h5>
              <div className="row g-3">
                {stats.payment_category_status.map((item, index) => (
                  <div key={index} className="col-12 col-md-6 col-lg-3">
                    <div 
                      className={`p-3 border rounded shadow-sm ${item.status === 'Paid' ? 'bg-white border-success border-opacity-25' : 'bg-white border-danger border-opacity-25'}`}
                      style={{ cursor: "pointer", transition: "all 0.2s ease" }}
                      onClick={() => handleCategoryClick(item.category)}
                      onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
                      title={`Click to view all ${item.category} payments`}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-semibold text-secondary">{item.category}</span>
                        <span className={`badge ${item.status === 'Paid' ? 'bg-success' : 'bg-danger'}`}>
                          {item.status}
                        </span>
                      </div>
                      {item.status === 'Paid' ? (
                        <div className="text-muted small fw-medium">
                          Total Paid: ₦{parseFloat(item.amount_paid).toLocaleString()}
                        </div>
                      ) : (
                        <div className="text-danger small fw-medium">
                          Unpaid
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Wallet Balance Card */}
                <div className="col-12 col-md-6 col-lg-3">
                  <div className="p-3 border rounded shadow-sm bg-white border-primary border-opacity-25">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-semibold text-secondary">Wallet Balance</span>
                      <span className="badge bg-primary">
                        <i className="bi bi-wallet2 me-1"></i>
                        Available
                      </span>
                    </div>
                    <div className="text-primary small fw-semibold">
                      ₦{parseFloat(tenant.wallet_balance || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Outstanding Debts Breakdown */}
        {stats.outstanding_breakdown && stats.outstanding_breakdown.length > 0 && (
          <div className="col-12">
            <div className="card-light p-4" style={{ backgroundColor: '#fff5f5' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-danger mb-0">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Outstanding Debts Breakdown
                </h5>
                <span className="badge bg-danger rounded-pill px-3 py-2">
                  Total Pending: ₦{parseFloat(stats.pending_payments || 0).toLocaleString()}
                </span>
              </div>
              <div className="row g-3">
                {stats.outstanding_breakdown.map((item, index) => (
                  <div key={index} className="col-12 col-md-6 col-lg-3">
                    <div className="p-3 bg-white border border-danger border-opacity-25 rounded shadow-sm">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-semibold text-secondary">{item.type}</span>
                        <span className="fw-bold fs-5 text-danger">
                          ₦{parseFloat(item.total).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Payments */}
        <div className="col-12">
          <div className="card-light p-4">
            <h5 className="fw-bold mb-3">
              <i className="bi bi-credit-card me-2"></i>
              Recent Payments
            </h5>
            {payments && payments.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.type}</td>
                        <td className="fw-semibold">
                          ₦{parseFloat(payment.amount || 0).toLocaleString()}
                        </td>
                        <td>
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </td>
                        <td>{payment.method}</td>
                        <td>
                          <span
                            className={`badge ${payment.status === "Paid" ? "bg-success" : "bg-warning"}`}
                          >
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted text-center py-4 mb-0">
                No payments recorded
              </p>
            )}
          </div>
        </div>

        {/* Maintenance Requests */}
        <div className="col-12">
          <div className="card-light p-4">
            <h5 className="fw-bold mb-3">
              <i className="bi bi-tools me-2"></i>
              Maintenance Requests
            </h5>
            {issues && issues.length > 0 ? (
              <div className="row g-3">
                {issues.map((issue) => (
                  <div key={issue.id} className="col-12">
                    <div className="border rounded p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="fw-semibold mb-0">{issue.title}</h6>
                        <span
                          className={`badge ${
                            issue.status === "Open"
                              ? "bg-primary"
                              : issue.status === "Resolved"
                                ? "bg-success"
                                : "bg-warning"
                          }`}
                        >
                          {issue.status}
                        </span>
                      </div>
                      <p className="text-muted small mb-2">
                        {issue.description}
                      </p>
                      <div className="d-flex justify-content-between text-muted small">
                        <span>
                          <i className="bi bi-building me-1"></i>
                          {issue.property?.name || "N/A"}
                          {issue.unit && ` - Unit ${issue.unit.unit_number}`}
                        </span>
                        <span>
                          <i className="bi bi-calendar me-1"></i>
                          {new Date(issue.reported_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-center py-4 mb-0">
                No maintenance requests submitted
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Fund Wallet Modal */}
      {showWalletModal && (
        <div
          className="modal-backdrop-custom"
          onClick={() => setShowWalletModal(false)}
        >
          <div
            className="modal-dialog-custom"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="card-light p-0 overflow-hidden"
              style={{ width: "480px", maxWidth: "95vw" }}
            >
              {/* Modal Header */}
              <div
                className="p-4"
                style={{
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="fw-bold mb-1">
                      <i className="bi bi-wallet2 me-2"></i>
                      Fund Wallet
                    </h5>
                    <p className="mb-0 small opacity-75">
                      Add funds to {tenant.name}'s wallet
                    </p>
                  </div>
                  <button
                    className="btn btn-close btn-close-white"
                    onClick={() => setShowWalletModal(false)}
                  ></button>
                </div>
              </div>

              {/* Current Balance */}
              <div className="px-4 pt-4">
                <div
                  className="p-3 rounded-3 text-center"
                  style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
                >
                  <small className="text-muted d-block mb-1">
                    Current Wallet Balance
                  </small>
                  <h4 className="fw-bold mb-0" style={{ color: "#059669" }}>
                    ₦{parseFloat(tenant.wallet_balance || 0).toLocaleString()}
                  </h4>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleFundWallet} className="p-4">
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-cash-stack me-1"></i>
                    Amount (₦)
                  </label>
                  <input
                    type="number"
                    className="form-control form-control-lg"
                    placeholder="Enter amount to add"
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                    min="1"
                    step="0.01"
                    required
                    autoFocus
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-chat-left-text me-1"></i>
                    Description (Optional)
                  </label>
                  <textarea
                    className="form-control"
                    placeholder="e.g. Monthly credit, Refund, Bonus..."
                    value={walletDescription}
                    onChange={(e) => setWalletDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Preview */}
                {walletAmount && parseFloat(walletAmount) > 0 && (
                  <div
                    className="p-3 rounded-3 mb-4"
                    style={{
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    <div className="d-flex justify-content-between small">
                      <span className="text-muted">Current Balance</span>
                      <span>
                        ₦
                        {parseFloat(
                          tenant.wallet_balance || 0,
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between small mt-1">
                      <span className="text-muted">Amount to Add</span>
                      <span className="text-success fw-semibold">
                        +₦{parseFloat(walletAmount).toLocaleString()}
                      </span>
                    </div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between fw-bold">
                      <span>New Balance</span>
                      <span style={{ color: "#059669" }}>
                        ₦
                        {(
                          parseFloat(tenant.wallet_balance || 0) +
                          parseFloat(walletAmount)
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary flex-fill"
                    onClick={() => setShowWalletModal(false)}
                    disabled={fundingWallet}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success flex-fill"
                    disabled={
                      fundingWallet ||
                      !walletAmount ||
                      parseFloat(walletAmount) <= 0
                    }
                  >
                    {fundingWallet ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-plus-circle me-2"></i>
                        Fund Wallet
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Payments Details Modal */}
      {selectedCategoryDetails && (
        <div
          className="modal-backdrop-custom"
          onClick={() => setSelectedCategoryDetails(null)}
          style={{ zIndex: 1050 }}
        >
          <div
            className="modal-dialog-custom"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "800px", width: "95vw" }}
          >
            <div className="card-light p-0 overflow-hidden">
              <div
                className="p-4"
                style={{
                  background: "linear-gradient(135deg, #4f46e5 0%, #312e81 100%)",
                  color: "white",
                }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="fw-bold mb-1">
                      <i className="bi bi-wallet2 me-2"></i>
                      {selectedCategoryDetails} Payments
                    </h5>
                    <p className="mb-0 small opacity-75">
                      Payment history for {selectedCategoryDetails}
                    </p>
                  </div>
                  <button
                    className="btn btn-close btn-close-white"
                    onClick={() => setSelectedCategoryDetails(null)}
                  ></button>
                </div>
              </div>

              <div className="p-4" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                {loadingCategoryPayments ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : categoryPayments.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th>Receipt</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Status</th>
                          <th>Notes</th>
                          <th>Evidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryPayments.map((payment) => (
                          <tr key={payment.id}>
                            <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                            <td className="fw-medium">{payment.receipt_number || "-"}</td>
                            <td className="fw-semibold">₦{parseFloat(payment.amount || 0).toLocaleString()}</td>
                            <td>{payment.method}</td>
                            <td>
                              <span
                                className={`badge ${
                                  payment.status === "Paid"
                                    ? "bg-success"
                                    : payment.status === "Pending"
                                    ? "bg-warning"
                                    : "bg-danger"
                                }`}
                              >
                                {payment.status}
                              </span>
                            </td>
                            <td>
                              <span className="text-muted small" style={{ maxWidth: "150px", display: "inline-block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} title={payment.notes || "No notes"}>
                                {payment.notes || "-"}
                              </span>
                            </td>
                            <td>
                              {payment.evidence_path ? (
                                <a
                                  href={`http://localhost:8000/${payment.evidence_path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary py-0 px-2"
                                  title="View Evidence"
                                >
                                  <i className="bi bi-file-earmark-image"></i> View
                                </a>
                              ) : (
                                <span className="text-muted small opacity-50">None</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-inbox fs-1 text-muted mb-3 d-block"></i>
                    <p className="text-muted mb-0">No payment history found for this category.</p>
                  </div>
                )}
              </div>

              <div className="p-3 border-top bg-light text-end">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedCategoryDetails(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
