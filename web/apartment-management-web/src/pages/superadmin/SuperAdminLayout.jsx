import { Outlet } from "react-router-dom";
import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import { useAuth } from "../../context/AuthContext";
import "./SuperAdminLayout.css";

export default function SuperAdminLayout() {
  const { isSuperAdmin, switchUser } = useAuth();

  // If unauthorized user visits /super-admin/*
  if (!isSuperAdmin) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "48px 36px", textAlign: "center", maxWidth: "480px", color: "#0f172a", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px", color: "#0f172a" }}>Super Admin Access Restricted</h2>
          <p style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.6", margin: "0 0 24px" }}>
            This portal is restricted to the platform owner. Apartment administrators are not authorized to configure complex provisionings or global platform settings.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button className="sa-btn sa-btn--secondary" onClick={() => (window.location.href = "/admin")}>
              Return to Complex Admin
            </button>
            <button className="sa-btn sa-btn--primary" onClick={() => switchUser("user-super-1")}>
              Authenticate as Super Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="super-admin-layout" id="super-admin-layout">
      <SuperAdminSidebar />
      <main className="super-admin-main">
        <Outlet />
      </main>
    </div>
  );
}
