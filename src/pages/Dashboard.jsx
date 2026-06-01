import { useEffect, useState, useCallback } from "react";
import useAutoRefresh from "../hooks/useAutoRefresh";
import { Link, useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statModal, setStatModal] = useState(null);
  const navigate = useNavigate();
  const userRole = sessionStorage.getItem("role");

  const formatCompact = (val) => {
    const num = Number(val || 0);
    if (!num) return "0";
    if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toLocaleString();
  };

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      const response = await api.get("/dashboard/stats");
      setStats(response.data);
      if (isInitial) setLoading(false);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      if (isInitial) {
        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load dashboard data",
        );
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  useAutoRefresh(() => fetchData(false), 5000);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-vh-100 p-4 bg-light">
        <div className="alert alert-danger">
          <h5 className="alert-heading">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Failed to Load Dashboard Data
          </h5>
          <p className="mb-0">{error || "Unknown error occurred"}</p>
          <hr />
          <p className="mb-0 small">
            Please check the browser console (F12) for more details.
          </p>
        </div>
      </div>
    );
  }

  // Get dashboard title based on role
  const getDashboardTitle = () => {
    switch (userRole) {
      case "maintenance_staff":
        return "Maintenance Dashboard";
      case "tenant":
        return "My Portal";
      case "landlord":
        return "Landlord Dashboard";
      case "admin":
      case "super_admin":
        return "Admin Dashboard";
      case "accounting_staff":
        return "Accounting Dashboard";
      default:
        return "Dashboard";
    }
  };

  const getDashboardSubtitle = () => {
    switch (userRole) {
      case "maintenance_staff":
        return "Manage and track your assigned maintenance requests";
      case "tenant":
        return "View your lease and payment information";
      case "landlord":
        return "Manage your properties and tenants";
      case "admin":
      case "super_admin":
        return "Overview of system performance and metrics";
      case "accounting_staff":
        return "Overview of system finances, debts, and metrics";
      default:
        return "Property management overview";
    }
  };

  return (
    <div className="min-vh-100 p-4 bg-light">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        {userRole === "tenant" ? (
          <div className="text-center w-100">
            <h1 className="h2 fw-bold text-dark">My Portal</h1>
          </div>
        ) : (
          <div>
            <h1 className="h2 fw-bold">
              <i className="bi bi-speedometer2 me-2"></i>
              {getDashboardTitle()}
            </h1>
            <p className="text-muted mb-0">{getDashboardSubtitle()}</p>
          </div>
        )}
      </div>

      {/* Tenant View - Portal Style */}
      {userRole === "tenant" && (
        <>
          {/* My Rent Premium Card - Full Width */}
          <div className="row mb-4">
            <div className="col-12">
              {!stats.has_active_lease ? (
                <div className="card border-0 shadow-sm p-5 text-center bg-white rounded-4">
                   <div className="mx-auto bg-light rounded-circle d-flex align-items-center justify-content-center mb-4" style={{ width: '80px', height: '80px' }}>
                     <i className="bi bi-house-x text-muted fs-1"></i>
                   </div>
                   <h4 className="fw-bold">No Active Rent Record</h4>
                   <p className="text-muted mb-0">You do not have an active lease linked to this account.</p>
                </div>
              ) : (
                <div className="card border-0 shadow-sm overflow-hidden rounded-4">
                  <div className="row g-0">
                    <div className="col-12 col-lg-8 p-4 p-md-5 bg-white">
                      <div className="d-flex justify-content-between align-items-start mb-4">
                        <div>
                          <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-semibold mb-3">
                            <i className="bi bi-check-circle-fill me-2"></i>
                            Active Lease
                          </span>
                          <h2 className="fw-bold mb-2">{stats.property.name}</h2>
                          <p className="text-muted mb-0 fs-5"><i className="bi bi-geo-alt-fill text-danger me-2"></i>{stats.property.address}</p>
                        </div>
                      </div>
                      
                      <hr className="my-4 border-light" />
                      
                      <div className="row g-4 mt-2">
                        <div className="col-sm-4 border-end">
                          <p className="text-muted small text-uppercase fw-semibold mb-1">Unit</p>
                          <h5 className="fw-bold text-dark mb-0">
                            {stats.units && stats.units.length > 1
                              ? `${stats.units.length} Units`
                              : `Unit ${stats.unit.unit_number}`}
                          </h5>
                        </div>
                        <div className="col-sm-4 border-end">
                          <p className="text-muted small text-uppercase fw-semibold mb-1">Annual Rent</p>
                          <h5 className="fw-bold text-dark mb-0">₦{parseFloat(stats.unit.rent_amount || 0).toLocaleString()}</h5>
                        </div>
                        <div className="col-sm-4">
                          <p className="text-muted small text-uppercase fw-semibold mb-1">Period Ends</p>
                          <h5 className="fw-bold text-dark mb-0">
                            {stats.lease.end_date ? new Date(stats.lease.end_date).toLocaleDateString() : 'N/A'}
                          </h5>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-12 col-lg-4 p-4 p-md-5 d-flex flex-column justify-content-center align-items-center text-center" style={{ background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)", color: "white" }}>
                      <div className="mb-4">
                         <div className="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '80px', height: '80px' }}>
                           <i className="bi bi-shield-check text-white display-5"></i>
                         </div>
                      </div>
                      <h5 className="text-white-50 fw-semibold text-uppercase tracking-wider mb-2">Rent Status</h5>
                      <span className="badge bg-white text-primary px-4 py-2 fs-5 rounded-pill shadow-sm">
                        {stats.lease.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="row g-4 mb-4">
            {/* Quick Actions */}
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100 rounded-4">
                <div className="card-body p-4">
                  <h5 className="card-title fw-bold mb-4">Quick Actions</h5>
                  <div className="d-grid gap-3">
                    <Link
                      to="/payments"
                      className="btn btn-primary fw-semibold py-3 rounded-3 shadow-sm d-flex justify-content-between align-items-center"
                    >
                      <span><i className="bi bi-wallet2 me-2"></i> Make Payment</span>
                      <i className="bi bi-arrow-right"></i>
                    </Link>
                    <Link
                      to="/maintenance/new"
                      className="btn btn-warning fw-semibold py-3 rounded-3 shadow-sm d-flex justify-content-between align-items-center text-dark"
                    >
                      <span><i className="bi bi-wrench me-2"></i> Report Issue</span>
                      <i className="bi bi-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="col-md-8">
              <div className="card border-0 shadow-sm h-100 rounded-4">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="card-title fw-bold mb-0">Recent Payments</h5>
                    <Link to="/payments" className="btn btn-sm btn-light">View All</Link>
                  </div>
                  
                  {stats.payments && stats.payments.payment_history && stats.payments.payment_history.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="border-0">Date</th>
                            <th className="border-0">Amount</th>
                            <th className="border-0">Type</th>
                            <th className="border-0">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.payments.payment_history.slice(0, 4).map((payment) => (
                            <tr key={payment.id}>
                              <td className="text-secondary">
                                {new Date(payment.payment_date).toLocaleDateString()}
                              </td>
                              <td className="fw-semibold text-dark">
                                ₦{parseFloat(payment.amount).toLocaleString()}
                              </td>
                              <td><span className="badge bg-light text-dark">{payment.type}</span></td>
                              <td>
                                <span
                                  className={`badge rounded-pill px-3 py-1 ${
                                    payment.status === "Paid"
                                      ? "bg-success bg-opacity-10 text-success"
                                      : payment.status === "Pending"
                                        ? "bg-warning bg-opacity-10 text-warning"
                                        : "bg-secondary bg-opacity-10 text-secondary"
                                  }`}
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
                    <div className="text-center py-4 bg-light rounded-3">
                      <i className="bi bi-receipt text-muted fs-2 mb-2 d-block"></i>
                      <p className="text-muted mb-0">No payment history found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Non-Tenant Views */}
      {userRole !== "tenant" && (
        <>
          {/* Stats Cards */}
          {userRole === "maintenance_staff" && (
            <div className="row g-4 mb-4">
              <div className="col-12 col-md-6 col-xl-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <p className="text-muted mb-2">Total Assigned</p>
                        <h3 className="fw-bold mb-0">
                          {stats.assigned_issues || 0}
                        </h3>
                      </div>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: "48px",
                          height: "48px",
                          background:
                            "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                        }}
                      >
                        <i className="bi bi-list-check text-white fs-5"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-xl-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <p className="text-muted mb-2">Open Issues</p>
                        <h3 className="fw-bold mb-0">
                          {stats.open_issues || 0}
                        </h3>
                      </div>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: "48px",
                          height: "48px",
                          background:
                            "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                        }}
                      >
                        <i className="bi bi-exclamation-circle text-white fs-5"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-xl-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <p className="text-muted mb-2">In Progress</p>
                        <h3 className="fw-bold mb-0">
                          {stats.in_progress_issues || 0}
                        </h3>
                      </div>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: "48px",
                          height: "48px",
                          background:
                            "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                        }}
                      >
                        <i className="bi bi-hourglass-split text-white fs-5"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-xl-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <p className="text-muted mb-2">Resolved</p>
                        <h3 className="fw-bold mb-0">
                          {stats.resolved_issues || 0}
                        </h3>
                      </div>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: "48px",
                          height: "48px",
                          background:
                            "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        }}
                      >
                        <i className="bi bi-check-circle text-white fs-5"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(userRole === "super_admin" ||
            userRole === "admin" ||
            userRole === "landlord") && (
            <div className="admin-dashboard">
              {/* Row 1: 4 Cards */}
              <div className="row g-4 mb-4">
                <div className="col-12 col-md-6 col-xl-3">
                  <Link
                    to="/properties"
                    className="card border-0 shadow-sm h-100 text-decoration-none text-dark"
                  >
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <p className="text-muted mb-2">Total Properties</p>
                          <h3 className="fw-bold mb-0">
                            {stats.total_properties || 0}
                          </h3>
                        </div>
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width: "48px",
                            height: "48px",
                            background:
                              "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                          }}
                        >
                          <i className="bi bi-building text-white fs-5"></i>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="col-12 col-md-6 col-xl-3">
                  <Link
                    to="/units"
                    className="card border-0 shadow-sm h-100 text-decoration-none text-dark"
                  >
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <p className="text-muted mb-2">Total Units</p>
                          <h3 className="fw-bold mb-0">
                            {stats.total_units || 0}
                          </h3>
                          <small className="text-danger">
                            {stats.occupancy_rate < 100 ? (
                              <>
                                <i className="bi bi-graph-down me-1"></i>
                                {stats.occupancy_rate?.toFixed(1)}% occupied
                              </>
                            ) : (
                              <span className="text-success">
                                <i className="bi bi-check-circle me-1"></i>
                                100% occupied
                              </span>
                            )}
                          </small>
                        </div>
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width: "48px",
                            height: "48px",
                            background:
                              "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                          }}
                        >
                          <i className="bi bi-house text-white fs-5"></i>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="col-12 col-md-6 col-xl-3">
                  <Link
                    to="/tenants"
                    className="card border-0 shadow-sm h-100 text-decoration-none text-dark"
                  >
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <p className="text-muted mb-2">Active Tenants</p>
                          <h3 className="fw-bold mb-0">
                            {stats.active_tenants || 0}
                          </h3>
                        </div>
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width: "48px",
                            height: "48px",
                            background:
                              "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                          }}
                        >
                          <i className="bi bi-people text-white fs-5"></i>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="col-12 col-md-6 col-xl-3">
                  <Link
                    to="/leases"
                    className="card border-0 shadow-sm h-100 text-decoration-none text-dark"
                  >
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <p className="text-muted mb-2">Active Leases</p>
                          <h3 className="fw-bold mb-0">
                            {stats.active_leases || 0}
                          </h3>
                        </div>
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width: "48px",
                            height: "48px",
                            background:
                              "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                          }}
                        >
                          <i className="bi bi-file-earmark-text text-white fs-5"></i>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Row 2: 3 Cards */}
              <div className="row g-4 mb-4">
                <div className="col-12 col-md-4">
                  <div
                    className="metric-card h-100 position-relative pb-2"
                    style={{ cursor: "pointer" }}
                    onClick={() => setStatModal({ name: "Total Revenue", total: stats.total_revenue || 0, icon: "bi-currency-dollar", color: "success", gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)", actionFn: () => navigate("/payments") })}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-truncate me-3">
                        <p className="metric-label text-truncate mb-1">Total Revenue</p>
                        <h3 className="metric-value mb-1" title={`₦${(stats.total_revenue || 0).toLocaleString()}`}>
                          ₦{formatCompact(stats.total_revenue)}
                        </h3>
                        <small className="text-success fw-medium">
                          <i className="bi bi-graph-up me-1"></i>
                          100.0% collected
                        </small>
                      </div>
                      <div className="metric-icon flex-shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white" }}>
                        <i className="bi bi-currency-dollar"></i>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div
                    className="metric-card h-100 position-relative pb-2"
                    style={{ cursor: "pointer" }}
                    onClick={() => setStatModal({ name: "Outstanding Rent", total: stats.outstanding_payments || 0, icon: "bi-credit-card", color: "danger", gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", actionFn: () => navigate("/payments?status=Pending") })}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-truncate me-3">
                        <p className="metric-label text-truncate mb-1">Outstanding Rent</p>
                        <h3 className="metric-value text-danger mb-0" title={`₦${(stats.outstanding_payments || 0).toLocaleString()}`}>
                          ₦{formatCompact(stats.outstanding_payments)}
                        </h3>
                      </div>
                      <div className="metric-icon flex-shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "white" }}>
                        <i className="bi bi-credit-card"></i>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div
                    className="metric-card h-100 position-relative pb-2"
                    style={{ cursor: "pointer" }}
                    onClick={() => setStatModal({ name: "Pending Maintenance", total: stats.pending_issues || 0, icon: "bi-wrench", color: "warning", gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", isCurrency: false, actionFn: () => navigate("/maintenance") })}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-truncate me-3">
                        <p className="metric-label text-truncate mb-1">Pending Maintenance</p>
                        <h3 className="metric-value mb-0" title={(stats.pending_issues || 0).toLocaleString()}>
                          {formatCompact(stats.pending_issues || 0)}
                        </h3>
                      </div>
                      <div className="metric-icon flex-shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "white" }}>
                        <i className="bi bi-wrench"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Charts */}
              <div className="row g-4 mb-4">
                <div className="col-12 col-lg-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body p-4">
                      <h5 className="card-title fw-bold mb-4">
                        Monthly Revenue
                      </h5>
                      <div style={{ height: "300px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={[
                              { name: "Jan", revenue: 4000 },
                              { name: "Feb", revenue: 3000 },
                              { name: "Mar", revenue: 2000 },
                              { name: "Apr", revenue: 2780 },
                              { name: "May", revenue: 1890 },
                              { name: "Jun", revenue: 2390 },
                              { name: "Jul", revenue: 3490 },
                            ]}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 12 }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 12 }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => `₦${value}`}
                            />
                            <Tooltip
                              formatter={(value) => `₦${value}`}
                              contentStyle={{
                                borderRadius: "8px",
                                border: "none",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="revenue"
                              stroke="#8884d8"
                              fill="#8884d8"
                              fillOpacity={0.3}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-lg-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body p-4">
                      <h5 className="card-title fw-bold mb-4">
                        Property Occupancy
                      </h5>
                      <div style={{ height: "300px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: "Property A", occupancy: 85 },
                              { name: "Property B", occupancy: 92 },
                              { name: "Property C", occupancy: 78 },
                            ]}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" hide />
                            <YAxis
                              dataKey="name"
                              type="category"
                              width={100}
                              tick={{ fontSize: 12 }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip
                              cursor={{ fill: "transparent" }}
                              contentStyle={{
                                borderRadius: "8px",
                                border: "none",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                              }}
                            />
                            <Bar
                              dataKey="occupancy"
                              fill="#3b82f6"
                              radius={[0, 4, 4, 0]}
                              barSize={32}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Maintenance & Performance */}
              <div className="row g-4 mb-4">
                <div className="col-12 col-lg-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body p-4">
                      <h5 className="card-title fw-bold mb-4">
                        Maintenance Status
                      </h5>
                      <div
                        style={{
                          height: "300px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: "Open", value: stats.open_issues || 1 },
                                {
                                  name: "In Progress",
                                  value: stats.in_progress_issues || 1,
                                },
                                {
                                  name: "Resolved",
                                  value: stats.resolved_issues || 1,
                                },
                              ]}
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {["#ef4444", "#f59e0b", "#10b981"].map(
                                (color, index) => (
                                  <Cell key={`cell-${index}`} fill={color} />
                                ),
                              )}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="d-flex justify-content-center gap-4 mt-3">
                        <div className="d-flex align-items-center">
                          <span
                            className="d-inline-block rounded-circle me-2"
                            style={{
                              width: "10px",
                              height: "10px",
                              backgroundColor: "#ef4444",
                            }}
                          ></span>
                          <small>Open</small>
                        </div>
                        <div className="d-flex align-items-center">
                          <span
                            className="d-inline-block rounded-circle me-2"
                            style={{
                              width: "10px",
                              height: "10px",
                              backgroundColor: "#f59e0b",
                            }}
                          ></span>
                          <small>In Progress</small>
                        </div>
                        <div className="d-flex align-items-center">
                          <span
                            className="d-inline-block rounded-circle me-2"
                            style={{
                              width: "10px",
                              height: "10px",
                              backgroundColor: "#10b981",
                            }}
                          ></span>
                          <small>Resolved</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-lg-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body p-4">
                      <h5 className="card-title fw-bold mb-4">
                        Performance Overview
                      </h5>
                      <div className="mb-4">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted small">
                            Occupancy Rate
                          </span>
                          <span className="small fw-bold">
                            {stats.occupancy_rate?.toFixed(1) || 0}%
                          </span>
                        </div>
                        <div className="progress" style={{ height: "6px" }}>
                          <div
                            className="progress-bar bg-primary"
                            role="progressbar"
                            style={{
                              width: `${stats.occupancy_rate || 0}%`,
                            }}
                            aria-valuenow={stats.occupancy_rate || 0}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted small">
                            Rent Collection Rate
                          </span>
                          <span className="small fw-bold">100.0%</span>
                        </div>
                        <div className="progress" style={{ height: "6px" }}>
                          <div
                            className="progress-bar bg-success"
                            role="progressbar"
                            style={{ width: "100%" }}
                            aria-valuenow="100"
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </div>
                      <div className="row g-3 mt-4">
                        <div className="col-6">
                          <div className="p-3 bg-light rounded text-center">
                            <h3 className="fw-bold mb-0">
                              {stats.occupied_units || 0}
                            </h3>
                            <small className="text-muted">Occupied Units</small>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="p-3 bg-light rounded text-center">
                            <h3 className="fw-bold mb-0">
                              {stats.vacant_units || 0}
                            </h3>
                            <small className="text-muted">Vacant Units</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {userRole === "accounting_staff" && (
            <div className="accounting-dashboard">
              {/* Row 1: 4 Cards */}
              <div className="row g-4 mb-4">
                <div className="col-12 col-md-6 col-xl-3">
                  <div className="metric-card h-100 position-relative pb-2" style={{ cursor: "pointer" }} onClick={() => setStatModal({ name: "Total Revenue", total: stats.total_revenue || 0, icon: "bi-cash-stack", color: "success", gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)", actionFn: () => navigate("/payments") })}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-truncate me-3">
                        <p className="metric-label text-truncate mb-1">Total Revenue</p>
                        <h3 className="metric-value text-success mb-0" title={`₦${(stats.total_revenue || 0).toLocaleString()}`}>
                          ₦{formatCompact(stats.total_revenue)}
                        </h3>
                      </div>
                      <div className="metric-icon flex-shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white" }}>
                        <i className="bi bi-cash-stack"></i>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6 col-xl-3">
                  <div className="metric-card h-100 position-relative pb-2" style={{ cursor: "pointer" }} onClick={() => setStatModal({ name: "Outstanding Debts", total: stats.outstanding_debts || 0, icon: "bi-exclamation-triangle", color: "danger", gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", actionFn: () => navigate("/payments") })}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-truncate me-3">
                        <p className="metric-label text-truncate mb-1">Outstanding Debts</p>
                        <h3 className="metric-value text-danger mb-0" title={`₦${(stats.outstanding_debts || 0).toLocaleString()}`}>
                          ₦{formatCompact(stats.outstanding_debts)}
                        </h3>
                      </div>
                      <div className="metric-icon flex-shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "white" }}>
                        <i className="bi bi-exclamation-triangle"></i>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6 col-xl-3">
                  <div className="metric-card h-100 position-relative pb-2" style={{ cursor: "pointer" }} onClick={() => setStatModal({ name: "Total Expenses", total: stats.total_expenses || 0, icon: "bi-graph-down-arrow", color: "warning", gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", actionFn: () => navigate("/expenses") })}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-truncate me-3">
                        <p className="metric-label text-truncate mb-1">Total Expenses</p>
                        <h3 className="metric-value text-warning mb-0" title={`₦${(stats.total_expenses || 0).toLocaleString()}`}>
                          ₦{formatCompact(stats.total_expenses)}
                        </h3>
                      </div>
                      <div className="metric-icon flex-shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "white" }}>
                        <i className="bi bi-graph-down-arrow"></i>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6 col-xl-3">
                  <div className="metric-card h-100 position-relative pb-2" style={{ cursor: "pointer" }} onClick={() => setStatModal({ name: "Tenant Wallet Reserves", total: stats.tenant_wallet_reserves || 0, icon: "bi-wallet2", color: "primary", gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", actionFn: () => navigate("/tenants") })}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="text-truncate me-3">
                        <p className="metric-label text-truncate mb-1">Tenant Wallet Reserves</p>
                        <h3 className="metric-value text-primary mb-0" title={`₦${(stats.tenant_wallet_reserves || 0).toLocaleString()}`}>
                          ₦{formatCompact(stats.tenant_wallet_reserves)}
                        </h3>
                      </div>
                      <div className="metric-icon flex-shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "white" }}>
                        <i className="bi bi-wallet2"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Tables & Charts */}
              <div className="row g-4 mb-4">
                <div className="col-12 col-lg-8">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body p-4">
                      <h5 className="card-title fw-bold mb-4">Real-time Revenue (This Year)</h5>
                      <div style={{ height: "300px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={stats.monthly_revenue || []}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 12 }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 12 }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => `₦${value}`}
                            />
                            <Tooltip
                              formatter={(value) => `₦${value}`}
                              contentStyle={{
                                borderRadius: "8px",
                                border: "none",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="revenue"
                              stroke="#10b981"
                              fill="#10b981"
                              fillOpacity={0.3}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-lg-4">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body p-4">
                      <h5 className="card-title fw-bold mb-4">Outstanding Invoices</h5>
                      {stats.pending_payments && stats.pending_payments.length > 0 ? (
                        <div className="d-flex flex-column gap-3">
                          {stats.pending_payments.map((payment) => (
                            <div key={payment.id} className="d-flex justify-content-between align-items-center border-bottom pb-2">
                              <div>
                                <p className="mb-0 fw-semibold">{payment.tenant?.name || payment.tenant_name || payment.user?.name || (payment.tenant_id ? `Tenant #${payment.tenant_id}` : 'Unknown Tenant')}</p>
                                <small className="text-muted">{payment.property?.name} • {payment.type}</small>
                              </div>
                              <span className="fw-bold text-danger">₦{parseFloat(payment.amount).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted mb-0">No outstanding invoices at the moment.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Recent Transactions */}
              <div className="row g-4 mb-4">
                <div className="col-12">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body p-4">
                      <h5 className="card-title fw-bold mb-4">Recent Transactions</h5>
                      {stats.recent_payments && stats.recent_payments.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-hover mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Date</th>
                                <th>Tenant</th>
                                <th>Property</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stats.recent_payments.map((payment) => (
                                <tr key={payment.id}>
                                  <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                                  <td>{payment.tenant?.name || payment.tenant_name || payment.user?.name || (payment.tenant_id ? `Tenant #${payment.tenant_id}` : 'Unknown Tenant')}</td>
                                  <td>{payment.property?.name}</td>
                                  <td>{payment.type}</td>
                                  <td className="fw-semibold">₦{parseFloat(payment.amount).toLocaleString()}</td>
                                  <td>
                                    <span className="badge bg-success">Paid</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-muted mb-0">No recent transactions found.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Quick Actions</h5>
              <div className="row g-3">
                {userRole === "maintenance_staff" && (
                  <div className="col-6 col-md-3">
                    <Link
                      to="/maintenance"
                      className="btn btn-outline-primary w-100"
                    >
                      <i className="bi bi-tools me-2"></i>
                      View Issues
                    </Link>
                  </div>
                )}

                {(userRole === "super_admin" || userRole === "admin") && (
                  <>
                    <div className="col-6 col-md-3">
                      <Link
                        to="/properties/new"
                        className="btn btn-outline-primary w-100"
                      >
                        <i className="bi bi-building-add me-2"></i>
                        Add Property
                      </Link>
                    </div>
                    <div className="col-6 col-md-3">
                      <Link
                        to="/landlords/new"
                        className="btn btn-outline-success w-100"
                      >
                        <i className="bi bi-person-plus me-2"></i>
                        Add Landlord
                      </Link>
                    </div>
                    <div className="col-6 col-md-3">
                      <Link
                        to="/users"
                        className="btn btn-outline-secondary w-100"
                      >
                        <i className="bi bi-person-gear me-2"></i>
                        Manage Users
                      </Link>
                    </div>
                  </>
                )}

                {(userRole === "super_admin" ||
                  userRole === "admin" ||
                  userRole === "landlord") && (
                  <>
                    <div className="col-6 col-md-3">
                      <Link
                        to="/tenants"
                        className="btn btn-outline-info w-100"
                      >
                        <i className="bi bi-people me-2"></i>
                        View Tenants
                      </Link>
                    </div>
                    <div className="col-6 col-md-3">
                      <Link
                        to="/maintenance"
                        className="btn btn-outline-warning w-100"
                      >
                        <i className="bi bi-wrench me-2"></i>
                        Maintenance
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
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
                  className={`payment-stat-icon mx-auto mb-3 shadow-sm`}
                  style={{ width: '60px', height: '60px', fontSize: '1.5rem', background: statModal.gradient }}
                >
                  <i className={`bi ${statModal.icon} text-white`}></i>
                </div>
                <h6 className="text-uppercase text-muted fw-bold mb-2">{statModal.name}</h6>
                <h3 className="fw-bold mb-4 text-dark">
                  {statModal.isCurrency !== false ? "₦" : ""}
                  {statModal.isCurrency !== false 
                    ? Number(statModal.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : Number(statModal.total || 0).toLocaleString()
                  }
                </h3>
                
                {statModal.actionFn && (
                  <button 
                    className={`btn btn-${statModal.color} w-100 py-2 text-white`}
                    style={{ background: statModal.gradient }}
                    onClick={() => {
                      statModal.actionFn();
                      setStatModal(null);
                    }}
                  >
                     View Records
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
