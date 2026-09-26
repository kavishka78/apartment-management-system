import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Sidebar.css";

export default function Sidebar() {
  const { currentUser, currentComplex, isModuleEnabled } = useAuth();

  return (
    <aside className="admin-sidebar" id="admin-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">
          {currentComplex?.code?.slice(0, 2) || "AH"}
        </span>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span className="sidebar-brand-text">{currentComplex?.name || "ApartmentHub"}</span>
          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
            {currentComplex?.subscriptionPlan || "Standard SaaS"}
          </span>
        </div>
      </div>

      {/* Property & Resident Management (Only items enabled for this complex package) */}
      <p className="sidebar-section-label">PROPERTY MANAGEMENT</p>
      <nav className="sidebar-nav">
        {isModuleEnabled("units") && (
          <NavLink
            to="/admin/units"
            className={({ isActive }) =>
              `sidebar-link${isActive ? " sidebar-link--active" : ""}`
            }
            id="nav-units"
          >
            <span className="sidebar-link-icon">
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1" />
              </svg>
            </span>
            Units & Floor Allocations
          </NavLink>
        )}

        {isModuleEnabled("residents") && (
          <NavLink
            to="/admin/residents"
            className={({ isActive }) =>
              `sidebar-link${isActive ? " sidebar-link--active" : ""}`
            }
            id="nav-residents"
          >
            <span className="sidebar-link-icon">
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </span>
            Homeowners & Residents
          </NavLink>
        )}

        {isModuleEnabled("vehicles") && (
          <NavLink
            to="/admin/vehicles"
            className={({ isActive }) =>
              `sidebar-link${isActive ? " sidebar-link--active" : ""}`
            }
            id="nav-vehicles"
          >
            <span className="sidebar-link-icon">
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V4.5a1.5 1.5 0 00-1.5-1.5H6.75A1.5 1.5 0 005.25 4.5v3" />
              </svg>
            </span>
            Vehicles & Parking Slots
          </NavLink>
        )}

        {isModuleEnabled("staff") && (
          <NavLink
            to="/admin/staff"
            className={({ isActive }) =>
              `sidebar-link${isActive ? " sidebar-link--active" : ""}`
            }
            id="nav-staff"
          >
            <span className="sidebar-link-icon">
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.169.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.337 0z" />
              </svg>
            </span>
            Domestic Staff Passes
          </NavLink>
        )}

        {isModuleEnabled("ai_safety") && (
          <NavLink
            to="/admin/ai-safety"
            className={({ isActive }) =>
              `sidebar-link${isActive ? " sidebar-link--active" : ""}`
            }
            id="nav-safety"
          >
            <span className="sidebar-link-icon">
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </span>
            AI Safety Auditor
          </NavLink>
        )}
      </nav>

      {/* Facilities & Operations (If enabled in package) */}
      {(isModuleEnabled("facilities") || isModuleEnabled("visitors")) && (
        <>
          <div className="sidebar-divider" />
          <p className="sidebar-section-label">FACILITY OPERATIONS</p>
          <nav className="sidebar-nav">
            {isModuleEnabled("facilities") && (
              <NavLink
                to="/admin/facilities"
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " sidebar-link--active" : ""}`
                }
                id="nav-facilities"
              >
                <span className="sidebar-link-icon">
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </span>
                Facility Booking Slots
              </NavLink>
            )}

            {isModuleEnabled("visitors") && (
              <NavLink
                to="/admin/visitors"
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " sidebar-link--active" : ""}`
                }
                id="nav-visitors"
              >
                <span className="sidebar-link-icon">
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                  </svg>
                </span>
                Visitor Checkpoint Logs
              </NavLink>
            )}
          </nav>
        </>
      )}

      {/* Commerce & Billing (If enabled in package) */}
      {isModuleEnabled("payments") && (
        <>
          <div className="sidebar-divider" />
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
                <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-6 3.75h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 5.25v13.5a1.5 1.5 0 001.5 1.5z" />
                </svg>
              </span>
              Invoices & Payments
            </NavLink>
          </nav>
        </>
      )}

      {/* Footer Profile */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{currentUser.avatar || "NF"}</div>
          <div>
            <p className="sidebar-user-name">{currentUser.name}</p>
            <p className="sidebar-user-role">Building Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
