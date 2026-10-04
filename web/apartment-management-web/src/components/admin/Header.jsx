import { useAuth } from "../../context/AuthContext";
import "./Header.css";

export default function Header({ title, subtitle, children }) {
  const { currentUser, logout, currentComplex, isSuperAdmin } = useAuth();

  return (
    <header className="admin-header" id="admin-header">
      <div className="admin-header-left">
        <p className="admin-header-label">
          {isSuperAdmin ? "SaaS Platform Owner Console" : currentComplex?.name || "Apartment Portal"}
        </p>
        <h1 className="admin-header-title">{title}</h1>
        {subtitle && <p className="admin-header-subtitle">{subtitle}</p>}
      </div>

      <div className="admin-header-right">
        {/* Custom page buttons */}
        {children}

        {/* Multi-Tenant Session Simulator */}
        <div className="session-switcher-box">
          <span
            className={`session-badge ${
              isSuperAdmin ? "session-badge--super" : "session-badge--admin"
            }`}
          >
            {isSuperAdmin ? "Platform Owner" : "Apartment Admin"}
          </span>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>{currentUser?.name}</span>
            <button
              onClick={logout}
              style={{ background: "none", border: "none", padding: 0, fontSize: "11px", color: "#4f46e5", cursor: "pointer", textAlign: "left" }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
