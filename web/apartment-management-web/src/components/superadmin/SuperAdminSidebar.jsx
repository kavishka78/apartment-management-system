import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./SuperAdminSidebar.css";

const SUPER_NAV_ITEMS = [
  {
    label: "Platform Overview",
    path: "/super-admin",
    icon: (
      <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    label: "Apartment Complexes",
    path: "/super-admin/complexes",
    icon: (
      <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12l3 3v15" />
      </svg>
    ),
  },
  {
    label: "Apartment Administrators",
    path: "/super-admin/admins",
    icon: (
      <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    label: "SaaS Subscription Tiers",
    path: "/super-admin/subscriptions",
    icon: (
      <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-6 3.75h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 5.25v13.5a1.5 1.5 0 001.5 1.5z" />
      </svg>
    ),
  },
  {
    label: "AI Multi-Tenant Safety",
    path: "/super-admin/ai-governance",
    icon: (
      <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
];

export default function SuperAdminSidebar() {
  const { currentUser, logout } = useAuth();

  return (
    <aside className="super-sidebar" id="super-sidebar">
      {/* Brand Header */}
      <div className="super-sidebar-brand">
        <div className="super-sidebar-logo">AH</div>
        <div className="super-sidebar-brand-text">
          <h2 className="super-sidebar-title">ApartmentHub</h2>
          <p className="super-sidebar-sub">Platform Owner Console</p>
        </div>
      </div>

      <p className="super-nav-section-lbl">PLATFORM GOVERNANCE</p>

      {/* Main Navigation */}
      <nav>
        {SUPER_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/super-admin"}
            className={({ isActive }) =>
              `super-nav-link${isActive ? " super-nav-link--active" : ""}`
            }
          >
            <span className="super-nav-link-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer Account */}
      <div className="super-sidebar-footer">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "6px",
              background: "#0f172a",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "11px",
            }}
          >
            {currentUser.avatar || "AV"}
          </div>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>{currentUser.name}</div>
            <div style={{ fontSize: "10px", color: "#64748b" }}>Super Administrator</div>
            <button onClick={logout} style={{ background: "none", border: "none", padding: 0, fontSize: "10px", color: "#4f46e5", cursor: "pointer" }}>Sign out</button>
          </div>
        </div>
      </div>
    </aside>
  );
}
