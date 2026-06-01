import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";

export default function TenantPortal() {
  const [lease, setLease] = useState(null);
  const [payments, setPayments] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Payment Form State
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [activeContext, setActiveContext] = useState(null); // New state
  const [paymentData, setPaymentData] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    type: "Rent",
    method: "Bank Transfer",
    notes: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.post("/auth/me");
        setUser(userRes.data);

        if (userRes.data.id) {
          // Fetch Lease
          const leaseRes = await api.get(
            `/leases?tenant_id=${userRes.data.id}`,
          );
          if (leaseRes.data.length > 0) {
            setLease(leaseRes.data[0]);
          }

          // Fetch Payments
          const paymentsRes = await api.get(
            `/payments?tenant_id=${userRes.data.id}`,
          );
          setPayments(paymentsRes.data);

          // Fetch Active Context
          try {
            const contextRes = await api.get("/tenants/active-context");
            if (contextRes.data.has_active_context) {
              setActiveContext(contextRes.data.context);
            }
          } catch (e) {
            console.error("Failed to fetch active context", e);
          }

          // Fetch Issues
          const issuesRes = await api.get("/issues"); // Backend filters by user role/id if implemented
          setIssues(
            issuesRes.data.filter(
              (i) =>
                i.reported_by === userRes.data.id ||
                i.reported_by?.id === userRes.data.id,
            ),
          );
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch portal data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!lease) return toast.error("No active lease found to pay for.");

    try {
      const payload = {
        ...paymentData,
        tenant_id: user.id,
        lease_id: lease.id,
        unit_id: lease.unit_id || lease.unit.id,
      };

      const res = await api.post("/payments", payload);
      setPayments([res.data, ...payments]);
      setShowPaymentForm(false);
      setPaymentData({
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        type: "Rent",
        method: "Bank Transfer",
        notes: "",
      });
      toast.success("Payment recorded successfully!");
    } catch (error) {
      console.error("Payment failed:", error);
      toast.error("Failed to submit payment");
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-vh-100 p-4 bg-light">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 fw-bold mb-0">My Portal</h1>
        {activeContext && (
          <div className="badge bg-success p-2 d-none d-md-block">
            <i className="bi bi-house-check-fill me-2"></i>
            Active: {activeContext.property_name} - Unit{" "}
            {activeContext.unit_number}
          </div>
        )}
      </div>

      <div className="row g-4">
        {/* Lease Information */}
        <div className="col-12 col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title h5 fw-bold mb-3">My Lease</h2>
              {lease ? (
                <div>
                  <p className="text-secondary mb-2">
                    <span className="fw-semibold">Property:</span>{" "}
                    {lease.unit?.property?.name}
                  </p>
                  <p className="text-secondary mb-2">
                    <span className="fw-semibold">Unit:</span>{" "}
                    {lease.unit?.unit_number}
                  </p>
                  <p className="text-secondary mb-2">
                    <span className="fw-semibold">Rent:</span> $
                    {lease.rent_amount}
                  </p>
                  <p className="text-secondary mb-2">
                    <span className="fw-semibold">Term:</span>{" "}
                    {new Date(lease.start_date).toLocaleDateString()} -{" "}
                    {new Date(lease.end_date).toLocaleDateString()}
                  </p>
                  <span
                    className={`badge mt-2 ${
                      lease.status === "Active" ? "bg-success" : "bg-secondary"
                    }`}
                  >
                    {lease.status}
                  </span>
                </div>
              ) : (
                <p className="text-secondary">No active lease found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-12 col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title h5 fw-bold mb-3">Quick Actions</h2>
              <Link
                to="/maintenance/new"
                className="btn btn-warning w-100 mb-2"
              >
                Report Maintenance Issue
              </Link>
              <button
                onClick={() => setShowPaymentForm(!showPaymentForm)}
                className="btn btn-primary w-100"
              >
                {showPaymentForm ? "Cancel Payment" : "Make Payment"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      {showPaymentForm && (
        <div className="card shadow-sm mt-4">
          <div className="card-body">
            <h2 className="card-title h5 fw-bold mb-3">Make a Payment</h2>
            <form onSubmit={handlePaymentSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Amount</label>
                  <input
                    type="number"
                    required
                    className="form-control"
                    value={paymentData.amount}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, amount: e.target.value })
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Date</label>
                  <input
                    type="date"
                    required
                    className="form-control"
                    value={paymentData.payment_date}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        payment_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Type</label>
                  <select
                    className="form-select"
                    value={paymentData.type}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, type: e.target.value })
                    }
                  >
                    <option>Rent</option>
                    <option>Security Deposit</option>
                    <option>Service Charge</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Method</label>
                  <select
                    className="form-select"
                    value={paymentData.method}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, method: e.target.value })
                    }
                  >
                    <option>Bank Transfer</option>
                    <option>Check</option>
                    <option>Cash</option>
                    <option>Online</option>
                  </select>
                </div>
                <div className="col-12">
                  <button className="btn btn-success">Submit Payment</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recent Activity Section */}
      <div className="row g-4 mt-4">
        {/* Payment History */}
        <div className="col-12 col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title h5 fw-bold mb-3">Payment History</h2>
              {payments.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm mb-0">
                    <thead>
                      <tr className="border-bottom">
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Amount</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.slice(0, 5).map((pay) => (
                        <tr key={pay.id} className="border-bottom">
                          <td className="py-2">
                            {new Date(pay.payment_date).toLocaleDateString()}
                          </td>
                          <td className="py-2">${pay.amount}</td>
                          <td className="py-2">{pay.type}</td>
                          <td className="py-2">
                            <span className="badge bg-success">
                              {pay.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-secondary">No payment history available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Maintenance Issues */}
        <div className="col-12 col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title h5 fw-bold mb-3">
                Open Maintenance Requests
              </h2>
              {issues.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {issues.map((issue) => (
                    <div key={issue.id} className="pb-3 border-bottom">
                      <div className="d-flex justify-content-between align-items-start">
                        <h3 className="h6 fw-semibold mb-1">{issue.title}</h3>
                        <span
                          className={`badge ${
                            issue.priority === "Critical"
                              ? "bg-danger"
                              : issue.priority === "High"
                                ? "bg-warning text-dark"
                                : "bg-primary"
                          }`}
                        >
                          {issue.status}
                        </span>
                      </div>
                      <p className="small text-secondary text-truncate mb-1">
                        {issue.description}
                      </p>
                      <p className="small text-muted mb-0">
                        Reported:{" "}
                        {new Date(issue.reported_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-secondary">No open maintenance requests.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
