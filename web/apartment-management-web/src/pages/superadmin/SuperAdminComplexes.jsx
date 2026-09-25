import { useState, useEffect } from "react";
import { getTenants, createTenant } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./SuperAdminDashboard.css";

export default function SuperAdminComplexes() {
  const { complexAdmins } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    subscriptionPlan: "Enterprise B2B",
    totalUnits: 48,
  });

  const loadData = async () => {
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
    loadData();
  }, []);

  const handleCreateComplex = async (e) => {
    e.preventDefault();
    try {
      const created = await createTenant({
        ...formData,
        totalUnits: parseInt(formData.totalUnits, 10),
      });
      setShowModal(false);
      setToast({ type: "success", message: `Complex '${created.name}' onboarded successfully!` });
      setTimeout(() => setToast(null), 3500);
      setFormData({
        name: "",
        code: "",
        address: "",
        contactEmail: "",
        contactPhone: "",
        subscriptionPlan: "Enterprise B2B",
        totalUnits: 48,
      });
      loadData();
    } catch (err) {
      setToast({ type: "danger", message: err.message });
      setTimeout(() => setToast(null), 3500);
    }
  };

  return (
    <div className="super-admin-page" id="super-complexes-page">
      {/* Toast Alert */}
      {toast && (
        <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 9999, padding: "12px 20px", borderRadius: "8px", background: toast.type === "success" ? "#10b981" : "#ef4444", color: "#fff", fontWeight: 600 }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>
            Apartment Complexes Directory & Provisioning
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
            Onboard new condominium properties into the platform and define isolated TenantId boundaries.
          </p>
        </div>
        <button className="super-btn super-btn--primary" onClick={() => setShowModal(true)}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Onboard New Apartment Complex
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-loading"><div className="spinner" /></div>
      ) : (
        <div className="super-card">
          <div className="super-table-wrap">
            <table className="super-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Complex Name</th>
                  <th>Address & Location</th>
                  <th>Contact Email</th>
                  <th>Hotline Phone</th>
                  <th>Capacity</th>
                  <th>Assigned Manager</th>
                  <th>Subscription Tier</th>
                  <th>Status</th>
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
                      <td>{t.contactEmail}</td>
                      <td>{t.contactPhone}</td>
                      <td style={{ fontWeight: 600 }}>{t.totalUnits} Units</td>
                      <td>
                        {assigned ? (
                          <span style={{ color: "#34d399", fontWeight: 600 }}>{assigned.name}</span>
                        ) : (
                          <span style={{ color: "#fbbf24" }}>⚠️ Unassigned</span>
                        )}
                      </td>
                      <td><span className="super-badge super-badge--indigo">{t.subscriptionPlan || "Standard SaaS"}</span></td>
                      <td><span className="super-badge super-badge--active">{t.status || "Active"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onboard Modal */}
      {showModal && (
        <div className="super-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="super-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Onboard New Apartment Complex</h2>
            <form onSubmit={handleCreateComplex}>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Complex / Condominium Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lotus Grand Residencies"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div className="form-group">
                  <label>Property Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LGR-01"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Total Units *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.totalUnits}
                    onChange={(e) => setFormData({ ...formData, totalUnits: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. No. 45, Alfred House Gardens, Colombo 03"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div className="form-group">
                  <label>Contact Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="management@complex.lk"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+94 11 258 9630"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label>SaaS Subscription Tier</label>
                <select
                  value={formData.subscriptionPlan}
                  onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value })}
                >
                  <option value="Standard SaaS">Standard SaaS (Up to 50 units)</option>
                  <option value="Enterprise B2B">Enterprise B2B (Unlimited units + AI features)</option>
                  <option value="Premium Tier">Premium Tier (Custom Branding)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="super-btn super-btn--secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="super-btn super-btn--primary">
                  Confirm Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
