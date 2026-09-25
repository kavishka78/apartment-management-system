import { useState, useEffect } from "react";
import { getVehicles, getResidents, createVehicle } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./Vehicles.css";

export default function Vehicles() {
  const { activeTenantId, activeComplexName } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    residentId: "",
    plateNumber: "",
    vehicleType: "Car",
    makeModel: "",
    parkingSlot: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [vehList, resList] = await Promise.all([
        getVehicles(activeTenantId),
        getResidents(activeTenantId),
      ]);
      setVehicles(vehList || []);
      setResidents(resList || []);
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

  const handleRegisterVehicle = async (e) => {
    e.preventDefault();
    try {
      const selectedRes = residents.find((r) => r.id === Number(formData.residentId));
      await createVehicle({
        tenantId: activeTenantId,
        residentId: Number(formData.residentId),
        residentName: selectedRes ? selectedRes.fullName : "Unknown Resident",
        unitNumber: selectedRes ? selectedRes.unitNumber : "Unassigned",
        plateNumber: formData.plateNumber.toUpperCase(),
        vehicleType: formData.vehicleType,
        makeModel: formData.makeModel,
        parkingSlot: formData.parkingSlot || "P-Unassigned",
      });

      setShowModal(false);
      setToast({ type: "success", message: `Vehicle ${formData.plateNumber} registered for ${activeComplexName}!` });
      setTimeout(() => setToast(null), 3500);

      setFormData({
        residentId: "",
        plateNumber: "",
        vehicleType: "Car",
        makeModel: "",
        parkingSlot: "",
      });
      loadData();
    } catch (err) {
      setToast({ type: "danger", message: err.message });
      setTimeout(() => setToast(null), 3500);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.parkingSlot && v.parkingSlot.toLowerCase().includes(searchTerm.toLowerCase())) ||
      v.unitNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "All" || v.vehicleType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="vehicles-page" id="vehicles-page">
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

      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "12px", background: "#ede9fe", color: "#6d28d9", fontWeight: 700, padding: "2px 8px", borderRadius: "6px" }}>
              🏢 {activeComplexName}
            </span>
          </div>
          <h1>Vehicle Registry & Parking Slot Allocations</h1>
          <p>Apartment Manager portal for vehicle plate tracking and dedicated parking spot assignments.</p>
        </div>
        <button
          className="admin-btn admin-btn--primary"
          onClick={() => setShowModal(true)}
          id="btn-add-vehicle"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Register Vehicle ({activeComplexName})
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="units-filter-bar">
        <div className="search-input-wrap">
          <svg className="search-input-icon" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by plate number, resident, parking slot, unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
        >
          <option value="All">All Vehicle Types</option>
          <option value="Car">Cars</option>
          <option value="SUV">SUVs</option>
          <option value="Motorcycle">Motorcycles</option>
          <option value="Van">Vans</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "#64748b", margin: 0 }}>No vehicles found for {activeComplexName}.</p>
        </div>
      ) : (
        <div className="admin-card admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Plate Number</th>
                <th>Vehicle Type & Model</th>
                <th>Resident Owner</th>
                <th>Unit #</th>
                <th>Assigned Parking Slot</th>
                <th>Registration Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((v) => (
                <tr key={v.id}>
                  <td>
                    <span className="plate-badge">{v.plateNumber}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{v.makeModel || v.vehicleType}</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>{v.vehicleType}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{v.residentName}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: "#4f46e5" }}>Unit {v.unitNumber}</span>
                  </td>
                  <td>
                    <span className="parking-slot-badge">🚗 {v.parkingSlot}</span>
                  </td>
                  <td>{v.registeredAt}</td>
                  <td>
                    <span className="badge badge--success">Authorized</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Register Vehicle Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <h2>Register Vehicle ({activeComplexName})</h2>
            <form onSubmit={handleRegisterVehicle}>
              <div className="form-group">
                <label>Select Resident Owner *</label>
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
                  <label>Plate Number *</label>
                  <input
                    type="text"
                    name="plateNumber"
                    required
                    placeholder="e.g. CAB-4521"
                    value={formData.plateNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Vehicle Type *</label>
                  <select name="vehicleType" value={formData.vehicleType} onChange={handleInputChange}>
                    <option value="Car">Car</option>
                    <option value="SUV">SUV</option>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Van">Van</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label>Make & Model *</label>
                  <input
                    type="text"
                    name="makeModel"
                    required
                    placeholder="e.g. Toyota Prius 2018"
                    value={formData.makeModel}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Assigned Parking Slot *</label>
                  <input
                    type="text"
                    name="parkingSlot"
                    required
                    placeholder="e.g. P-A101"
                    value={formData.parkingSlot}
                    onChange={handleInputChange}
                  />
                </div>
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
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
