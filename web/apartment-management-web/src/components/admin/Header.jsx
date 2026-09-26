import { useAuth } from "../../context/AuthContext";
import "./Header.css";

export default function Header({ title, subtitle, children }) {
  const { currentUser, availableUsers, switchUser, currentComplex, isSuperAdmin } = useAuth();

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
            <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              ACTIVE USER:
            </span>
            <select
              value={currentUser.id}
              onChange={(e) => switchUser(e.target.value)}
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                cursor: "pointer",
              }}
            >
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role === "SuperAdmin" ? "Super Admin" : u.complexName})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
