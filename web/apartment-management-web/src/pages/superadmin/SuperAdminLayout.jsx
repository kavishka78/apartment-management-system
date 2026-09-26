import { Outlet } from "react-router-dom";
import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import { useAuth } from "../../context/AuthContext";
import "./SuperAdminLayout.css";

export default function SuperAdminLayout() {
  const { isSuperAdmin, switchUser } = useAuth();

  // If unauthorized user visits
  if (!isSuperAdmin) {
    return (
      <div style={{ minHeight: "100vh", background: "#0b0f19", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "16px", padding: "48px 32px", textAlign: "center", maxWidth: "520px", color: "#f1f5f9" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>🔒</div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 8px" }}>Super Admin Portal Access Restricted</h2>
          <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
            This URL endpoint is strictly isolated for the <strong>Platform Owner (Super Administrator)</strong>. Apartment Administrators cannot configure platform-wide properties or credentials.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <a href="/admin" className="super-btn super-btn--secondary" style={{ textDecoration: "none" }}>
              ← Return to Building Admin
            </a>
            <button className="super-btn super-btn--primary" onClick={() => switchUser("user-super-1")}>
              👑 Authenticate as Super Admin
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
