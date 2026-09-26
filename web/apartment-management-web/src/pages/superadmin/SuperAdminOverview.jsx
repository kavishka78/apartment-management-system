import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./SuperAdminLayout.css";

export default function SuperAdminOverview() {
  const { complexes, complexAdmins } = useAuth();

  const totalComplexes = complexes.length;
  const totalAdmins = complexAdmins.length;
  const totalUnits = complexes.reduce((acc, t) => acc + (t.totalUnits || 0), 0);
  const totalOccupied = complexes.reduce((acc, t) => acc + (t.occupiedUnits || 0), 0);
  const occupancyRate = totalUnits ? Math.round((totalOccupied / totalUnits) * 100) : 0;

  return (
    <div id="super-overview-page">
      {/* Page Header */}
      <div className="sa-page-header">
        <div>
          <p className="sa-page-tag">Platform Owner Console</p>
          <h1 className="sa-page-title">SaaS Governance & Portfolio Overview</h1>
          <p className="sa-page-desc">
            Global management of subscribed apartment complexes, building administrators, and tenant data isolation.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/super-admin/complexes" className="sa-btn sa-btn--secondary">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Onboard Complex
          </Link>
          <Link to="/super-admin/admins" className="sa-btn sa-btn--primary">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.765z" />
            </svg>
            Provision Admin
          </Link>
        </div>
      </div>

      {/* KPI Metric Grid */}
      <div className="sa-kpi-grid">
        <div className="sa-kpi-card">
          <div className="sa-kpi-label">
            <span>Subscribed Complexes</span>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12l3 3v15" />
            </svg>
          </div>
          <p className="sa-kpi-value">{totalComplexes}</p>
          <span className="sa-kpi-subtext">Active condominium properties</span>
        </div>

        <div className="sa-kpi-card">
          <div className="sa-kpi-label">
            <span>Building Administrators</span>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <p className="sa-kpi-value">{totalAdmins}</p>
          <span className="sa-kpi-subtext">Provisioned manager accounts</span>
        </div>

        <div className="sa-kpi-card">
          <div className="sa-kpi-label">
            <span>Portfolio Units</span>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1" />
            </svg>
          </div>
          <p className="sa-kpi-value">{totalUnits}</p>
          <span className="sa-kpi-subtext">{totalOccupied} Occupied ({occupancyRate}%)</span>
        </div>

        <div className="sa-kpi-card">
          <div className="sa-kpi-label">
            <span>Monthly Run-Rate (MRR)</span>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6H2.25m19.5 0H21a.75.75 0 01-.75-.75V4.5m0 0a3 3 0 00-3-3H6.75a3 3 0 00-3 3v.75" />
            </svg>
          </div>
          <p className="sa-kpi-value" style={{ color: "#0f172a" }}>LKR 265K</p>
          <span className="sa-kpi-subtext">Across active subscription tiers</span>
        </div>
      </div>

      {/* Subscribed Complexes Table */}
      <div className="sa-card">
        <div className="sa-card-header">
          <div>
            <h3 className="sa-card-title">Apartment Complexes & Assigned Building Managers</h3>
            <p className="sa-card-subtitle">
              Each complex operates in strict multi-tenant isolation with individual package entitlements.
            </p>
          </div>
          <Link to="/super-admin/complexes" className="sa-btn sa-btn--secondary sa-btn--sm">
            View All Properties
          </Link>
        </div>

        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Property Name</th>
                <th>Location</th>
                <th>Assigned Building Admin</th>
                <th>Capacity</th>
                <th>Subscription Package</th>
                <th>Active Modules</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {complexes.map((c) => {
                const admin = complexAdmins.find((a) => a.complexId === c.id);
                return (
                  <tr key={c.id}>
                    <td><span className="sa-code-badge">{c.code || `CMP-${c.id}`}</span></td>
                    <td style={{ fontWeight: 600, color: "#0f172a" }}>{c.name}</td>
                    <td style={{ color: "#64748b" }}>{c.address}</td>
                    <td>
                      {admin ? (
                        <span style={{ fontWeight: 500, color: "#0f172a" }}>{admin.name}</span>
                      ) : (
                        <span style={{ color: "#b45309", fontSize: "12px" }}>Unassigned</span>
                      )}
                    </td>
                    <td>{c.totalUnits} Units</td>
                    <td>
                      <span className="sa-chip sa-chip--indigo">
                        {c.subscriptionPlan}
                      </span>
                    </td>
                    <td>
                      <span className="sa-chip sa-chip--slate">
                        {(c.enabledModules || []).length} Enabled
                      </span>
                    </td>
                    <td>
                      <span className="sa-chip sa-chip--green">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
