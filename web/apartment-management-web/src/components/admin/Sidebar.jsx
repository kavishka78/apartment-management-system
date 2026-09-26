import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

const NAV_ITEMS = [
  {
    label: "Overview",
    path: "/admin",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1v-5zM4 14a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5z" />
      </svg>
    ),
  },
  {
    label: "Facilities",
    path: "/admin/facilities",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    label: "Visitors and Parkings",
    path: "/admin/visitors",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: "AI Approvals",
    path: "/admin/ai-approvals",
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { currentUser, isSuperAdmin, activeComplexName } = useAuth();

  return (
    <aside className="admin-sidebar" id="admin-sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">A</span>
        <span className="sidebar-brand-text">ApartmentHub</span>
      </div>

      {/* 👑 SUPER ADMIN EXCLUSIVE SECTION */}
      {isSuperAdmin && (
        <>
          <p className="sidebar-section-label">👑 PLATFORM GOVERNANCE</p>
          <nav className="sidebar-nav">
            <NavLink
              to="/super-admin"
              className={({ isActive }) =>
                `sidebar-link${isActive ? " sidebar-link--active" : ""}`
              }
              id="nav-super-admin"
            >
              <span className="sidebar-link-icon">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              Properties & Admins
            </NavLink>
          </nav>
          <div className="sidebar-divider" />
        </>
      )}

      {/* 🏢 APARTMENT ADMIN / BUILDING MANAGER SCOPE */}
      <p className="sidebar-section-label">
        {isSuperAdmin ? "PROPERTY REGISTRY VIEW" : `🏢 ${activeComplexName.toUpperCase()}`}
      </p>

      <nav className="sidebar-nav">
        <NavLink
          to="/admin/units"
          className={({ isActive }) =>
            `sidebar-link${isActive ? " sidebar-link--active" : ""}`
          }
          id="nav-units"
        >
          <span className="sidebar-link-icon">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </span>
          Units & Allocations
        </NavLink>

        <NavLink
          to="/admin/residents"
          className={({ isActive }) =>
            `sidebar-link${isActive ? " sidebar-link--active" : ""}`
          }
          id="nav-residents"
        >
          <span className="sidebar-link-icon">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </span>
          Homeowners & Residents
        </NavLink>

        <NavLink
          to="/admin/vehicles"
          className={({ isActive }) =>
            `sidebar-link${isActive ? " sidebar-link--active" : ""}`
          }
          id="nav-vehicles"
        >
          <span className="sidebar-link-icon">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </span>
          Vehicles & Parking
        </NavLink>

        <NavLink
          to="/admin/staff"
          className={({ isActive }) =>
            `sidebar-link${isActive ? " sidebar-link--active" : ""}`
          }
          id="nav-staff"
        >
          <span className="sidebar-link-icon">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </span>
          Domestic Staff Passes
        </NavLink>

        <NavLink
          to="/admin/ai-safety"
          className={({ isActive }) =>
            `sidebar-link${isActive ? " sidebar-link--active" : ""}`
          }
          id="nav-safety"
        >
          <span className="sidebar-link-icon">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </span>
          AI Safety Auditor
        </NavLink>
      </nav>

      <div className="sidebar-divider" />

      {/* Facilities & Operations */}
      <p className="sidebar-section-label">FACILITY OPERATIONS</p>
      <nav className="sidebar-nav">
        <NavLink
          to="/admin/facilities"
          className={({ isActive }) =>
            `sidebar-link${isActive ? " sidebar-link--active" : ""}`
          }
          id="nav-facilities"
        >
          <span className="sidebar-link-icon">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </span>
          Facilities & Slots
        </NavLink>

        <NavLink
          to="/admin/visitors"
          className={({ isActive }) =>
            `sidebar-link${isActive ? " sidebar-link--active" : ""}`
          }
          id="nav-visitors"
        >
          <span className="sidebar-link-icon">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </span>
          Visitor Gate Logs
        </NavLink>
      </nav>

      <div className="sidebar-divider" />

      {/* Commerce & Billing */}
      <p className="sidebar-section-label">COMMERCE & BILLING</p>
      <nav className="sidebar-nav">
        <NavLink
          to="/payments"
          className={({ isActive }) =>
            `sidebar-link${isActive ? " sidebar-link--active" : ""}`
          }
          id="nav-payments"
        >
          <span className="sidebar-link-icon">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </span>
          Invoices & Payments
        </NavLink>
      </nav>

      {/* User Footer Profile */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{currentUser.avatar || "AD"}</div>
          <div>
            <p className="sidebar-user-name">{currentUser.name}</p>
            <p className="sidebar-user-role">{currentUser.roleLabel}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
