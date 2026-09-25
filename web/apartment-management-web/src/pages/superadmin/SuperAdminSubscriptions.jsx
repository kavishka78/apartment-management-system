import { useState } from "react";
import "./SuperAdminDashboard.css";

const TIERS = [
  {
    name: "Standard SaaS",
    price: "LKR 35,000 / month",
    unitLimit: "Up to 50 Units",
    features: [
      "Unit & Resident Registry",
      "Vehicle & Parking Tracking",
      "Domestic Staff Digital Passes",
      "Basic Invoicing & Billing",
      "Standard Email Support",
    ],
    popular: false,
  },
  {
    name: "Enterprise B2B",
    price: "LKR 85,000 / month",
    unitLimit: "Unlimited Units",
    features: [
      "Everything in Standard SaaS",
      "Autonomous Agentic AI Triage & Costing",
      "Multi-Gate Security & QR Checkpoints",
      "Real-time Twilio SMS Gate Passes",
      "Dedicated Technical Account Manager",
    ],
    popular: true,
  },
  {
    name: "Premium Condominium Suite",
    price: "LKR 145,000 / month",
    unitLimit: "Multi-Tower Complex",
    features: [
      "Everything in Enterprise B2B",
      "Custom Property Branding on Mobile App",
      "Google Maps In-Store Commerce Engine",
      "Full API Access & Webhook Integrations",
      "99.9% SLA & 24/7 Priority Hotline",
    ],
    popular: false,
  },
];

export default function SuperAdminSubscriptions() {
  return (
    <div className="super-admin-page" id="super-subscriptions-page">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>
          SaaS Subscription Tiers & Multi-Tenant Billing
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
          Manage apartment association billing plans, tier quotas, and platform revenue metrics.
        </p>
      </div>

      {/* Revenue KPI */}
      <div className="tenant-stats-grid">
        <div className="super-card">
          <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 4px" }}>Monthly Recurring Revenue (MRR)</p>
          <h2 style={{ color: "#34d399", fontSize: "26px", fontWeight: 800, margin: 0 }}>LKR 265,000</h2>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Across 3 active complex subscriptions</span>
        </div>

        <div className="super-card">
          <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 4px" }}>Annual Projected Run-Rate</p>
          <h2 style={{ color: "#a5b4fc", fontSize: "26px", fontWeight: 800, margin: 0 }}>LKR 3,180,000</h2>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Based on current active subscriptions</span>
        </div>

        <div className="super-card">
          <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 4px" }}>Active Subscription Rate</p>
          <h2 style={{ color: "#fbbf24", fontSize: "26px", fontWeight: 800, margin: 0 }}>100%</h2>
          <span style={{ fontSize: "12px", color: "#64748b" }}>0 Delinquent complexes</span>
        </div>
      </div>

      {/* Plan Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
        {TIERS.map((tier) => (
          <div
            className="super-card"
            key={tier.name}
            style={{
              position: "relative",
              border: tier.popular ? "2px solid #6366f1" : "1px solid #334155",
            }}
          >
            {tier.popular && (
              <span
                style={{
                  position: "absolute",
                  top: "-12px",
                  right: "20px",
                  background: "#6366f1",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: "20px",
                  textTransform: "uppercase",
                }}
              >
                Most Popular
              </span>
            )}

            <h3 style={{ fontSize: "18px", color: "#fff", margin: "0 0 8px" }}>{tier.name}</h3>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#34d399", marginBottom: "4px" }}>
              {tier.price}
            </div>
            <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "18px" }}>{tier.unitLimit}</p>

            <div style={{ borderTop: "1px solid #334155", paddingTop: "16px", marginBottom: "20px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "10px" }}>
                INCLUDED CAPABILITIES
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                {tier.features.map((feat, idx) => (
                  <li key={idx} style={{ fontSize: "13px", color: "#cbd5e1", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#34d399" }}>✓</span> {feat}
                  </li>
                ))}
              </ul>
            </div>

            <button className="super-btn super-btn--secondary" style={{ width: "100%", justifyContent: "center" }}>
              Manage Plan Settings
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
