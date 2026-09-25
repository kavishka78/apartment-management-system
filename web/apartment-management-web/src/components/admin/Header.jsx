import { useAuth } from "../../context/AuthContext";
import "./Header.css";

export default function Header({ title, subtitle, children }) {
  const { currentUser, availableUsers, switchUser, isSuperAdmin } = useAuth();

  return (
    <header className="admin-header" id="admin-header">
      <div className="admin-header-left">
        <p className="admin-header-label">
          {isSuperAdmin ? "👑 SaaS Platform Owner Console" : `🏢 ${currentUser.complexName}`}
        </p>
        <h1 className="admin-header-title">{title}</h1>
        {subtitle && <p className="admin-header-subtitle">{subtitle}</p>}
      </div>

      <div className="admin-header-right">
        {/* Custom Actions if passed */}
        {children}

        {/* Role & Session Switcher */}
        <div className="session-switcher-box">
          <span
            className={`session-badge ${
              isSuperAdmin ? "session-badge--super" : "session-badge--admin"
            }`}
          >
            {isSuperAdmin ? "Super Admin" : "Apartment Admin"}
          </span>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>SWITCH ACTIVE USER:</span>
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
                color: "#1e293b",
                cursor: "pointer",
              }}
            >
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.role === "SuperAdmin" ? "👑 Super Admin" : `🏢 ${u.complexName}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
