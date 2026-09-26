import { useState, useEffect, useCallback } from "react";
import { getDomesticStaff, getResidents, createDomesticStaff, toggleStaffAccess } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./DomesticStaff.css";

export default function DomesticStaff() {
  const { activeTenantId, activeComplexName } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    residentId: "",
    fullName: "",
    staffType: "Housekeeper / Maid",
    nicNumber: "",
    contactPhone: "",
    workingHours: "08:00 AM - 05:00 PM (Mon-Fri)",
  });

  const loadData = useCallback(async () => {
  try {
    setLoading(true);
    const [sList, rList] = await Promise.all([
      getDomesticStaff(activeTenantId),
      getResidents(activeTenantId),
    ]);
    setStaffList(sList || []);
    setResidents(rList || []);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}, [activeTenantId]);

  useEffect(() => {
  const timer = setTimeout(() => {
    loadData();
  }, 0);

  return () => clearTimeout(timer);
}, [loadData]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    try {
      const selectedRes = residents.find((r) => r.id === Number(formData.residentId));
      await createDomesticStaff({
        tenantId: activeTenantId,
        residentId: Number(formData.residentId),
        residentName: selectedRes ? selectedRes.fullName : "Resident",
        unitNumber: selectedRes ? selectedRes.unitNumber : "100",
        fullName: formData.fullName,
        staffType: formData.staffType,
        nicNumber: formData.nicNumber,
        contactPhone: formData.contactPhone,
        workingHours: formData.workingHours,
      });

      setShowModal(false);
      setToast({ type: "success", message: `Digital access pass issued for ${formData.fullName} in ${activeComplexName}!` });
      setTimeout(() => setToast(null), 3500);

      setFormData({
        residentId: "",
        fullName: "",
        staffType: "Housekeeper / Maid",
        nicNumber: "",
        contactPhone: "",
        workingHours: "08:00 AM - 05:00 PM (Mon-Fri)",
      });
      loadData();
    } catch (err) {
      setToast({ type: "danger", message: err.message });
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleToggleAccess = async (id, name, currentStatus) => {
    try {
      await toggleStaffAccess(id);
      setToast({
        type: currentStatus ? "danger" : "success",
        message: `Access permissions for ${name} ${currentStatus ? "revoked" : "re-activated"}!`,
      });
      setTimeout(() => setToast(null), 3500);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    return (
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.staffType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.accessPassCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.unitNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="staff-page" id="staff-page">
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
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "12px", background: "#ede9fe", color: "#6d28d9", fontWeight: 700, padding: "2px 8px", borderRadius: "6px" }}>
              🏢 {activeComplexName}
            </span>
          </div>
          <h1>Domestic Staff Registry & Security Passes</h1>
          <p>Apartment Manager portal for issuing and revoking digital gate passes for in-unit domestic personnel.</p>
        </div>
        <button
          className="admin-btn admin-btn--primary"
          onClick={() => setShowModal(true)}
          id="btn-add-staff"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Issue Staff Pass ({activeComplexName})
        </button>
      </div>

      {/* Search Bar */}
      <div className="units-filter-bar">
        <div className="search-input-wrap">
          <svg className="search-input-icon" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by staff name, employer resident, unit, pass code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "#64748b", margin: 0 }}>No domestic staff records found for {activeComplexName}.</p>
        </div>
      ) : (
        <div className="admin-card admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Role / Staff Type</th>
                <th>Employer Resident</th>
                <th>Unit #</th>
                <th>NIC Number</th>
                <th>Access Pass Code</th>
                <th>Working Hours</th>
                <th>Access Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600, color: "#0f172a" }}>{s.fullName}</td>
                  <td>
                    <span className="badge badge--info">{s.staffType}</span>
                  </td>
                  <td>{s.residentName}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: "#4f46e5" }}>Unit {s.unitNumber}</span>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{s.nicNumber}</td>
                  <td>
                    <span className="pass-code-tag">🔑 {s.accessPassCode}</span>
                  </td>
                  <td style={{ fontSize: "12px", color: "#64748b" }}>{s.workingHours}</td>
                  <td>
                    <span className={`badge ${s.isActive ? "badge--success" : "badge--danger"}`}>
                      {s.isActive ? "Access Granted" : "Revoked"}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`admin-btn admin-btn--sm ${s.isActive ? "admin-btn--danger" : "admin-btn--success"}`}
                      onClick={() => handleToggleAccess(s.id, s.fullName, s.isActive)}
                    >
                      {s.isActive ? "Revoke Access" : "Grant Access"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Issue Pass Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px" }}>
            <h2>Issue Domestic Staff Access Pass ({activeComplexName})</h2>
            <form onSubmit={handleRegisterStaff}>
              <div className="form-group">
                <label>Employer Resident *</label>
                <select name="residentId" required value={formData.residentId} onChange={handleInputChange}>
                  <option value="">-- Choose Resident in {activeComplexName} --</option>
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.fullName} (Unit {r.unitNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label>Staff Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="e.g. Nalani Kumari"
                    value={formData.fullName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Staff Role *</label>
                  <select name="staffType" value={formData.staffType} onChange={handleInputChange}>
                    <option value="Housekeeper / Maid">Housekeeper / Maid</option>
                    <option value="Chauffeur / Driver">Chauffeur / Driver</option>
                    <option value="Chef / Cook">Chef / Cook</option>
                    <option value="Nanny / Caretaker">Nanny / Caretaker</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label>National ID (NIC) *</label>
                  <input
                    type="text"
                    name="nicNumber"
                    required
                    placeholder="e.g. 197855667788"
                    value={formData.nicNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="text"
                    name="contactPhone"
                    placeholder="+94 77 908 1122"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Authorized Access Schedule</label>
                <input
                  type="text"
                  name="workingHours"
                  placeholder="e.g. 08:00 AM - 05:00 PM (Mon-Fri)"
                  value={formData.workingHours}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary">
                  Generate Digital Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
