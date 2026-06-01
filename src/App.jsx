import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import "./App.css";

// Lazy load all page components for better performance
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Properties = lazy(() => import("./pages/Properties"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const PropertyForm = lazy(() => import("./pages/PropertyForm"));
const Tenants = lazy(() => import("./pages/Tenants"));
const TenantDetail = lazy(() => import("./pages/TenantDetail"));
const Units = lazy(() => import("./pages/Units"));
const Leases = lazy(() => import("./pages/Leases"));

const Payments = lazy(() => import("./pages/Payments"));
const PaymentForm = lazy(() => import("./pages/PaymentForm"));
const AuditTrail = lazy(() => import("./pages/AuditTrail"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const MaintenanceForm = lazy(() => import("./pages/MaintenanceForm"));
const MaintenanceDetail = lazy(() => import("./pages/MaintenanceDetail"));
const Notifications = lazy(() => import("./pages/Notifications"));
const TenantPortal = lazy(() => import("./pages/TenantPortal"));
const Users = lazy(() => import("./pages/Users"));
const UserForm = lazy(() => import("./pages/UserForm"));
const Landlords = lazy(() => import("./pages/Landlords"));
const LandlordForm = lazy(() => import("./pages/LandlordForm"));
const Messages = lazy(() => import("./pages/Messages"));
const MessageForm = lazy(() => import("./pages/MessageForm"));
const MessageDetail = lazy(() => import("./pages/MessageDetail"));
const Layout = lazy(() => import("./components/Layout"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="d-flex justify-content-center align-items-center min-vh-100">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { RefreshProvider } from "./contexts/RefreshContext";

function App() {
  return (
    <RefreshProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/users/new" element={<UserForm />} />
              <Route path="/users/:id/edit" element={<UserForm />} />
              <Route path="/landlords" element={<Landlords />} />
              <Route path="/landlords/new" element={<LandlordForm />} />
              <Route path="/landlords/:id/edit" element={<LandlordForm />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/properties/:id" element={<PropertyDetail />} />
              <Route path="/properties/new" element={<PropertyForm />} />
              <Route path="/tenants" element={<Tenants />} />
              <Route path="/tenants/:id" element={<TenantDetail />} />
              <Route path="/units" element={<Units />} />
              <Route path="/leases" element={<Leases />} />

              <Route path="/payments" element={<Payments />} />
              <Route path="/payments/new" element={<PaymentForm />} />
              <Route path="/audit-trail" element={<AuditTrail />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/maintenance/new" element={<MaintenanceForm />} />
              <Route path="/maintenance/:id" element={<MaintenanceDetail />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/new" element={<MessageForm />} />
              <Route path="/messages/:id" element={<MessageDetail />} />
              <Route path="/portal" element={<TenantPortal />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </RefreshProvider>
  );
}

export default App;
