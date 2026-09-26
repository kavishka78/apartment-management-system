import { useState, useEffect } from "react";
import { getResidents, getUnits, onboardResident } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./Residents.css";

export default function Residents() {
  const { activeTenantId, activeComplexName } = useAuth();
  const [residents, setResidents] = useState([]);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Onboard form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    nationalId: "",
    unitId: "",
    monthlyIncome: 350000,
    emergencyContact: "",
    moveInDate: new Date().toISOString().split("T")[0],
    plateNumber: "",
    vehicleType: "Car",
    makeModel: "",
    parkingSlot: "",
    familyMembersText: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [resList, unitList] = await Promise.all([
        getResidents(activeTenantId),
        getUnits(activeTenantId),
      ]);
      setResidents(resList || []);
      setAvailableUnits((unitList || []).filter((u) => u.status === "Available"));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTenantId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selectedUnit = availableUnits.find((u) => u.id === Number(formData.unitId));

      // Parse household members
      const household = formData.familyMembersText
        ? formData.familyMembersText.split("\n").filter(Boolean).map((line) => {
            const parts = line.split("-");
            return {
              name: parts[0]?.trim() || line,
              relation: parts[1]?.trim() || "Family Member",
              age: parts[2]?.trim() || "N/A",
            };
          })
        : [];

      await onboardResident({
        tenantId: activeTenantId,
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        nationalId: formData.nationalId,
        unitId: formData.unitId ? Number(formData.unitId) : null,
        unitNumber: selectedUnit ? selectedUnit.unitNumber : "Unassigned",
        monthlyIncome: parseFloat(formData.monthlyIncome),
        emergencyContact: formData.emergencyContact,
        moveInDate: formData.moveInDate,
        plateNumber: formData.plateNumber,
        vehicleType: formData.vehicleType,
        makeModel: formData.makeModel,
        parkingSlot: formData.parkingSlot || selectedUnit?.parkingSlot || "P-Unassigned",
        householdMembers: household,
      });

      setShowOnboardModal(false);
      setToast({ type: "success", message: `Resident ${formData.fullName} successfully onboarded to ${activeComplexName}!` });
      setTimeout(() => setToast(null), 3500);

      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phoneNumber: "",
        nationalId: "",
        unitId: "",
        monthlyIncome: 350000,
        emergencyContact: "",
        moveInDate: new Date().toISOString().split("T")[0],
        plateNumber: "",
        vehicleType: "Car",
        makeModel: "",
        parkingSlot: "",
        familyMembersText: "",
      });

      loadData();
    } catch (err) {
      setToast({ type: "danger", message: err.message });
      setTimeout(() => setToast(null), 3500);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredResidents = residents.filter((r) => {
    const matchesSearch =
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.nationalId && r.nationalId.includes(searchTerm)) ||
      (r.unitNumber && r.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getInitials = (name) => {
    if (!name) return "R";
    const parts = name.split(" ");
    return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="residents-page" id="residents-page">
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
            background: toast.type === "success" ? "#0f172a" : "#dc2626",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "11px", background: "#f1f5f9", color: "#334155", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {activeComplexName}
            </span>
          </div>
          <h1>Resident Master Registry & Household Directory</h1>
          <p>Apartment Manager portal for onboarding tenants, assigning available units, emergency contacts, and household members.</p>
        </div>
        <button
          className="admin-btn admin-btn--primary"
          onClick={() => setShowOnboardModal(true)}
          id="btn-onboard-resident"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Onboard Resident to {activeComplexName}
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="resident-filter-bar">
        <div className="search-input-wrap">
          <svg className="search-input-icon" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, NIC, unit, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
        >
          <option value="All">All Resident Statuses</option>
          <option value="Active">Active Residents</option>
          <option value="PendingVerification">Pending Verification</option>
          <option value="MovedOut">Moved Out</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
        </div>
      ) : filteredResidents.length === 0 ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "#64748b", margin: 0 }}>No resident records found for {activeComplexName}.</p>
        </div>
      ) : (
        <div className="admin-card admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Resident</th>
                <th>Assigned Unit</th>
                <th>NIC / Passport</th>
                <th>Phone Number</th>
                <th>Household</th>
                <th>Vehicles</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResidents.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div className="resident-avatar">{getInitials(r.fullName)}</div>
                      <div>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{r.fullName}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{r.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: "#4f46e5" }}>Unit {r.unitNumber || "Unassigned"}</span>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{r.nationalId}</td>
                  <td>{r.phoneNumber}</td>
                  <td>
                    <span className="badge badge--neutral">
                      {(r.householdMembers?.length || 0) + 1} Person(s)
                    </span>
                  </td>
                  <td>
                    <span className="badge badge--neutral">{r.vehiclesCount || 0} Vehicle(s)</span>
                  </td>
                  <td>
                    <span className={`badge ${r.status === "Active" ? "badge--success" : "badge--warning"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="admin-btn admin-btn--secondary admin-btn--sm"
                      onClick={() => setSelectedResident(r)}
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resident Detail Profile Drawer */}
      {selectedResident && (
        <div className="resident-drawer-overlay" onClick={() => setSelectedResident(null)}>
          <div className="resident-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="resident-avatar" style={{ width: "46px", height: "46px", fontSize: "16px" }}>
                  {getInitials(selectedResident.fullName)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>{selectedResident.fullName}</h3>
                  <span className={`badge ${selectedResident.status === "Active" ? "badge--success" : "badge--warning"}`} style={{ marginTop: "4px" }}>
                    {selectedResident.status}
                  </span>
                </div>
              </div>
              <button className="drawer-close-btn" onClick={() => setSelectedResident(null)}>✕</button>
            </div>

            <div className="drawer-section">
              <h4>Residence & Unit Allocation</h4>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#64748b" }}>Complex:</span>
                <span style={{ fontWeight: 600 }}>{activeComplexName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#64748b" }}>Assigned Apartment:</span>
                <span style={{ fontWeight: 700, color: "#4f46e5" }}>Unit {selectedResident.unitNumber}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#64748b" }}>Move-in Date:</span>
                <span style={{ fontWeight: 600 }}>{selectedResident.moveInDate}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>NIC / Passport:</span>
                <span style={{ fontFamily: "monospace" }}>{selectedResident.nationalId}</span>
              </div>
            </div>

            <div className="drawer-section">
              <h4>Contact & Emergency</h4>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#64748b" }}>Primary Phone:</span>
                <span style={{ fontWeight: 600 }}>{selectedResident.phoneNumber}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#64748b" }}>Email:</span>
                <span>{selectedResident.email}</span>
              </div>
              <div style={{ marginTop: "10px", padding: "10px", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700 }}>EMERGENCY CONTACT</div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                  {selectedResident.emergencyContact || "None listed"}
                </div>
              </div>
            </div>

            <div className="drawer-section">
              <h4>Registered Household Members ({selectedResident.householdMembers?.length || 0})</h4>
              {selectedResident.householdMembers?.length > 0 ? (
                selectedResident.householdMembers.map((m, idx) => (
                  <div className="household-member-pill" key={idx}>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{m.name}</span>
                    <span style={{ color: "#64748b" }}>{m.relation} • Age {m.age}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0, fontStyle: "italic" }}>No additional family members registered.</p>
              )}
            </div>

            <div style={{ marginTop: "auto", display: "flex", gap: "10px" }}>
              <button className="admin-btn admin-btn--secondary" style={{ flex: 1 }} onClick={() => setSelectedResident(null)}>
                Close
              </button>
              <button className="admin-btn admin-btn--primary" style={{ flex: 1 }}>
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard Resident Modal */}
      {showOnboardModal && (
        <div className="modal-overlay" onClick={() => setShowOnboardModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px" }}>
            <h2>Onboard New Resident ({activeComplexName})</h2>
            <form onSubmit={handleOnboardSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="e.g. Ruwan Silva"
                    value={formData.fullName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>National ID / Passport *</label>
                  <input
                    type="text"
                    name="nationalId"
                    required
                    placeholder="e.g. 199012345678"
                    value={formData.nationalId}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="ruwan.s@gmail.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Mobile Phone *</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    required
                    placeholder="+94 77 123 9988"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label>Assign Vacant Apartment *</label>
                  <select name="unitId" required value={formData.unitId} onChange={handleInputChange}>
                    <option value="">-- Select Vacant Unit --</option>
                    {availableUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.unitNumber} ({u.blockName} - LKR {Number(u.monthlyRent).toLocaleString()}/mo)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Move-In Date *</label>
                  <input
                    type="date"
                    name="moveInDate"
                    required
                    value={formData.moveInDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Emergency Contact (Name - Relationship - Phone)</label>
                <input
                  type="text"
                  name="emergencyContact"
                  placeholder="e.g. Kumuduni Silva (Spouse) - +94 77 888 2211"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "10px", marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>
                  VEHICLE REGISTRATION (OPTIONAL)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <input
                    type="text"
                    name="plateNumber"
                    placeholder="Plate # (e.g. CAC-8890)"
                    value={formData.plateNumber}
                    onChange={handleInputChange}
                    style={{ padding: "8px 10px", fontSize: "13px" }}
                  />
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                    style={{ padding: "8px 10px", fontSize: "13px" }}
                  >
                    <option value="Car">Car</option>
                    <option value="SUV">SUV</option>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Van">Van</option>
                  </select>
                  <input
                    type="text"
                    name="makeModel"
                    placeholder="Model (e.g. Honda Civic)"
                    value={formData.makeModel}
                    onChange={handleInputChange}
                    style={{ padding: "8px 10px", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Family Members (1 per line: Name - Relation - Age)</label>
                <textarea
                  name="familyMembersText"
                  rows="2"
                  placeholder="e.g. Kumuduni Silva - Spouse - 32&#10;Senuka Silva - Son - 6"
                  value={formData.familyMembersText}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={() => setShowOnboardModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary"
                  disabled={submitting}
                >
                  {submitting ? "Onboarding..." : `Complete Onboarding for ${activeComplexName}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
