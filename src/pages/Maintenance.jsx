import { useState, useEffect, useCallback } from "react";
import useAutoRefresh from "../hooks/useAutoRefresh";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useRefresh } from "../contexts/RefreshContext";

export default function Maintenance() {
  const [searchParams] = useSearchParams();
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all",
  );
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("reported_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showAnalytics, setShowAnalytics] = useState(true);
  const { triggerRefresh } = useRefresh();

  useEffect(() => {
    applyFilters();
  }, [issues, searchTerm, statusFilter, priorityFilter, sortBy, sortOrder]);

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [issuesRes, statsRes] = await Promise.all([
        api.get("/issues"),
        api.get("/issues/stats"),
      ]);
      setIssues(issuesRes.data);
      setStats(statsRes.data);
      if (isInitial) setLoading(false);
    } catch (error) {
      console.error("Failed to fetch maintenance data:", error);
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);

    if (sessionStorage.getItem("token")) {
      api.put("/notifications/read-type", { 
        types: ["maintenance_update", "budget_review"] 
      }).then(() => {
        triggerRefresh();
      }).catch(err => console.error("Failed to mark maintenance notifications as read:", err));
    }
  }, [fetchData, triggerRefresh]);

  useAutoRefresh(() => fetchData(false));

  const applyFilters = () => {
    let filtered = [...issues];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (issue) =>
          issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          issue.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          issue.property?.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((issue) => issue.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((issue) => issue.priority === priorityFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "reported_at") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredIssues(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setSortBy("reported_at");
    setSortOrder("desc");
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-danger";
      case "High":
        return "bg-warning text-dark";
      case "Medium":
        return "bg-info";
      case "Low":
        return "bg-secondary";
      default:
        return "bg-secondary";
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Open":
        return "bg-primary";
      case "In Progress":
        return "bg-warning text-dark";
      case "Resolved":
        return "bg-success";
      case "Closed":
        return "bg-secondary";
      default:
        return "bg-secondary";
    }
  };

  const getPriorityDot = (priority) => {
    const colors = {
      Critical: "#ef4444",
      High: "#f59e0b",
      Medium: "#3b82f6",
      Low: "#6b7280",
    };
    return (
      <span
        className="d-inline-block rounded-circle me-2"
        style={{
          width: "8px",
          height: "8px",
          backgroundColor: colors[priority] || colors.Low,
        }}
      ></span>
    );
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

  const hasActiveFilters =
    searchTerm || statusFilter !== "all" || priorityFilter !== "all";

  return (
    <div className="min-vh-100 p-4 bg-light">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold">
            <i className="bi bi-tools me-2"></i>
            Maintenance Management
          </h1>
          <p className="text-muted mb-0">
            Track and manage all maintenance requests
          </p>
        </div>
        <Link to="/maintenance/new" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2"></i>
          Report Issue
        </Link>
      </div>

      {/* Compact Stats Banner */}
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div
              className="card border-0 shadow-sm cursor-pointer"
              onClick={() => setStatusFilter("all")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: "40px",
                      height: "40px",
                      background:
                        "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    }}
                  >
                    <i className="bi bi-list-check text-white"></i>
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Total</p>
                    <h4 className="fw-bold mb-0">{stats.total || 0}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div
              className="card border-0 shadow-sm cursor-pointer"
              onClick={() => setStatusFilter("Open")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: "40px",
                      height: "40px",
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    }}
                  >
                    <i className="bi bi-exclamation-circle text-white"></i>
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Open</p>
                    <h4 className="fw-bold mb-0">{stats.open || 0}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div
              className="card border-0 shadow-sm cursor-pointer"
              onClick={() => setStatusFilter("In Progress")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: "40px",
                      height: "40px",
                      background:
                        "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    }}
                  >
                    <i className="bi bi-hourglass-split text-white"></i>
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">In Progress</p>
                    <h4 className="fw-bold mb-0">{stats.in_progress || 0}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div
              className="card border-0 shadow-sm cursor-pointer"
              onClick={() => setStatusFilter("Resolved")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: "40px",
                      height: "40px",
                      background:
                        "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    }}
                  >
                    <i className="bi bi-check-circle text-white"></i>
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Resolved</p>
                    <h4 className="fw-bold mb-0">{stats.resolved || 0}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search Section */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="row g-3">
            {/* Search Bar */}
            <div className="col-12 col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="col-6 col-md-2">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="col-6 col-md-2">
              <select
                className="form-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priority</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="col-6 col-md-2">
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="reported_at">Date Reported</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
              </select>
            </div>

            {/* Actions */}
            <div className="col-6 col-md-2">
              <div className="d-flex gap-2">
                {hasActiveFilters && (
                  <button
                    className="btn btn-outline-secondary flex-grow-1"
                    onClick={clearFilters}
                  >
                    <i className="bi bi-x-lg me-1"></i>
                    Clear
                  </button>
                )}
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  title="Toggle Analytics"
                >
                  <i
                    className={`bi bi-bar-chart${showAnalytics ? "-fill" : ""}`}
                  ></i>
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-3">
              <small className="text-muted me-2">Active Filters:</small>
              {searchTerm && (
                <span className="badge bg-primary me-2">
                  Search: "{searchTerm}"
                </span>
              )}
              {statusFilter !== "all" && (
                <span className="badge bg-info me-2">
                  Status: {statusFilter}
                </span>
              )}
              {priorityFilter !== "all" && (
                <span className="badge bg-warning text-dark">
                  Priority: {priorityFilter}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && stats && (
        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h6 className="fw-bold mb-3">Priority Distribution</h6>
                <div className="d-flex flex-column gap-2">
                  {[
                    { name: "Critical", count: 0, color: "#ef4444" },
                    { name: "High", count: 0, color: "#f59e0b" },
                    { name: "Medium", count: 0, color: "#3b82f6" },
                    { name: "Low", count: 0, color: "#6b7280" },
                  ].map((priority) => {
                    const count = issues.filter(
                      (i) => i.priority === priority.name,
                    ).length;
                    const percentage =
                      stats.total > 0 ? (count / stats.total) * 100 : 0;
                    return (
                      <div key={priority.name}>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="small">
                            <span
                              className="d-inline-block rounded-circle me-2"
                              style={{
                                width: "8px",
                                height: "8px",
                                backgroundColor: priority.color,
                              }}
                            ></span>
                            {priority.name}
                          </span>
                          <span className="small fw-semibold">{count}</span>
                        </div>
                        <div className="progress" style={{ height: "6px" }}>
                          <div
                            className="progress-bar"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: priority.color,
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h6 className="fw-bold mb-3">Status Breakdown</h6>
                <div className="d-flex flex-column gap-2">
                  {[
                    { name: "Open", key: "open", color: "#3b82f6" },
                    {
                      name: "In Progress",
                      key: "in_progress",
                      color: "#f59e0b",
                    },
                    { name: "Resolved", key: "resolved", color: "#10b981" },
                  ].map((status) => {
                    const count = stats[status.key] || 0;
                    const percentage =
                      stats.total > 0 ? (count / stats.total) * 100 : 0;
                    return (
                      <div key={status.name}>
                        <div className="d-flex justify-content-between mb-1">
                          <span className="small">
                            <span
                              className="d-inline-block rounded-circle me-2"
                              style={{
                                width: "8px",
                                height: "8px",
                                backgroundColor: status.color,
                              }}
                            ></span>
                            {status.name}
                          </span>
                          <span className="small fw-semibold">{count}</span>
                        </div>
                        <div className="progress" style={{ height: "6px" }}>
                          <div
                            className="progress-bar"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: status.color,
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issues List */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {filteredIssues.length === 0 ? (
            <div className="p-5 text-center text-muted">
              <i className="bi bi-inbox fs-1 mb-3 d-block"></i>
              {hasActiveFilters ? (
                <>
                  <p>No issues match your filters</p>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                </>
              ) : (
                <p>No maintenance issues found</p>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSort("priority")}
                    >
                      Priority
                      {sortBy === "priority" && (
                        <i
                          className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"} ms-1`}
                        ></i>
                      )}
                    </th>
                    <th>Title</th>
                    <th>Property / Unit</th>
                    <th>Reporter</th>
                    <th
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSort("status")}
                    >
                      Status
                      {sortBy === "status" && (
                        <i
                          className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"} ms-1`}
                        ></i>
                      )}
                    </th>
                    <th
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSort("reported_at")}
                    >
                      Reported
                      {sortBy === "reported_at" && (
                        <i
                          className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"} ms-1`}
                        ></i>
                      )}
                    </th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map((issue) => (
                    <tr key={issue.id}>
                      <td>
                        {getPriorityDot(issue.priority)}
                        <span
                          className={`badge ${getPriorityBadgeClass(issue.priority)}`}
                        >
                          {issue.priority}
                        </span>
                      </td>
                      <td className="fw-semibold">{issue.title}</td>
                      <td>
                        <div>
                          <div className="small fw-semibold">
                            {issue.property?.name || "N/A"}
                          </div>
                          {issue.unit && (
                            <div className="small text-muted">
                              Unit {issue.unit.unit_number}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{issue.reporter?.name || "N/A"}</td>
                      <td>
                        <span
                          className={`badge ${getStatusBadgeClass(issue.status)}`}
                        >
                          {issue.status}
                        </span>
                      </td>
                      <td>
                        <small>
                          {new Date(issue.reported_at).toLocaleDateString()}
                        </small>
                      </td>
                      <td>
                        <Link
                          to={`/maintenance/${issue.id}`}
                          className="btn btn-sm btn-primary"
                        >
                          <i className="bi bi-eye me-1"></i>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Results Summary */}
      {filteredIssues.length > 0 && (
        <div className="mt-3 text-muted small text-center">
          Showing {filteredIssues.length} of {issues.length} issues
        </div>
      )}
    </div>
  );
}
