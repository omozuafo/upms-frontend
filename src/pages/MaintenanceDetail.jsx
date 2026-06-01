import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useAutoRefresh from "../hooks/useAutoRefresh";
import api from "../services/api";
import { useRefresh } from "../contexts/RefreshContext";
import { toast } from "react-toastify";

export default function MaintenanceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { triggerRefresh } = useRefresh();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const userRole = sessionStorage.getItem("role");

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetCost, setBudgetCost] = useState("");
  const [maintenanceReport, setMaintenanceReport] = useState("");

  const fetchIssue = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);
        const response = await api.get(`/issues/${id}`);
        setIssue(response.data);
      } catch (error) {
        console.error("Failed to fetch issue:", error);
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    fetchIssue(true);
  }, [fetchIssue]);

  useAutoRefresh(() => fetchIssue(false));

  const updateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      await api.put(`/issues/${id}`, { status: newStatus });
      setIssue({ ...issue, status: newStatus });
      triggerRefresh();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    } finally {
        setUpdating(false);
    }
  };

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!budgetCost || !maintenanceReport) return;
    try {
      setUpdating(true);
      const res = await api.post(`/issues/${id}/budget`, {
        budget_cost: parseFloat(budgetCost),
        maintenance_report: maintenanceReport
      });
      setIssue(res.data);
      setShowBudgetModal(false);
      triggerRefresh();
    } catch (err) {
      alert("Failed to submit budget");
    } finally {
      setUpdating(false);
    }
  };

  const handleMaintenanceReject = async () => {
    if (!window.confirm("Are you sure you want to reject this request?")) return;
    try {
      setUpdating(true);
      const res = await api.post(`/issues/${id}/reject`);
      setIssue(res.data);
      triggerRefresh();
    } catch (err) {
      toast.error("Failed to reject");
    } finally {
      setUpdating(false);
    }
  };

  const handleAccountAction = async (action) => {
    if (!window.confirm(`Are you sure you want to ${action} this budget? ${action === 'Accept' ? 'This will deduct from tenant wallet.' : ''}`)) return;
    try {
      setUpdating(true);
      const res = await api.post(`/issues/${id}/account-action`, { action });
      setIssue(res.data);
      triggerRefresh();
    } catch (err) {
      toast.error(`Failed to execute ${action}`);
    } finally {
      setUpdating(false);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "Critical": return "bg-danger";
      case "High": return "bg-warning text-dark";
      case "Medium": return "bg-info";
      default: return "bg-secondary";
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Open": return "bg-primary";
      case "In Progress": return "bg-warning text-dark";
      case "Resolved": return "bg-success";
      default: return "bg-secondary";
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

  if (!issue) {
    return <div className="min-vh-100 p-4 bg-light"><div className="alert alert-danger">Issue not found</div></div>;
  }

  return (
    <div className="min-vh-100 p-4 p-md-5 bg-light">
      <div className="mb-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
            <button
            onClick={() => navigate(-1)}
            className="btn btn-sm btn-light rounded-pill px-3 mb-3 shadow-sm border-0 d-inline-flex align-items-center text-muted fw-semibold"
            >
            <i className="bi bi-arrow-left me-2"></i>
            Back
            </button>
            <h1 className="h3 fw-bold text-dark d-flex align-items-center mb-0">
            <span className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle d-inline-flex me-3 shadow-sm">
              <i className="bi bi-tools fs-5"></i>
            </span>
            {issue.title}
            </h1>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className={`badge px-4 py-2 rounded-pill shadow-sm fs-6 ${getPriorityBadgeClass(issue.priority)}`}>
               <i className="bi bi-flag-fill me-2"></i> Priority: {issue.priority}
            </span>
            <span className={`badge px-4 py-2 rounded-pill shadow-sm fs-6 ${getStatusBadgeClass(issue.status)}`}>
               <i className="bi bi-record-circle me-2"></i> Status: {issue.status}
            </span>
        </div>
      </div>

      <div className="row g-4">
        {/* Main Content Column */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
            <div className="card-body p-4 p-md-5">
              
              <h5 className="fw-bold mb-3 text-secondary text-uppercase tracking-wider" style={{ fontSize: '0.85rem' }}>
                <i className="bi bi-card-text me-2"></i> Description
              </h5>
              <p className="fs-5 text-dark mb-5" style={{ lineHeight: '1.7' }}>{issue.description}</p>

              {/* Evidence Photo Section */}
              {issue.images && issue.images.length > 0 && (
                <div className="mb-5">
                  <h5 className="fw-bold mb-3 text-secondary text-uppercase tracking-wider" style={{ fontSize: '0.85rem' }}>
                     <i className="bi bi-image me-2"></i> Evidence Photo
                  </h5>
                  <div className="rounded-4 overflow-hidden shadow border border-light position-relative">
                    <img 
                      src={`http://localhost:8000/storage/${issue.images[0]}`} 
                      alt="Maintenance Evidence" 
                      className="img-fluid w-100 object-fit-cover" 
                      style={{ maxHeight: '450px', display: 'block' }} 
                    />
                    <div className="position-absolute bottom-0 start-0 p-3 w-100" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                        <span className="text-white small fw-medium"><i className="bi bi-camera me-1"></i> Attached by {issue.reporter?.name || 'Tenant'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Maintenance Report & Budget */}
              {issue.maintenance_report && (
                  <div className="mb-5 bg-primary bg-opacity-10 p-4 p-md-5 rounded-4 border border-primary border-opacity-25 shadow-sm position-relative overflow-hidden">
                      {/* Decorative Background Icon */}
                      <i className="bi bi-file-earmark-check text-primary position-absolute end-0 bottom-0 opacity-10" style={{ fontSize: '10rem', transform: 'translate(20%, 20%)' }}></i>
                      
                      <div className="d-flex align-items-center mb-4 position-relative z-1">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3 shadow" style={{width: 54, height: 54}}>
                           <i className="bi bi-clipboard-check fs-4"></i>
                        </div>
                        <h4 className="text-primary-emphasis fw-bold mb-0">Maintenance Report</h4>
                      </div>
                      
                      <div className="bg-white rounded-3 p-4 shadow-sm mb-4 position-relative z-1">
                          <p className="fs-6 text-dark mb-0" style={{ lineHeight: '1.6' }}>
                              {issue.maintenance_report}
                          </p>
                      </div>
                      
                      <div className="bg-white rounded-4 p-4 shadow-sm position-relative z-1 mb-4">
                          <div className="row g-4 align-items-center">
                              <div className="col-12 col-md-6 border-end-md">
                                <span className="text-muted small d-block text-uppercase fw-bold mb-2 tracking-wider">Proposed Budget</span>
                                <span className="fs-2 fw-bold text-dark">₦{parseFloat(issue.budget_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="col-12 col-md-6">
                                <span className="text-muted small d-block text-uppercase fw-bold mb-2 tracking-wider">Account Review</span>
                                {issue.account_review_status ? (
                                    <span className={`badge px-4 py-2 fs-6 rounded-pill shadow-sm ${issue.account_review_status === 'Accepted' ? 'bg-success' : issue.account_review_status === 'Pending' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                       <i className={`bi me-2 ${issue.account_review_status === 'Accepted' ? 'bi-check-circle-fill' : issue.account_review_status === 'Pending' ? 'bi-hourglass-split' : 'bi-x-circle-fill'}`}></i>
                                       {issue.account_review_status}
                                    </span>
                                ) : (
                                    <span className="badge bg-secondary px-4 py-2 fs-6 rounded-pill">Not Reviewed</span>
                                )}
                              </div>
                          </div>
                      </div>

                      {issue.tenant_budget_split && issue.tenant_budget_split.length > 0 && (
                          <div className="bg-white rounded-4 p-4 shadow-sm position-relative z-1">
                              <span className="text-muted small d-block text-uppercase fw-bold mb-3 tracking-wider">Custom Tenant Budget Breakdown</span>
                              <div className="table-responsive">
                                  <table className="table table-sm table-borderless align-middle mb-0">
                                      <thead className="border-bottom">
                                          <tr>
                                              <th className="text-muted small fw-semibold pb-2">Tenant ID</th>
                                              <th className="text-muted small fw-semibold pb-2 text-end">Amount Deducted</th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {issue.tenant_budget_split.map((split, i) => (
                                              <tr key={i} className="border-bottom border-light">
                                                  <td className="py-2 text-dark fw-medium">Tenant #{split.tenant_id}</td>
                                                  <td className="py-2 text-end text-primary fw-bold">₦{parseFloat(split.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      )}
                  </div>
              )}

              <hr className="my-5 border-light" />

              {/* Metadata Grid */}
              <h5 className="fw-bold mb-4 text-secondary text-uppercase tracking-wider" style={{ fontSize: '0.85rem' }}>
                <i className="bi bi-info-circle me-2"></i> Issue Details
              </h5>
              <div className="row g-4">
                <div className="col-sm-6">
                  <div className="p-4 bg-light rounded-4 h-100 border border-white shadow-sm transition-all hover-lift">
                    <div className="d-flex align-items-center mb-2">
                       <div className="bg-white p-2 rounded-circle shadow-sm me-3"><i className="bi bi-building text-primary"></i></div>
                       <small className="text-muted text-uppercase fw-bold tracking-wider" style={{fontSize: '0.75rem'}}>Property</small>
                    </div>
                    <strong className="fs-6 text-dark d-block mt-2 ms-5 ps-1">{issue.property?.name || "N/A"}</strong>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-4 bg-light rounded-4 h-100 border border-white shadow-sm transition-all hover-lift">
                    <div className="d-flex align-items-center mb-2">
                       <div className="bg-white p-2 rounded-circle shadow-sm me-3"><i className="bi bi-door-open text-primary"></i></div>
                       <small className="text-muted text-uppercase fw-bold tracking-wider" style={{fontSize: '0.75rem'}}>Unit</small>
                    </div>
                    <strong className="fs-6 text-dark d-block mt-2 ms-5 ps-1">{issue.unit?.unit_number ? `Unit ${issue.unit.unit_number}` : "N/A"}</strong>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-4 bg-light rounded-4 h-100 border border-white shadow-sm transition-all hover-lift">
                    <div className="d-flex align-items-center mb-2">
                       <div className="bg-white p-2 rounded-circle shadow-sm me-3"><i className="bi bi-person text-primary"></i></div>
                       <small className="text-muted text-uppercase fw-bold tracking-wider" style={{fontSize: '0.75rem'}}>Reported By</small>
                    </div>
                    <strong className="fs-6 text-dark d-block mt-2 ms-5 ps-1">{issue.reporter?.name || "N/A"}</strong>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-4 bg-light rounded-4 h-100 border border-white shadow-sm transition-all hover-lift">
                    <div className="d-flex align-items-center mb-2">
                       <div className="bg-white p-2 rounded-circle shadow-sm me-3"><i className="bi bi-calendar3 text-primary"></i></div>
                       <small className="text-muted text-uppercase fw-bold tracking-wider" style={{fontSize: '0.75rem'}}>Reported At</small>
                    </div>
                    <strong className="fs-6 text-dark d-block mt-2 ms-5 ps-1">{new Date(issue.reported_at).toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Center Sidebar */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 position-sticky" style={{ top: '2rem' }}>
            <div className="card-body p-4 p-xl-5">
              <h5 className="fw-bold mb-4 pb-3 border-bottom d-flex align-items-center text-dark">
                <i className="bi bi-lightning-charge-fill text-warning me-2 fs-4"></i>
                Action Center
              </h5>

              <div className="d-grid gap-3">
                  {/* Maintenance Staff Specific Actions */}
                  {userRole === 'maintenance_staff' && issue.status === 'Open' && !issue.account_review_status && (
                      <>
                          <button className="btn btn-primary btn-lg py-3 fw-bold shadow-sm d-flex justify-content-center align-items-center w-100 text-nowrap" onClick={() => setShowBudgetModal(true)} disabled={updating}>
                              <i className="bi bi-calculator me-2 fs-5"></i> Submit Budget
                          </button>
                          <button className="btn btn-outline-danger py-3 fw-bold text-nowrap" onClick={handleMaintenanceReject} disabled={updating}>
                              <i className="bi bi-trash3 me-2 fs-5"></i> Reject Issue
                          </button>
                      </>
                  )}

                  {/* Accounting Staff Specific Actions */}
                  {(userRole === 'accounting_staff' || userRole === 'admin' || userRole === 'super_admin') && issue.account_review_status === 'Pending' && (
                      <div className="border border-warning bg-warning bg-opacity-10 p-4 rounded-4 shadow-sm mb-2 position-relative overflow-hidden">
                          <div className="position-absolute top-0 end-0 p-3 opacity-10">
                              <i className="bi bi-check2-square" style={{ fontSize: '4rem' }}></i>
                          </div>
                          <h6 className="fw-bold text-warning-emphasis mb-4 d-flex align-items-center position-relative z-1">
                              <span className="spinner-grow spinner-grow-sm me-2 text-warning" role="status"></span>
                              Pending Budget Review
                          </h6>
                          <div className="d-grid gap-3 position-relative z-1">
                              {(() => {
                                  let noFunds = false;
                                  let tooltipMsg = "Accept & Deduct";
                                  
                                  if (issue.tenant_budget_split && issue.tenant_budget_split.length > 0) {
                                      // It's a property-wide split assignment. Allow deduction (handles negative balances)
                                      tooltipMsg = "Accept & Deduct (Debits will be applied to mapped tenants)";
                                  } else {
                                      const tenant = issue.unit?.tenant || issue.reporter;
                                      const balance = parseFloat(tenant?.wallet_balance || 0);
                                      const cost = parseFloat(issue.budget_cost || 0);
                                      noFunds = balance < cost;
                                      if (noFunds) {
                                          tooltipMsg = balance === 0 
                                              ? "Tenant has no money in the wallet." 
                                              : `Tenant money is not sufficient (Balance: ₦${balance.toLocaleString()})`;
                                      }
                                  }

                                  return (
                                      <div title={tooltipMsg}>
                                          <button 
                                              className={`btn btn-success py-3 fw-bold shadow-sm d-flex justify-content-center align-items-center w-100 ${noFunds ? 'opacity-50' : ''}`} 
                                              onClick={() => handleAccountAction('Accept')} 
                                              disabled={updating || noFunds}
                                              style={noFunds ? { pointerEvents: 'none' } : {}}
                                          >
                                              <i className="bi bi-check-circle-fill me-2 fs-5"></i> Accept & Deduct
                                          </button>
                                      </div>
                                  );
                              })()}
                              <button className="btn btn-outline-danger py-2 fw-semibold" onClick={() => handleAccountAction('Reject')} disabled={updating}>
                                  <i className="bi bi-x-circle me-1"></i> Reject Budget
                              </button>
                              <button className="btn btn-outline-secondary py-2 fw-semibold" onClick={() => handleAccountAction('Dispute')} disabled={updating}>
                                  <i className="bi bi-exclamation-triangle me-1"></i> Dispute
                              </button>
                          </div>
                      </div>
                  )}

                  {/* General Status Actions */}
                  {issue.account_review_status === 'Accepted' && issue.status !== "In Progress" && issue.status !== "Resolved" && issue.status !== "Closed" && (
                    <button className="btn btn-warning py-3 fw-bold shadow-sm d-flex justify-content-center align-items-center text-dark" onClick={() => updateStatus("In Progress")} disabled={updating}>
                      <i className="bi bi-hourglass-split me-2 fs-5"></i> Mark as In Progress
                    </button>
                  )}

                  {issue.status === "In Progress" && userRole === "maintenance_staff" && (
                    <button className="btn btn-success py-3 fw-bold shadow-sm d-flex justify-content-center align-items-center text-white" onClick={() => updateStatus("Resolved")} disabled={updating}>
                      <i className="bi bi-check-circle-fill me-2 fs-5"></i> Mark as Resolved
                    </button>
                  )}
                  {issue.status === "In Progress" && userRole !== "maintenance_staff" && (
                     <div className="text-center p-3 text-info bg-info bg-opacity-10 rounded-3 border border-info border-opacity-25 fw-semibold d-flex align-items-center justify-content-center">
                         <i className="bi bi-wallet2 me-2 fs-5"></i> Budget Allocated (In Progress)
                     </div>
                  )}
                  
                  {issue.status === "Resolved" && (
                     <div className="text-center p-3 text-success bg-success bg-opacity-10 rounded-3 border border-success border-opacity-25 fw-semibold d-flex align-items-center justify-content-center">
                         <i className="bi bi-emoji-smile-fill me-2 fs-5"></i> Issue Resolved
                     </div>
                  )}
                  {issue.status === "Closed" && (
                     <div className="text-center p-3 text-secondary bg-secondary bg-opacity-10 rounded-3 border border-secondary border-opacity-25 fw-semibold d-flex align-items-center justify-content-center">
                         <i className="bi bi-lock-fill me-2 fs-5"></i> Issue Closed
                     </div>
                  )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Modal */}
      {showBudgetModal && (
          <div className="modal-backdrop-custom">
            <div className="modal-dialog-custom w-100" style={{maxWidth: '550px'}}>
                <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
                    <div className="card-header bg-white border-bottom-0 pt-4 pb-0 px-4 px-md-5 d-flex justify-content-between align-items-center">
                        <h4 className="fw-bold text-dark mb-0 d-flex align-items-center">
                            <i className="bi bi-wallet2 text-primary me-3"></i> Submit Budget
                        </h4>
                        <button type="button" className="btn-close shadow-none p-2 bg-light rounded-circle" onClick={() => setShowBudgetModal(false)}></button>
                    </div>
                    <form onSubmit={handleBudgetSubmit}>
                        <div className="card-body p-4 p-md-5">
                            <div className="mb-4">
                                <label className="form-label text-muted fw-bold text-uppercase tracking-wider small">Estimated Cost (₦)</label>
                                <div className="input-group input-group-lg shadow-sm rounded-3 overflow-hidden">
                                    <span className="input-group-text bg-light border-0 fw-bold text-muted">₦</span>
                                    <input type="number" step="0.01" min="0" className="form-control border-0 bg-light" value={budgetCost} onChange={(e) => setBudgetCost(e.target.value)} required placeholder="0.00" />
                                </div>
                            </div>
                            <div className="mb-2">
                                <label className="form-label text-muted fw-bold text-uppercase tracking-wider small">Detailed Report</label>
                                <textarea className="form-control form-control-lg bg-light border-0 shadow-sm rounded-3 p-3" rows="5" value={maintenanceReport} onChange={(e) => setMaintenanceReport(e.target.value)} required placeholder="Describe the problem, materials needed, and justification for the budget..."></textarea>
                            </div>
                        </div>
                        <div className="card-footer bg-light border-top-0 d-flex justify-content-end p-4 gap-3">
                            <button type="button" className="btn btn-outline-secondary fw-semibold px-4" onClick={() => setShowBudgetModal(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary fw-bold px-4 shadow-sm" disabled={updating}>
                                {updating ? "Submitting..." : "Send to Accounts"} <i className="bi bi-send-fill ms-2"></i>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
          </div>
      )}
      
      <style>{`
          .tracking-wider { letter-spacing: 0.05em; }
          .hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
          .hover-lift:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important; z-index: 1; }
          .border-end-md { border-right: 1px solid #dee2e6; }
          @media (max-width: 767px) { .border-end-md { border-right: none; border-bottom: 1px solid #dee2e6; padding-bottom: 1rem; margin-bottom: 1rem; } }
      `}</style>
    </div>
  );
}
