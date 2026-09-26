import { useState, useEffect } from "react";
import { getTenants } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./SuperAdminDashboard.css";

export default function SuperAdminAdmins() {
  const { complexAdmins, addComplexAdmin, switchUser } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    complexId: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await getTenants();
        setTenants(data || []);
        if (data && data.length > 0) {
          setFormData((prev) => ({ ...prev, complexId: data[0].id }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleProvisionAdmin = (e) => {
    e.preventDefault();
    try {
      const selectedComplex = tenants.find((t) => t.id === Number(formData.complexId));
      if (!selectedComplex) {
        throw new Error("Please select an apartment complex.");
      }

      const newAdmin = addComplexAdmin({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        complexId: selectedComplex.id,
        complexName: selectedComplex.name,
      });

      setShowModal(false);
      setToast({
        type: "success",
        message: `Admin credentials provisioned for ${newAdmin.name} (${selectedComplex.name})!`,
      });
      setTimeout(() => setToast(null), 3500);

      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        complexId: tenants[0]?.id || "",
      });
    } catch (err) {
      setToast({ type: "danger", message: err.message });
      setTimeout(() => setToast(null), 3500);
    }
  };

  return (
    <div className="super-admin-page" id="super-admins-page">
      {toast && (
        <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 9999, padding: "12px 20px", borderRadius: "8px", background: toast.type === "success" ? "#10b981" : "#ef4444", color: "#fff", fontWeight: 600 }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>
            Apartment Administrator Accounts & Privileges
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
            Create and assign building manager credentials restricted to specific apartment complex TenantIds.
          </p>
        </div>
        <button className="super-btn super-btn--success" onClick={() => setShowModal(true)}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Provision Apartment Admin
        </button>
      </div>

      {/* Table */}
      <div className="super-card">
        <div className="super-table-wrap">
          <table className="super-table">
            <thead>
              <tr>
                <th>Admin Name</th>
                <th>Login Email</th>
                <th>Assigned Apartment Complex</th>
                <th>Contact Phone</th>
                <th>Role Scope</th>
                <th>Status</th>
                <th>Assigned Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {complexAdmins.map((admin) => (
                <tr key={admin.id}>
                  <td style={{ fontWeight: 700, color: "#fff" }}>{admin.name}</td>
                  <td>{admin.email}</td>
                  <td>
                    <span className="admin-assign-badge">🏢 {admin.complexName}</span>
                  </td>
                  <td>{admin.phone}</td>
                  <td><span className="super-badge super-badge--indigo">ApartmentAdmin</span></td>
                  <td><span className="super-badge super-badge--active">{admin.status}</span></td>
                  <td style={{ color: "#94a3b8" }}>{admin.assignedAt || "2026-01-15"}</td>
                  <td>
                    <button
                      className="super-btn super-btn--primary super-btn--sm"
                      onClick={() => {
                        switchUser(admin.id);
                      }}
                    >
                      Login As Admin ➔
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Admin Modal */}
      {showModal && (
        <div className="super-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="super-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Provision Apartment Administrator</h2>
            <form onSubmit={handleProvisionAdmin}>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Target Apartment Complex *</label>
                <select
                  required
                  value={formData.complexId}
                  onChange={(e) => setFormData({ ...formData, complexId: e.target.value })}
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code || `CMP-${t.id}`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Admin Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nimal Fernando"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div className="form-group">
                  <label>Login Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="manager@building.lk"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
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

              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label>Initial Temporary Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter initial password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="super-btn super-btn--secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="super-btn super-btn--success">
                  Create & Assign Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
