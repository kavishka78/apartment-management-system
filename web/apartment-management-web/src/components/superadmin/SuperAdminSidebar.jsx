import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./SuperAdminSidebar.css";

const SUPER_NAV_ITEMS = [
  {
    label: "Platform Overview",
    path: "/super-admin",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1v-5zM4 14a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5z" />
      </svg>
    ),
  },
  {
    label: "Apartment Complexes",
    path: "/super-admin/complexes",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    label: "Apartment Admins",
    path: "/super-admin/admins",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: "SaaS Subscriptions",
    path: "/super-admin/subscriptions",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    label: "AI Multi-Tenant Safety",
    path: "/super-admin/ai-governance",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

export default function SuperAdminSidebar() {
  const { currentUser } = useAuth();

  return (
    <aside className="super-sidebar" id="super-sidebar">
      {/* Brand Header */}
      <div className="super-sidebar-brand">
        <div className="super-sidebar-icon">👑</div>
        <div>
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
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <p className="super-nav-section-lbl" style={{ marginTop: "24px" }}>APARTMENT MANAGER VIEW</p>
      <nav>
        <NavLink to="/admin" className="super-nav-link" style={{ color: "#a5f3fc" }}>
          <span>🏢</span>
          Launch Building Portal ➔
        </NavLink>
      </nav>

      {/* Footer Profile */}
      <div className="super-sidebar-footer">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "#6366f1",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "12px",
            }}
          >
            AV
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>{currentUser.name}</div>
            <div style={{ fontSize: "11px", color: "#f59e0b", fontWeight: 600 }}>Super Administrator</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
