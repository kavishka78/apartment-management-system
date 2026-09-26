import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { PLATFORM_MODULES, SUBSCRIPTION_TIERS } from "../../context/authConstants.js";
import "./SuperAdminLayout.css";

export default function SuperAdminComplexes() {
  const { complexes, complexAdmins, addComplex, updateComplexPackage } = useAuth();
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [editingComplex, setEditingComplex] = useState(null);
  const [toast, setToast] = useState(null);

  // New Complex Form
  const [onboardForm, setOnboardForm] = useState({
    name: "",
    code: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    subscriptionPlan: "Enterprise Suite",
    totalUnits: 48,
    enabledModules: SUBSCRIPTION_TIERS["Enterprise Suite"].modules,
  });

  // Edit Package Form
  const [packageForm, setPackageForm] = useState({
    subscriptionPlan: "Enterprise Suite",
    enabledModules: [],
  });

  const handlePlanChange = (planName, isEditing = false) => {
    const tier = SUBSCRIPTION_TIERS[planName];
    if (!tier) return;
    if (isEditing) {
      setPackageForm({
        subscriptionPlan: planName,
        enabledModules: [...tier.modules],
      });
    } else {
      setOnboardForm((prev) => ({
        ...prev,
        subscriptionPlan: planName,
        enabledModules: [...tier.modules],
      }));
    }
  };

  const handleModuleToggle = (moduleKey, isEditing = false) => {
    if (isEditing) {
      setPackageForm((prev) => {
        const exists = prev.enabledModules.includes(moduleKey);
        return {
          ...prev,
          enabledModules: exists
            ? prev.enabledModules.filter((m) => m !== moduleKey)
            : [...prev.enabledModules, moduleKey],
        };
      });
    } else {
      setOnboardForm((prev) => {
        const exists = prev.enabledModules.includes(moduleKey);
        return {
          ...prev,
          enabledModules: exists
            ? prev.enabledModules.filter((m) => m !== moduleKey)
            : [...prev.enabledModules, moduleKey],
        };
      });
    }
  };

  const handleCreateComplex = (e) => {
    e.preventDefault();
    try {
      const created = addComplex(onboardForm);
      setShowOnboardModal(false);
      setToast({ type: "success", message: `Complex '${created.name}' onboarded with ${onboardForm.enabledModules.length} enabled modules.` });
      setTimeout(() => setToast(null), 3500);
      setOnboardForm({
        name: "",
        code: "",
        address: "",
        contactEmail: "",
        contactPhone: "",
        subscriptionPlan: "Enterprise Suite",
        totalUnits: 48,
        enabledModules: SUBSCRIPTION_TIERS["Enterprise Suite"].modules,
      });
    } catch (err) {
      setToast({ type: "danger", message: err.message });
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleOpenConfig = (complex) => {
    setEditingComplex(complex);
    setPackageForm({
      subscriptionPlan: complex.subscriptionPlan,
      enabledModules: complex.enabledModules ? [...complex.enabledModules] : [...SUBSCRIPTION_TIERS["Enterprise Suite"].modules],
    });
  };

  const handleSavePackageConfig = (e) => {
    e.preventDefault();
    if (!editingComplex) return;
    updateComplexPackage(editingComplex.id, packageForm.subscriptionPlan, packageForm.enabledModules);
    setEditingComplex(null);
    setToast({
      type: "success",
      message: `Package & module permissions updated for '${editingComplex.name}'!`,
    });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div id="super-complexes-page">
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: "8px",
            background: toast.type === "success" ? "#0f172a" : "#dc2626",
            color: "#fff",
            fontWeight: 600,
            fontSize: "13px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="sa-page-header">
        <div>
          <p className="sa-page-tag">Property Directory & Entitlements</p>
          <h1 className="sa-page-title">Apartment Complexes & Module Access</h1>
          <p className="sa-page-desc">
            Onboard new properties and configure which software modules each apartment admin can access based on their subscription tier.
          </p>
        </div>
        <button className="sa-btn sa-btn--primary" onClick={() => setShowOnboardModal(true)}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Onboard Apartment Complex
        </button>
      </div>

      {/* Table */}
      <div className="sa-card">
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Complex Name</th>
                <th>Address</th>
                <th>Capacity</th>
                <th>Assigned Building Admin</th>
                <th>Package Tier</th>
                <th>Enabled Modules</th>
                <th>Status</th>
                <th>Actions</th>
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
                    <td>{c.totalUnits} Units</td>
                    <td>
                      {admin ? (
                        <span style={{ fontWeight: 500, color: "#0f172a" }}>{admin.name}</span>
                      ) : (
                        <span style={{ color: "#b45309", fontSize: "12px" }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      <span className="sa-chip sa-chip--indigo">
                        {c.subscriptionPlan}
                      </span>
                    </td>
                    <td>
                      <span className="sa-chip sa-chip--slate">
                        {(c.enabledModules || []).length} of {PLATFORM_MODULES.length} Active
                      </span>
                    </td>
                    <td>
                      <span className="sa-chip sa-chip--green">
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="sa-btn sa-btn--secondary sa-btn--sm"
                        onClick={() => handleOpenConfig(c)}
                      >
                        Configure Access
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Onboard New Complex */}
      {showOnboardModal && (
        <div className="sa-modal-overlay" onClick={() => setShowOnboardModal(false)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "580px" }}>
            <h2>Onboard New Apartment Complex</h2>
            <p className="desc">Register a new property and select its initial software module package.</p>
            <form onSubmit={handleCreateComplex}>
              <div className="sa-form-group">
                <label>Property Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Victoria Bay Residencies"
                  value={onboardForm.name}
                  onChange={(e) => setOnboardForm({ ...onboardForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="sa-form-group">
                  <label>Property Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VBR-04"
                    value={onboardForm.code}
                    onChange={(e) => setOnboardForm({ ...onboardForm, code: e.target.value })}
                  />
                </div>
                <div className="sa-form-group">
                  <label>Total Unit Count *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={onboardForm.totalUnits}
                    onChange={(e) => setOnboardForm({ ...onboardForm, totalUnits: e.target.value })}
                  />
                </div>
              </div>

              <div className="sa-form-group">
                <label>Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. No. 18, Marine Drive, Colombo 03"
                  value={onboardForm.address}
                  onChange={(e) => setOnboardForm({ ...onboardForm, address: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="sa-form-group">
                  <label>Contact Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@property.lk"
                    value={onboardForm.contactEmail}
                    onChange={(e) => setOnboardForm({ ...onboardForm, contactEmail: e.target.value })}
                  />
                </div>
                <div className="sa-form-group">
                  <label>Contact Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+94 11 234 5678"
                    value={onboardForm.contactPhone}
                    onChange={(e) => setOnboardForm({ ...onboardForm, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="sa-form-group">
                <label>SaaS Subscription Package *</label>
                <select
                  value={onboardForm.subscriptionPlan}
                  onChange={(e) => handlePlanChange(e.target.value, false)}
                >
                  {Object.keys(SUBSCRIPTION_TIERS).map((tierKey) => (
                    <option key={tierKey} value={tierKey}>
                      {tierKey} (LKR {SUBSCRIPTION_TIERS[tierKey].priceLkr.toLocaleString()} / mo)
                    </option>
                  ))}
                </select>
              </div>

              {/* Module Feature Checkbox Matrix */}
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px", background: "#f8fafc", marginBottom: "20px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", margin: "0 0 10px" }}>
                  ENABLED SOFTWARE MODULES FOR APARTMENT ADMIN
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {PLATFORM_MODULES.map((mod) => {
                    const isChecked = onboardForm.enabledModules.includes(mod.key);
                    return (
                      <label
                        key={mod.key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "12px",
                          color: "#334155",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleModuleToggle(mod.key, false)}
                        />
                        {mod.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="sa-btn sa-btn--secondary" onClick={() => setShowOnboardModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="sa-btn sa-btn--primary">
                  Provision Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Configure Package & Modules */}
      {editingComplex && (
        <div className="sa-modal-overlay" onClick={() => setEditingComplex(null)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px" }}>
            <h2>Configure Access: {editingComplex.name}</h2>
            <p className="desc">Grant or restrict module access in the Apartment Admin dashboard.</p>
            <form onSubmit={handleSavePackageConfig}>
              <div className="sa-form-group">
                <label>Change Package Tier</label>
                <select
                  value={packageForm.subscriptionPlan}
                  onChange={(e) => handlePlanChange(e.target.value, true)}
                >
                  {Object.keys(SUBSCRIPTION_TIERS).map((tierKey) => (
                    <option key={tierKey} value={tierKey}>
                      {tierKey} (LKR {SUBSCRIPTION_TIERS[tierKey].priceLkr.toLocaleString()} / mo)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px", background: "#f8fafc", marginBottom: "20px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", margin: "0 0 10px" }}>
                  ADMIN SIDEBAR PERMISSION TOGGLES
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {PLATFORM_MODULES.map((mod) => {
                    const isChecked = packageForm.enabledModules.includes(mod.key);
                    return (
                      <label
                        key={mod.key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "12px",
                          color: "#334155",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleModuleToggle(mod.key, true)}
                        />
                        {mod.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="sa-btn sa-btn--secondary" onClick={() => setEditingComplex(null)}>
                  Cancel
                </button>
                <button type="submit" className="sa-btn sa-btn--primary">
                  Save Entitlements
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
