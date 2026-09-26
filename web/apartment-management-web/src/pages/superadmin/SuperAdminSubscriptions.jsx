import { SUBSCRIPTION_TIERS, PLATFORM_MODULES } from "../../context/AuthContext";
import "./SuperAdminLayout.css";

export default function SuperAdminSubscriptions() {
  return (
    <div id="super-subscriptions-page">
      {/* Header */}
      <div className="sa-page-header">
        <div>
          <p className="sa-page-tag">Commercial & SaaS Packaging</p>
          <h1 className="sa-page-title">Subscription Tiers & Module Entitlements</h1>
          <p className="sa-page-desc">
            Define software feature availability and pricing tiers for apartment management corporations.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="sa-kpi-grid">
        <div className="sa-kpi-card">
          <div className="sa-kpi-label">Monthly Recurring Revenue</div>
          <p className="sa-kpi-value" style={{ color: "#0f172a" }}>LKR 265,000</p>
          <span className="sa-kpi-subtext">3 active complex contracts</span>
        </div>
        <div className="sa-kpi-card">
          <div className="sa-kpi-label">Annual Projected Run-Rate</div>
          <p className="sa-kpi-value" style={{ color: "#0f172a" }}>LKR 3,180,000</p>
          <span className="sa-kpi-subtext">Estimated annual software billing</span>
        </div>
        <div className="sa-kpi-card">
          <div className="sa-kpi-label">Average Contract Value (ACV)</div>
          <p className="sa-kpi-value" style={{ color: "#0f172a" }}>LKR 88,333</p>
          <span className="sa-kpi-subtext">Per property per month</span>
        </div>
      </div>

      {/* Tiers Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: "20px" }}>
        {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => {
          const isEnterprise = key === "Enterprise Suite";
          return (
            <div
              key={key}
              className="sa-card"
              style={{
                position: "relative",
                border: isEnterprise ? "2px solid #0f172a" : "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>{tier.name}</h3>
                  {isEnterprise && (
                    <span className="sa-chip sa-chip--slate" style={{ background: "#0f172a", color: "#fff" }}>
                      Featured
                    </span>
                  )}
                </div>

                <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: "8px 0 2px" }}>
                  LKR {tier.priceLkr.toLocaleString()}
                  <span style={{ fontSize: "13px", fontWeight: 400, color: "#64748b" }}> / month</span>
                </div>
                <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 18px" }}>Up to {tier.unitLimit} units per property</p>

                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px", marginBottom: "18px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", margin: "0 0 10px", letterSpacing: "0.05em" }}>
                    INCLUDED MODULES ({tier.modules.length})
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                    {PLATFORM_MODULES.map((mod) => {
                      const included = tier.modules.includes(mod.key);
                      return (
                        <div
                          key={mod.key}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "12px",
                            color: included ? "#0f172a" : "#cbd5e1",
                            textDecoration: included ? "none" : "line-through",
                          }}
                        >
                          <span style={{ color: included ? "#16a34a" : "#cbd5e1", fontWeight: 700, fontSize: "13px" }}>
                            {included ? "✓" : "—"}
                          </span>
                          {mod.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button className="sa-btn sa-btn--secondary" style={{ width: "100%", justifyContent: "center" }}>
                Edit Tier Quotas
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
