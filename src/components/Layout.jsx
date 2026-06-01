import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

import { useRefresh } from "../contexts/RefreshContext";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [maintenanceBadgeCount, setMaintenanceBadgeCount] = useState(0);
  const [paymentBadgeCount, setPaymentBadgeCount] = useState(0);
  const userRole = sessionStorage.getItem("role");
  const { triggerRefresh } = useRefresh();

  // Debounce function removed as global click capture causes severe performance issues

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications/unread-count");
      setUnreadCount(response.data.count);
      setMaintenanceBadgeCount(response.data.maintenance_count || 0);
      setPaymentBadgeCount(response.data.payment_count || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.post("/auth/me");
        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
    fetchNotifications();

    // Auto-refresh notification count every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: "bi-speedometer2",
      roles: ["all"],
    },
    {
      path: "/notifications",
      label: "Notifications",
      icon: "bi-bell",
      roles: [
        "super_admin",
        "admin",
        "tenant",
        "maintenance_staff",
        "landlord",
      ],
      badge: unreadCount,
    },
    {
      path: "/users",
      label: "Users",
      icon: "bi-people",
      roles: ["super_admin", "admin"],
    },
    {
      path: "/properties",
      label: "Properties",
      icon: "bi-building",
      roles: ["super_admin", "admin", "property_officer", "landlord", "accounting_staff"],
    },
    {
      path: "/tenants",
      label: "Tenants",
      icon: "bi-person-badge",
      roles: ["super_admin", "admin", "property_officer", "accounting_staff"],
    },
    {
      path: "/landlords",
      label: "Landlords",
      icon: "bi-person-circle",
      roles: ["super_admin", "admin"],
    },
    {
      path: "/leases",
      label: "Leases",
      icon: "bi-file-earmark-text",
      roles: ["super_admin", "admin", "property_officer"],
    },
    {
      path: "/payments",
      label: "Payments",
      icon: "bi-credit-card",
      roles: ["super_admin", "admin", "accounting_staff", "tenant"],
      badge: paymentBadgeCount,
    },

    {
      path: "/expenses",
      label: "Expenses",
      icon: "bi-cash-stack",
      roles: ["super_admin", "admin", "accounting_staff"],
    },
    {
      path: "/maintenance",
      label: "Maintenance",
      icon: "bi-exclamation-circle",
      roles: ["super_admin", "admin", "maintenance_staff", "accounting_staff"],
      badge: maintenanceBadgeCount,
    },
    {
      path: "/messages",
      label: "Messages",
      icon: "bi-envelope",
      roles: ["all"],
    },
    {
      path: "/documents",
      label: "Documents",
      icon: "bi-folder",
      roles: ["super_admin", "admin"],
    },
  ];

  const shouldShowNav = (navRoles) => {
    if (navRoles.includes("all")) return true;
    return navRoles.includes(userRole);
  };

  return (
    <div
      className="d-flex min-vh-100 bg-light"
    >
      {/* Sidebar */}
      <aside
        className="sidebar-light d-flex flex-column position-fixed top-0 start-0 h-100 border-end"
        style={{ width: "250px", transition: "all 0.3s ease", zIndex: 1040, overflowY: "auto" }}
      >
        {/* Logo */}
        <div className="p-4 border-bottom">
          <div className="d-flex align-items-center">
            <div className="bg-primary rounded p-2 me-3">
              <i className="bi bi-building text-white fs-5"></i>
            </div>
            <div>
              <h1 className="h5 fw-bold text-dark mb-0">UPMS</h1>
              <p className="text-muted small mb-0">Property Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow-1 py-3">
          {navItems.map(
            (item) =>
              shouldShowNav(item.roles) && (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link-light d-flex align-items-center px-4 py-3 text-decoration-none ${
                    isActive(item.path) ? "active" : ""
                  }`}
                >
                  <i className={`bi ${item.icon} me-2`}></i>
                  <span className="nav-label text-truncate pb-1">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="badge bg-danger ms-auto rounded-pill">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ),
          )}

        </nav>

        {/* User Profile */}
        <div className="p-3 border-top mt-auto">
          <div className="d-flex align-items-center mb-2">
            <div
              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{ width: "40px", height: "40px" }}
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-grow-1">
              <div className="text-dark small fw-semibold">
                {user?.name || "Loading..."}
              </div>
              <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                {userRole === "super_admin"
                  ? "Super Admin"
                  : userRole
                      ?.replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-outline-danger btn-sm w-100 mt-2"
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className="flex-grow-1 bg-light main-content-wrapper"
        style={{ minHeight: "100vh", marginLeft: "250px" }}
      >
        <Outlet context={{ refreshNotifications: fetchNotifications }} />
      </main>
    </div>
  );
}
