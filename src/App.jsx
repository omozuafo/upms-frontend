import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import "./App.css";

import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import PropertyForm from "./pages/PropertyForm";
import Tenants from "./pages/Tenants";
import TenantDetail from "./pages/TenantDetail";
import Units from "./pages/Units";
import Leases from "./pages/Leases";
import Payments from "./pages/Payments";
import PaymentForm from "./pages/PaymentForm";
import AuditTrail from "./pages/AuditTrail";
import Maintenance from "./pages/Maintenance";
import MaintenanceForm from "./pages/MaintenanceForm";
import MaintenanceDetail from "./pages/MaintenanceDetail";
import Notifications from "./pages/Notifications";
import TenantPortal from "./pages/TenantPortal";
import Users from "./pages/Users";
import UserForm from "./pages/UserForm";
import Landlords from "./pages/Landlords";
import LandlordForm from "./pages/LandlordForm";
import Messages from "./pages/Messages";
import MessageForm from "./pages/MessageForm";
import MessageDetail from "./pages/MessageDetail";
import Expenses from "./pages/Expenses";

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
              <Route path="/landlords/:id/properties" element={<Properties />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/properties/:id" element={<PropertyDetail />} />
              <Route path="/properties/new" element={<PropertyForm />} />
              <Route path="/tenants" element={<Tenants />} />
              <Route path="/tenants/:id" element={<TenantDetail />} />
              <Route path="/units" element={<Units />} />
              <Route path="/leases" element={<Leases />} />

              <Route path="/payments" element={<Payments />} />
              <Route path="/payments/new" element={<PaymentForm />} />
              <Route path="/expenses" element={<Expenses />} />
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

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </RefreshProvider>
  );
}

export default App;
