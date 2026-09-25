import { useState, useEffect } from "react";
import { getTenants, createTenant } from "../../services/api";
import "./Tenants.css";

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // New Tenant Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    subscriptionPlan: "Standard SaaS",
    totalUnits: 24,
  });

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await getTenants();
      setTenants(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createTenant({
        ...formData,
        totalUnits: parseInt(formData.totalUnits, 10),
      });
      setShowModal(false);
      setFormData({
        name: "",
        code: "",
        address: "",
        contactEmail: "",
        contactPhone: "",
        subscriptionPlan: "Standard SaaS",
        totalUnits: 24,
      });
      setToast({ type: "success", message: "Apartment complex onboarded successfully!" });
      setTimeout(() => setToast(null), 3500);
      loadTenants();
    } catch (err) {
      setToast({ type: "danger", message: "Failed to onboard complex: " + err.message });
      setTimeout(() => setToast(null), 3500);
    } finally {
      setSubmitting(false);
    }
  };

  const totalComplexes = tenants.length;
  const totalUnits = tenants.reduce((acc, t) => acc + (t.totalUnits || 0), 0);
  const totalOccupied = tenants.reduce((acc, t) => acc + (t.occupiedUnits || 0), 0);
  const avgOccupancy = totalUnits ? Math.round((totalOccupied / totalUnits) * 100) : 0;

  return (
    <div className="tenants-page" id="tenants-page">
      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: "8px",
            background: toast.type === "success" ? "#10b981" : "#ef4444",
            color: "#fff",
            fontWeight: 600,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Apartment Complexes & Multi-Tenancy</h1>
          <p>Super Admin control panel for property onboardings, tenant isolation, and complex directories.</p>
        </div>
        <button
          className="admin-btn admin-btn--primary"
          onClick={() => setShowModal(true)}
          id="btn-onboard-complex"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Onboard New Complex
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="tenant-stats-grid">
        <div className="tenant-stat-card">
          <div className="tenant-stat-icon tenant-stat-icon--blue">🏢</div>
          <div>
            <h3 className="tenant-stat-val">{totalComplexes}</h3>
            <p className="tenant-stat-lbl">Active Properties</p>
          </div>
        </div>

        <div className="tenant-stat-card">
          <div className="tenant-stat-icon tenant-stat-icon--purple">🚪</div>
          <div>
            <h3 className="tenant-stat-val">{totalUnits}</h3>
            <p className="tenant-stat-lbl">Total Managed Units</p>
          </div>
        </div>

        <div className="tenant-stat-card">
          <div className="tenant-stat-icon tenant-stat-icon--green">👥</div>
          <div>
            <h3 className="tenant-stat-val">{totalOccupied}</h3>
            <p className="tenant-stat-lbl">Occupied Residences</p>
          </div>
        </div>

        <div className="tenant-stat-card">
          <div className="tenant-stat-icon tenant-stat-icon--amber">📊</div>
          <div>
            <h3 className="tenant-stat-val">{avgOccupancy}%</h3>
            <p className="tenant-stat-lbl">Portfolio Occupancy</p>
          </div>
        </div>
      </div>

      {/* Complex Cards Grid */}
      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
        </div>
      ) : (
        <div className="complex-grid">
          {tenants.map((t) => {
            const occPct = t.totalUnits ? Math.round(((t.occupiedUnits || 0) / t.totalUnits) * 100) : 0;
            return (
              <div className="complex-card" key={t.id}>
                <div>
                  <div className="complex-card-header">
                    <span className="complex-code-badge">{t.code || `CMP-${t.id}`}</span>
                    <span className="badge badge--success">{t.status || "Active"}</span>
                  </div>

                  <h2 className="complex-title">{t.name}</h2>
                  <p className="complex-address">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {t.address}
                  </p>

                  <div className="complex-meta-list">
                    <div className="complex-meta-item">
                      <span>Subscription Plan:</span>
                      <span>{t.subscriptionPlan || "Standard SaaS"}</span>
                    </div>
                    <div className="complex-meta-item">
                      <span>Contact Email:</span>
                      <span>{t.contactEmail}</span>
                    </div>
                    <div className="complex-meta-item">
                      <span>Hotline:</span>
                      <span>{t.contactPhone}</span>
                    </div>
                  </div>

                  <div className="complex-occupancy-bar">
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b" }}>
                      <span>Occupancy Rate</span>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>{t.occupiedUnits || 0} / {t.totalUnits} Units ({occPct}%)</span>
                    </div>
                    <div className="occupancy-bar-track">
                      <div className="occupancy-bar-fill" style={{ width: `${occPct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="complex-card-actions">
                  <button className="admin-btn admin-btn--secondary admin-btn--sm" style={{ flex: 1 }}>
                    Building Directory
                  </button>
                  <button className="admin-btn admin-btn--primary admin-btn--sm" style={{ flex: 1 }}>
                    Manage Complex
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Onboard Complex Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px" }}>
            <h2>Onboard Apartment Complex (Tenant)</h2>
            <form onSubmit={handleCreateTenant}>
              <div className="form-group">
                <label>Complex / Property Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Royal Park Residencies"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label>Property Code *</label>
                  <input
                    type="text"
                    name="code"
                    required
                    placeholder="e.g. RPR-04"
                    value={formData.code}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Total Units *</label>
                  <input
                    type="number"
                    name="totalUnits"
                    required
                    min="1"
                    value={formData.totalUnits}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address *</label>
                <input
                  type="text"
                  name="address"
                  required
                  placeholder="e.g. Lake Drive, Rajagiriya"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label>Contact Email *</label>
                  <input
                    type="email"
                    name="contactEmail"
                    required
                    placeholder="admin@royalpark.lk"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Phone *</label>
                  <input
                    type="text"
                    name="contactPhone"
                    required
                    placeholder="+94 11 234 5678"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Subscription Tier</label>
                <select name="subscriptionPlan" value={formData.subscriptionPlan} onChange={handleInputChange}>
                  <option value="Standard SaaS">Standard SaaS (Up to 50 units)</option>
                  <option value="Enterprise B2B">Enterprise B2B (Unlimited units + AI features)</option>
                  <option value="Premium Tier">Premium Tier (Custom branding)</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary"
                  disabled={submitting}
                >
                  {submitting ? "Onboarding..." : "Confirm & Provision Complex"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
