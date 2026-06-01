import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const context = useOutletContext();
  const refreshNotifications = context ? context.refreshNotifications : null;

  useEffect(() => {
    fetchNotifications();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    // Optimistic update - update local state immediately
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

    try {
      await api.put(`/notifications/${id}/read`);
      // Update the sidebar badge after ensuring backend is updated
      if (refreshNotifications) refreshNotifications();
    } catch (error) {
      console.error("Failed to mark as read:", error);
      // Revert if failed (optional, but good practice)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n)),
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      if (refreshNotifications) refreshNotifications(); // Update the sidebar badge instantly
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case "payment":
      case "payment_status": // Handle payment status updates
        return "bi-credit-card text-success";
      case "wallet_funded":
        return "bi-wallet2 text-primary";
      case "maintenance":
        return "bi-exclamation-triangle text-warning";
      case "lease":
        return "bi-file-earmark-text text-primary";
      default:
        return "bi-bell text-info";
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
          <h1 className="h2 fw-bold">
            <i className="bi bi-bell me-2"></i>
            Notifications
          </h1>
          <p className="text-muted mb-0">
            Stay updated with important alerts and messages
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn btn-outline-primary">
            <i className="bi bi-check-all me-2"></i>
            Mark All as Read
          </button>
        )}
      </div>

      <div className="row g-4">
        {/* Notifications List */}
        <div className="col-lg-8">
          <div className="card-light p-0">
            {notifications.length === 0 ? (
              <div className="p-5 text-center text-muted">
                <i className="bi bi-bell-slash fs-1 mb-3 d-block"></i>
                <p>No notifications found</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-bottom ${!notification.read ? "bg-light-blue" : ""}`}
                  style={{
                    backgroundColor: !notification.read
                      ? "#f0f8ff"
                      : "transparent",
                    cursor: !notification.read ? "pointer" : "default",
                  }}
                  onMouseEnter={() =>
                    !notification.read && markAsRead(notification.id)
                  }
                  onClick={() => {
                    if (notification.type === 'message' && notification.reference_id) {
                        navigate(`/messages/${notification.reference_id}`);
                    }
                  }}
                >
                  <div className="d-flex align-items-start gap-3">
                    <div className="flex-shrink-0">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                          width: "48px",
                          height: "48px",
                          backgroundColor: "#f8f9fa",
                        }}
                      >
                        <i
                          className={`${getNotificationIcon(notification.type)} fs-5`}
                        ></i>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <h6 className="fw-bold mb-0">{notification.title}</h6>
                        {!notification.read && (
                          <span className="badge bg-primary">New</span>
                        )}
                      </div>
                      <p className="text-muted mb-1">{notification.message}</p>
                      <small className="text-muted">
                        <i className="bi bi-clock me-1"></i>
                        {new Date(notification.created_at).toLocaleString()}
                      </small>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Settings Sidebar - (Simplified for now as backend doesn't support settings yet) */}
        <div className="col-lg-4">
          <div className="card-light p-4 mb-4">
            <h5 className="fw-bold mb-3">
              <i className="bi bi-graph-up me-2"></i>
              Quick Stats
            </h5>
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted">Unread</span>
                <span className="badge bg-primary">{unreadCount}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Total</span>
                <span className="badge bg-secondary">
                  {notifications.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
