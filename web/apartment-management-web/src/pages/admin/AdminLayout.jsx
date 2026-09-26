import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "../../components/admin/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { daysUntil } from "../../context/authConstants.js";
import "./AdminLayout.css";

function SubscriptionBlocked({ status, complex, onLogout }) {
  const reason =
    status === "Deactivated"
      ? "Your apartment complex's subscription has been deactivated by the platform owner."
      : `Your subscription expired on ${complex?.subscriptionEnd}.`;
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "44px 36px", textAlign: "center", maxWidth: "460px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontSize: "20px", margin: "0 0 8px", color: "#0f172a" }}>
          Subscription {status === "Deactivated" ? "Inactive" : "Expired"}
        </h2>
        <p style={{ color: "#64748b", fontSize: "13px", lineHeight: 1.6, margin: "0 0 6px" }}>{reason}</p>
        <p style={{ color: "#64748b", fontSize: "13px", lineHeight: 1.6, margin: "0 0 22px" }}>
          Please contact the platform owner to restore access for {complex?.name}.
        </p>
        <button className="admin-btn admin-btn--secondary" onClick={onLogout}>Sign out</button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { currentUser, isSuperAdmin, currentComplex, subscriptionStatus, subscriptionActive, logout } = useAuth();

  if (!currentUser) return <Navigate to="/login" replace />;
  if (isSuperAdmin) return <Navigate to="/super-admin" replace />;

  if (!subscriptionActive) {
    return <SubscriptionBlocked status={subscriptionStatus} complex={currentComplex} onLogout={logout} />;
  }

  const daysLeft = daysUntil(currentComplex?.subscriptionEnd);

  return (
    <div className="admin-layout" id="admin-layout">
      <Sidebar />
      <main className="admin-main">
        {subscriptionStatus === "Expiring" && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", marginBottom: "16px" }}>
            Your subscription ends in {daysLeft} day{daysLeft === 1 ? "" : "s"} ({currentComplex.subscriptionEnd}). Contact the platform owner to renew.
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
