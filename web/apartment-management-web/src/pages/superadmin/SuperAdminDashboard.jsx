import { useState, useEffect } from "react";
import { getTenants, createTenant } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./SuperAdminDashboard.css";

export default function SuperAdminDashboard() {
  const { isSuperAdmin, complexAdmins, addComplexAdmin, switchUser } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComplexModal, setShowComplexModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Form state: Add Complex
  const [complexForm, setComplexForm] = useState({
    name: "",
    code: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    subscriptionPlan: "Enterprise B2B",
    totalUnits: 36,
  });

  // Form state: Provision Admin
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    complexId: "",
  });

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await getTenants();
      setTenants(data || []);
      if (data && data.length > 0 && !adminForm.complexId) {
        setAdminForm((prev) => ({ ...prev, complexId: data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleCreateComplex = async (e) => {
    e.preventDefault();
    try {
      const created = await createTenant({
        ...complexForm,
        totalUnits: parseInt(complexForm.totalUnits, 10),
      });
      setShowComplexModal(false);
      setToast({
        type: "success",
        message: `Apartment Complex '${created.name}' onboarded successfully! You can now assign an Admin to it.`,
      });
      setTimeout(() => setToast(null), 4000);
      setComplexForm({
        name: "",
        code: "",
        address: "",
        contactEmail: "",
        contactPhone: "",
        subscriptionPlan: "Enterprise B2B",
        totalUnits: 36,
      });
      loadTenants();
    } catch (err) {
      setToast({ type: "danger", message: err.message });
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleProvisionAdmin = (e) => {
    e.preventDefault();
    try {
      const selectedComplex = tenants.find((t) => t.id === Number(adminForm.complexId));
      if (!selectedComplex) {
        throw new Error("Please select a valid apartment complex.");
      }

      const newAdmin = addComplexAdmin({
        name: adminForm.name,
        email: adminForm.email,
        phone: adminForm.phone,
        complexId: selectedComplex.id,
        complexName: selectedComplex.name,
      });

      setShowAdminModal(false);
      setToast({
        type: "success",
        message: `Apartment Admin credentials provisioned for ${newAdmin.name} (${selectedComplex.name})!`,
      });
      setTimeout(() => setToast(null), 4000);
      setAdminForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        complexId: tenants[0]?.id || "",
      });
    } catch (err) {
      setToast({ type: "danger", message: err.message });
      setTimeout(() => setToast(null), 4000);
    }
  };

  // If unauthorized user visits
  if (!isSuperAdmin) {
    return (
      <div className="admin-card" style={{ textAlign: "center", padding: "60px 24px", margin: "40px auto", maxWidth: "600px" }}>
        <div style={{ fontSize: "54px", marginBottom: "16px" }}>🔒</div>
        <h2 style={{ fontSize: "24px", color: "#0f172a", margin: "0 0 8px" }}>Access Restricted to Platform Owner</h2>
        <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
          Only authorized <strong>Super Admins (Website / Platform Owners)</strong> have permission to onboard apartment complexes and provision building administrator credentials.
        </p>
        <button
          className="admin-btn admin-btn--primary"
          onClick={() => switchUser("user-super-1")}
        >
          👑 Switch to Super Admin Account
        </button>
      </div>
    );
  }

  return (
    <div className="super-admin-page" id="super-admin-page">
      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            padding: "14px 22px",
            borderRadius: "10px",
            background: toast.type === "success" ? "#10b981" : "#ef4444",
            color: "#fff",
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Hero Header */}
      <div className="super-admin-hero">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span className="role-tag-super">👑 Super Admin Master Console</span>
            <span style={{ fontSize: "12px", color: "#a5b4fc" }}>Multi-Tenant SaaS Governance</span>
          </div>
          <h1>Platform Property & Admin Provisioning</h1>
          <p>
            Onboard new apartment complexes and create dedicated Apartment Administrator accounts to manage units, residents, and gate operations.
          </p>
        </div>

        <div className="super-admin-actions">
          <button
            className="admin-btn admin-btn--primary"
            onClick={() => setShowComplexModal(true)}
            id="btn-super-onboard-complex"
            style={{ background: "#6366f1", color: "#fff" }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            1. Add Apartment Complex
          </button>

          <button
            className="admin-btn admin-btn--success"
            onClick={() => setShowAdminModal(true)}
            id="btn-super-assign-admin"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            2. Assign Apartment Admin
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="tenant-stats-grid">
        <div className="tenant-stat-card">
          <div className="tenant-stat-icon tenant-stat-icon--blue">🏢</div>
          <div>
            <h3 className="tenant-stat-val">{tenants.length}</h3>
            <p className="tenant-stat-lbl">Onboarded Complexes</p>
          </div>
        </div>

        <div className="tenant-stat-card">
          <div className="tenant-stat-icon tenant-stat-icon--purple">👤</div>
          <div>
            <h3 className="tenant-stat-val">{complexAdmins.length}</h3>
            <p className="tenant-stat-lbl">Assigned Apartment Admins</p>
          </div>
        </div>

        <div className="tenant-stat-card">
          <div className="tenant-stat-icon tenant-stat-icon--green">🚪</div>
          <div>
            <h3 className="tenant-stat-val">{tenants.reduce((acc, t) => acc + (t.totalUnits || 0), 0)}</h3>
            <p className="tenant-stat-lbl">Total Managed Units</p>
          </div>
        </div>

        <div className="tenant-stat-card">
          <div className="tenant-stat-icon tenant-stat-icon--amber">🛡️</div>
          <div>
            <h3 className="tenant-stat-val">100%</h3>
            <p className="tenant-stat-lbl">Tenant Data Isolation</p>
          </div>
        </div>
      </div>

      {/* Section 1: Registered Apartment Complexes & Assigned Admins */}
      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Apartment Complexes & Assigned Building Managers</h3>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
              Each apartment complex operates inside its own isolated TenantId environment.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">
            <div className="spinner" />
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Complex Code</th>
                  <th>Property / Complex Name</th>
                  <th>Address & Location</th>
                  <th>Assigned Apartment Admin</th>
                  <th>Capacity</th>
                  <th>Subscription Tier</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => {
                  const assigned = complexAdmins.find((a) => a.complexId === t.id);
                  return (
                    <tr key={t.id}>
                      <td>
                        <span className="complex-code-badge">{t.code || `CMP-${t.id}`}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: "#0f172a" }}>{t.name}</td>
                      <td style={{ fontSize: "13px", color: "#475569" }}>{t.address}</td>
                      <td>
                        {assigned ? (
                          <div>
                            <div style={{ fontWeight: 600, color: "#1e293b" }}>{assigned.name}</div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{assigned.email}</div>
                          </div>
                        ) : (
                          <span style={{ color: "#d97706", fontStyle: "italic", fontSize: "12px" }}>
                            ⚠️ No Admin Assigned
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{t.totalUnits} Units</span>
                      </td>
                      <td>
                        <span className="badge badge--info">{t.subscriptionPlan || "Standard SaaS"}</span>
                      </td>
                      <td>
                        <span className="badge badge--success">{t.status || "Active"}</span>
                      </td>
                      <td>
                        <button
                          className="admin-btn admin-btn--secondary admin-btn--sm"
                          onClick={() => {
                            setAdminForm((prev) => ({ ...prev, complexId: t.id }));
                            setShowAdminModal(true);
                          }}
                        >
                          {assigned ? "Re-assign Admin" : "+ Assign Admin"}
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

      {/* Section 2: Provisioned Apartment Admin Accounts */}
      <div className="admin-card">
        <h3 style={{ margin: "0 0 14px", fontSize: "18px", color: "#0f172a" }}>Active Apartment Administrator Directory</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Admin Name</th>
                <th>Login Email</th>
                <th>Assigned Apartment Complex</th>
                <th>Phone Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Simulation Switch</th>
              </tr>
            </thead>
            <tbody>
              {complexAdmins.map((admin) => (
                <tr key={admin.id}>
                  <td style={{ fontWeight: 600, color: "#0f172a" }}>{admin.name}</td>
                  <td>{admin.email}</td>
                  <td>
                    <span className="admin-assign-badge">🏢 {admin.complexName}</span>
                  </td>
                  <td>{admin.phone}</td>
                  <td>
                    <span className="badge badge--neutral">ApartmentAdmin</span>
                  </td>
                  <td>
                    <span className="badge badge--success">{admin.status}</span>
                  </td>
                  <td>
                    <button
                      className="admin-btn admin-btn--primary admin-btn--sm"
                      onClick={() => {
                        // Switch session to this apartment admin
                        const targetUser = {
                          id: admin.id,
                          name: admin.name,
                          email: admin.email,
                          role: "ApartmentAdmin",
                          roleLabel: `Apartment Admin (${admin.complexName})`,
                          tenantId: admin.complexId,
                          complexName: admin.complexName,
                          avatar: admin.name.slice(0, 2).toUpperCase(),
                        };
                        switchUser(targetUser.id);
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

      {/* Modal 1: Onboard New Apartment Complex */}
      {showComplexModal && (
        <div className="modal-overlay" onClick={() => setShowComplexModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px" }}>
            <h2>Onboard New Apartment Complex</h2>
            <form onSubmit={handleCreateComplex}>
              <div className="form-group">
                <label>Complex / Condominium Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Palms Residencies"
                  value={complexForm.name}
                  onChange={(e) => setComplexForm({ ...complexForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label>Property Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RPR-05"
                    value={complexForm.code}
                    onChange={(e) => setComplexForm({ ...complexForm, code: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Total Units *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={complexForm.totalUnits}
                    onChange={(e) => setComplexForm({ ...complexForm, totalUnits: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. No. 12, Havelock Road, Colombo 05"
                  value={complexForm.address}
                  onChange={(e) => setComplexForm({ ...complexForm, address: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label>Contact Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@royalpalms.lk"
                    value={complexForm.contactEmail}
                    onChange={(e) => setComplexForm({ ...complexForm, contactEmail: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+94 11 234 5678"
                    value={complexForm.contactPhone}
                    onChange={(e) => setComplexForm({ ...complexForm, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Subscription Tier</label>
                <select
                  value={complexForm.subscriptionPlan}
                  onChange={(e) => setComplexForm({ ...complexForm, subscriptionPlan: e.target.value })}
                >
                  <option value="Standard SaaS">Standard SaaS (Up to 50 units)</option>
                  <option value="Enterprise B2B">Enterprise B2B (Unlimited units + AI features)</option>
                  <option value="Premium Tier">Premium Tier (Custom Branding)</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={() => setShowComplexModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary">
                  Provision Complex
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Provision & Assign Apartment Admin */}
      {showAdminModal && (
        <div className="modal-overlay" onClick={() => setShowAdminModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px" }}>
            <h2>Provision Apartment Administrator</h2>
            <form onSubmit={handleProvisionAdmin}>
              <div className="form-group">
                <label>Assign to Apartment Complex *</label>
                <select
                  required
                  value={adminForm.complexId}
                  onChange={(e) => setAdminForm({ ...adminForm, complexId: e.target.value })}
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code || `CMP-${t.id}`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Admin Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samantha Rathnayake"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label>Login Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="samantha@building.lk"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+94 77 999 1234"
                    value={adminForm.phone}
                    onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Temporary Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter initial password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={() => setShowAdminModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--success">
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
