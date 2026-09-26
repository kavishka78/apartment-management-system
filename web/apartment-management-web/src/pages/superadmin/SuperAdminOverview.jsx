import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTenants } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./SuperAdminDashboard.css";

export default function SuperAdminOverview() {
  const { complexAdmins, switchUser } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getTenants();
        setTenants(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalComplexes = tenants.length;
  const totalAdmins = complexAdmins.length;
  const totalUnits = tenants.reduce((acc, t) => acc + (t.totalUnits || 0), 0);
  const totalOccupied = tenants.reduce((acc, t) => acc + (t.occupiedUnits || 0), 0);

  return (
    <div className="super-admin-page" id="super-overview-page">
      {/* Hero Banner */}
      <div className="super-admin-hero">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span className="role-tag-super">👑 Super Admin Master Console</span>
            <span style={{ fontSize: "12px", color: "#a5b4fc" }}>URL: /super-admin</span>
          </div>
          <h1>Multi-Tenant Apartment Platform Overview</h1>
          <p>
            Global SaaS governance dashboard for managing subscribed apartment complexes, building administrators, and tenant data isolation.
          </p>
        </div>

        <div className="super-admin-actions">
          <Link to="/super-admin/complexes" className="super-btn super-btn--primary" style={{ textDecoration: "none" }}>
            🏢 Onboard Property
          </Link>
          <Link to="/super-admin/admins" className="super-btn super-btn--success" style={{ textDecoration: "none" }}>
            👤 Provision Admin
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="tenant-stats-grid">
        <div className="super-card" style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(99, 102, 241, 0.2)", color: "#a5b4fc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
            🏢
          </div>
          <div>
            <h3 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "#fff" }}>{totalComplexes}</h3>
            <p style={{ margin: "2px 0 0", color: "#94a3b8", fontSize: "13px" }}>Subscribed Complexes</p>
          </div>
        </div>

        <div className="super-card" style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.2)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
            👤
          </div>
          <div>
            <h3 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "#fff" }}>{totalAdmins}</h3>
            <p style={{ margin: "2px 0 0", color: "#94a3b8", fontSize: "13px" }}>Active Apartment Admins</p>
          </div>
        </div>

        <div className="super-card" style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.2)", color: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
            🚪
          </div>
          <div>
            <h3 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "#fff" }}>{totalUnits}</h3>
            <p style={{ margin: "2px 0 0", color: "#94a3b8", fontSize: "13px" }}>Total Managed Units ({totalOccupied} Occupied)</p>
          </div>
        </div>

        <div className="super-card" style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(236, 72, 153, 0.2)", color: "#f472b6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
            🛡️
          </div>
          <div>
            <h3 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "#fff" }}>100%</h3>
            <p style={{ margin: "2px 0 0", color: "#94a3b8", fontSize: "13px" }}>Tenant Isolation Health</p>
          </div>
        </div>
      </div>

      {/* Complex Directory Preview */}
      <div className="super-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", color: "#fff" }}>Active Apartment Complexes (Tenants)</h3>
            <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "13px" }}>
              Multi-tenant properties provisioned on the platform.
            </p>
          </div>
          <Link to="/super-admin/complexes" className="super-btn super-btn--secondary super-btn--sm" style={{ textDecoration: "none" }}>
            View Full Directory ➔
          </Link>
        </div>

        {loading ? (
          <div className="admin-loading"><div className="spinner" /></div>
        ) : (
          <div className="super-table-wrap">
            <table className="super-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Property Name</th>
                  <th>Location</th>
                  <th>Assigned Admin</th>
                  <th>Units</th>
                  <th>Subscription</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => {
                  const assigned = complexAdmins.find((a) => a.complexId === t.id);
                  return (
                    <tr key={t.id}>
                      <td><span className="complex-code-badge">{t.code || `CMP-${t.id}`}</span></td>
                      <td style={{ fontWeight: 700, color: "#fff" }}>{t.name}</td>
                      <td style={{ color: "#94a3b8" }}>{t.address}</td>
                      <td>
                        {assigned ? (
                          <span style={{ color: "#34d399", fontWeight: 600 }}>👤 {assigned.name}</span>
                        ) : (
                          <span style={{ color: "#fbbf24" }}>⚠️ Pending Assignment</span>
                        )}
                      </td>
                      <td>{t.totalUnits} Units</td>
                      <td><span className="super-badge super-badge--indigo">{t.subscriptionPlan || "Standard SaaS"}</span></td>
                      <td>
                        <button
                          className="super-btn super-btn--primary super-btn--sm"
                          onClick={() => {
                            if (assigned) {
                              switchUser(assigned.id);
                            }
                          }}
                        >
                          Launch Complex Portal ➔
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
