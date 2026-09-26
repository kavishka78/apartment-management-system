import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  SUBSCRIPTION_TIERS,
  PLATFORM_MODULES,
  RENEWAL_PERIODS,
  daysUntil,
  getSubscriptionStatus,
  isSubscriptionUsable,
} from "../../context/authConstants.js";
import "./SuperAdminLayout.css";

const STATUS_CHIP = {
  Active: "sa-chip--green",
  Expiring: "sa-chip--amber",
  Expired: "sa-chip--slate",
  Deactivated: "sa-chip--slate",
};

export default function SuperAdminSubscriptions() {
  const { complexes, subscriptionHistory, renewSubscription, updateComplexPackage, deactivateComplex, reactivateComplex } = useAuth();
  const [renewing, setRenewing] = useState(null);
  const [renewMonths, setRenewMonths] = useState(12);
  const [changing, setChanging] = useState(null);
  const [newPlan, setNewPlan] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  const billable = complexes.filter(isSubscriptionUsable);
  const mrr = billable.reduce((sum, c) => sum + (SUBSCRIPTION_TIERS[c.subscriptionPlan]?.priceLkr || 0), 0);
  const expiringCount = complexes.filter((c) => getSubscriptionStatus(c) === "Expiring").length;
  const inactiveCount = complexes.filter((c) => ["Expired", "Deactivated"].includes(getSubscriptionStatus(c))).length;

  const confirmRenew = () => {
    renewSubscription(renewing.id, renewMonths);
    showToast(`${renewing.name} renewed for ${renewMonths} month(s).`);
    setRenewing(null);
  };

  const confirmChange = () => {
    updateComplexPackage(changing.id, newPlan, SUBSCRIPTION_TIERS[newPlan].modules);
    showToast(`${changing.name} moved to ${newPlan}.`);
    setChanging(null);
  };

  return (
    <div id="super-subscriptions-page">
      {toast && (
        <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 9999, padding: "12px 20px", borderRadius: "8px", background: "#0f172a", color: "#fff", fontWeight: 600, fontSize: "13px" }}>
          {toast}
        </div>
      )}

      <div className="sa-page-header">
        <div>
          <p className="sa-page-tag">Commercial & SaaS Packaging</p>
          <h1 className="sa-page-title">Subscriptions & Module Entitlements</h1>
          <p className="sa-page-desc">
            Manage each apartment complex's subscription: renew, upgrade, or deactivate access.
          </p>
        </div>
      </div>

      <div className="sa-kpi-grid">
        <div className="sa-kpi-card sa-kpi-card--indigo">
          <div className="sa-kpi-label">Monthly Recurring Revenue</div>
          <p className="sa-kpi-value">LKR {mrr.toLocaleString()}</p>
          <span className="sa-kpi-subtext">{billable.length} active complex contract(s)</span>
        </div>
        <div className="sa-kpi-card sa-kpi-card--amber">
          <div className="sa-kpi-label">Expiring Within 30 Days</div>
          <p className="sa-kpi-value">{expiringCount}</p>
          <span className="sa-kpi-subtext">Renewal needed soon</span>
        </div>
        <div className="sa-kpi-card sa-kpi-card--violet">
          <div className="sa-kpi-label">Expired / Deactivated</div>
          <p className="sa-kpi-value">{inactiveCount}</p>
          <span className="sa-kpi-subtext">Admin access blocked</span>
        </div>
      </div>

      <div className="sa-card" style={{ marginBottom: "24px" }}>
        <div className="sa-card-header">
          <div>
            <h3 className="sa-card-title">Complex Subscriptions</h3>
            <p className="sa-card-subtitle">Renew, change plan, or deactivate each apartment complex.</p>
          </div>
        </div>
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Complex</th>
                <th>Package</th>
                <th>Valid Until</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {complexes.map((c) => {
                const status = getSubscriptionStatus(c);
                const days = daysUntil(c.subscriptionEnd);
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, color: "#0f172a" }}>{c.name}</td>
                    <td><span className="sa-chip sa-chip--indigo">{c.subscriptionPlan}</span></td>
                    <td>
                      {c.subscriptionEnd}
                      <div style={{ fontSize: "11px", color: days < 0 ? "#dc2626" : "#94a3b8" }}>
                        {days < 0 ? `expired ${-days} day(s) ago` : `${days} day(s) left`}
                      </div>
                    </td>
                    <td><span className={`sa-chip ${STATUS_CHIP[status]}`}>{status}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <button className="sa-btn sa-btn--secondary sa-btn--sm" onClick={() => { setRenewing(c); setRenewMonths(12); }}>
                          Renew
                        </button>
                        <button className="sa-btn sa-btn--secondary sa-btn--sm" onClick={() => { setChanging(c); setNewPlan(c.subscriptionPlan); }}>
                          Change Plan
                        </button>
                        {c.status === "Deactivated" ? (
                          <button className="sa-btn sa-btn--primary sa-btn--sm" onClick={() => { reactivateComplex(c.id); showToast(`${c.name} reactivated.`); }}>
                            Reactivate
                          </button>
                        ) : (
                          <button className="sa-btn sa-btn--secondary sa-btn--sm" style={{ color: "#dc2626" }} onClick={() => { deactivateComplex(c.id); showToast(`${c.name} deactivated.`); }}>
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {subscriptionHistory.length > 0 && (
        <div className="sa-card" style={{ marginBottom: "24px" }}>
          <div className="sa-card-header">
            <h3 className="sa-card-title">Subscription Activity Log</h3>
          </div>
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr><th>When</th><th>Complex</th><th>Action</th><th>Details</th><th>By</th></tr>
              </thead>
              <tbody>
                {subscriptionHistory.slice(0, 15).map((h) => (
                  <tr key={h.id}>
                    <td style={{ color: "#64748b" }}>{new Date(h.at).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>{h.complexName}</td>
                    <td><span className="sa-chip sa-chip--slate">{h.action}</span></td>
                    <td>{h.detail}</td>
                    <td style={{ color: "#64748b" }}>{h.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: "20px" }}>
        {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => {
          const isEnterprise = key === "Enterprise Suite";
          return (
            <div
              key={key}
              className="sa-card"
              style={{ border: isEnterprise ? "2px solid #0f172a" : "1px solid #e2e8f0" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>{tier.name}</h3>
                {isEnterprise && (
                  <span className="sa-chip sa-chip--slate" style={{ background: "#0f172a", color: "#fff" }}>Featured</span>
                )}
              </div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", margin: "8px 0 2px" }}>
                LKR {tier.priceLkr.toLocaleString()}
                <span style={{ fontSize: "13px", fontWeight: 400, color: "#64748b" }}> / month</span>
              </div>
              <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 18px" }}>Up to {tier.unitLimit} units per property</p>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
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
          );
        })}
      </div>

      {renewing && (
        <div className="sa-modal-overlay" onClick={() => setRenewing(null)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
            <h2>Renew Subscription</h2>
            <p className="desc">{renewing.name} is valid until {renewing.subscriptionEnd}.</p>
            <div className="sa-form-group">
              <label>Extend by</label>
              <select value={renewMonths} onChange={(e) => setRenewMonths(Number(e.target.value))}>
                {RENEWAL_PERIODS.map((p) => <option key={p.months} value={p.months}>{p.label}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button className="sa-btn sa-btn--secondary" onClick={() => setRenewing(null)}>Cancel</button>
              <button className="sa-btn sa-btn--primary" onClick={confirmRenew}>Confirm Renewal</button>
            </div>
          </div>
        </div>
      )}

      {changing && (
        <div className="sa-modal-overlay" onClick={() => setChanging(null)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
            <h2>Change Package</h2>
            <p className="desc">{changing.name}: modules update immediately for the apartment admin.</p>
            <div className="sa-form-group">
              <label>New package</label>
              <select value={newPlan} onChange={(e) => setNewPlan(e.target.value)}>
                {Object.keys(SUBSCRIPTION_TIERS).map((k) => (
                  <option key={k} value={k}>{k} (LKR {SUBSCRIPTION_TIERS[k].priceLkr.toLocaleString()} / mo)</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button className="sa-btn sa-btn--secondary" onClick={() => setChanging(null)}>Cancel</button>
              <button className="sa-btn sa-btn--primary" onClick={confirmChange} disabled={newPlan === changing.subscriptionPlan}>
                Apply Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
