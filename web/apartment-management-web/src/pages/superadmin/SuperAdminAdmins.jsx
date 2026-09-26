import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./SuperAdminLayout.css";

export default function SuperAdminAdmins() {
  const { complexes, complexAdmins, addComplexAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    complexId: complexes[0]?.id || 1,
  });

  const handleProvisionAdmin = (e) => {
    e.preventDefault();
    try {
      const selectedComplex = complexes.find((t) => t.id === Number(formData.complexId));
      if (!selectedComplex) {
        throw new Error("Please select an apartment complex.");
      }

      const newAdmin = addComplexAdmin({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        complexId: selectedComplex.id,
        complexName: selectedComplex.name,
      });

      setShowModal(false);
      setToast({
        type: "success",
        message: `Admin account provisioned for ${newAdmin.name} (${selectedComplex.name}).`,
      });
      setTimeout(() => setToast(null), 3500);

      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        complexId: complexes[0]?.id || 1,
      });
    } catch (err) {
      setToast({ type: "danger", message: err.message });
      setTimeout(() => setToast(null), 3500);
    }
  };

  return (
    <div id="super-admins-page">
      {toast && (
        <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 9999, padding: "12px 20px", borderRadius: "8px", background: "#0f172a", color: "#fff", fontWeight: 600, fontSize: "13px" }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="sa-page-header">
        <div>
          <p className="sa-page-tag">User Access & Credentials</p>
          <h1 className="sa-page-title">Apartment Administrator Accounts</h1>
          <p className="sa-page-desc">
            Provision and manage credentials for building managers authorized to access localized complex dashboards.
          </p>
        </div>
        <button className="sa-btn sa-btn--primary" onClick={() => setShowModal(true)}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.765z" />
          </svg>
          Provision Apartment Admin
        </button>
      </div>

      {/* Table */}
      <div className="sa-card">
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Admin Name</th>
                <th>Login Email</th>
                <th>Assigned Apartment Complex</th>
                <th>Contact Phone</th>
                <th>Role Scope</th>
                <th>Account Status</th>
                <th>Assigned Date</th>
              </tr>
            </thead>
            <tbody>
              {complexAdmins.map((admin) => (
                <tr key={admin.id}>
                  <td style={{ fontWeight: 600, color: "#0f172a" }}>{admin.name}</td>
                  <td>{admin.email}</td>
                  <td>
                    <span className="sa-chip sa-chip--indigo">
                      {admin.complexName}
                    </span>
                  </td>
                  <td style={{ color: "#64748b" }}>{admin.phone}</td>
                  <td><span className="sa-chip sa-chip--slate">ApartmentAdmin</span></td>
                  <td><span className="sa-chip sa-chip--green">{admin.status}</span></td>
                  <td style={{ color: "#94a3b8" }}>{admin.assignedAt || "2026-01-15"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Admin Modal */}
      {showModal && (
        <div className="sa-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Provision Building Administrator</h2>
            <p className="desc">Create manager credentials bound strictly to one apartment complex TenantId.</p>
            <form onSubmit={handleProvisionAdmin}>
              <div className="sa-form-group">
                <label>Target Apartment Complex *</label>
                <select
                  required
                  value={formData.complexId}
                  onChange={(e) => setFormData({ ...formData, complexId: e.target.value })}
                >
                  {complexes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code || `CMP-${t.id}`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sa-form-group">
                <label>Admin Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nimal Fernando"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="sa-form-group">
                  <label>Login Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="manager@complex.lk"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="sa-form-group">
                  <label>Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+94 77 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="sa-form-group">
                <label>Temporary Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Set initial password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                <button type="button" className="sa-btn sa-btn--secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="sa-btn sa-btn--primary">
                  Create Admin Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
