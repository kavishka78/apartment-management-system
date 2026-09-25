import { useState, useEffect } from "react";
import { getUnits, createUnit, updateUnit } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./Units.css";

export default function Units() {
  const { activeTenantId, activeComplexName } = useAuth();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [blockFilter, setBlockFilter] = useState("All");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [toast, setToast] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    unitNumber: "",
    floorNumber: 1,
    blockName: "Block A - Lotus Wing",
    numberOfBedrooms: 2,
    numberOfBathrooms: 2,
    squareFeet: 1200,
    monthlyRent: 135000,
    parkingSlot: "",
    status: "Available",
  });

  const loadUnits = async () => {
    try {
      setLoading(true);
      const data = await getUnits(activeTenantId);
      setUnits(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, [activeTenantId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveUnit = async (e) => {
    e.preventDefault();
    try {
      if (editingUnit) {
        await updateUnit(editingUnit.id, {
          ...formData,
          floorNumber: parseInt(formData.floorNumber, 10),
          numberOfBedrooms: parseInt(formData.numberOfBedrooms, 10),
          numberOfBathrooms: parseInt(formData.numberOfBathrooms, 10),
          squareFeet: parseInt(formData.squareFeet, 10),
          monthlyRent: parseFloat(formData.monthlyRent),
        });
        setToast({ type: "success", message: `Unit ${formData.unitNumber} updated successfully!` });
      } else {
        await createUnit({
          ...formData,
          tenantId: activeTenantId,
          floorNumber: parseInt(formData.floorNumber, 10),
          numberOfBedrooms: parseInt(formData.numberOfBedrooms, 10),
          numberOfBathrooms: parseInt(formData.numberOfBathrooms, 10),
          squareFeet: parseInt(formData.squareFeet, 10),
          monthlyRent: parseFloat(formData.monthlyRent),
        });
        setToast({ type: "success", message: `Unit ${formData.unitNumber} added to ${activeComplexName}!` });
      }

      setShowAddModal(false);
      setEditingUnit(null);
      setFormData({
        unitNumber: "",
        floorNumber: 1,
        blockName: "Block A - Lotus Wing",
        numberOfBedrooms: 2,
        numberOfBathrooms: 2,
        squareFeet: 1200,
        monthlyRent: 135000,
        parkingSlot: "",
        status: "Available",
      });
      setTimeout(() => setToast(null), 3500);
      loadUnits();
    } catch (err) {
      setToast({ type: "danger", message: err.message });
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleOpenEdit = (unit) => {
    setEditingUnit(unit);
    setFormData({
      unitNumber: unit.unitNumber,
      floorNumber: unit.floorNumber,
      blockName: unit.blockName,
      numberOfBedrooms: unit.numberOfBedrooms,
      numberOfBathrooms: unit.numberOfBathrooms,
      squareFeet: unit.squareFeet,
      monthlyRent: unit.monthlyRent,
      parkingSlot: unit.parkingSlot || "",
      status: unit.status,
    });
    setShowAddModal(true);
  };

  const filteredUnits = units.filter((u) => {
    const matchesSearch =
      u.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.blockName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.currentResidentName && u.currentResidentName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "All" || u.status === statusFilter;
    const matchesBlock = blockFilter === "All" || u.blockName === blockFilter;

    return matchesSearch && matchesStatus && matchesBlock;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Occupied":
        return <span className="badge badge--success">Occupied</span>;
      case "Available":
        return <span className="badge badge--info">Available</span>;
      case "UnderMaintenance":
        return <span className="badge badge--warning">Maintenance</span>;
      default:
        return <span className="badge badge--neutral">{status}</span>;
    }
  };

  return (
    <div className="units-page" id="units-page">
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
          <h1>Unit Directory & Floor Allocations</h1>
          <p>Apartment Manager portal for configuring units, floor allocations, occupancy status, and rent structures.</p>
        </div>
        <button
          className="admin-btn admin-btn--primary"
          onClick={() => {
            setEditingUnit(null);
            setShowAddModal(true);
          }}
          id="btn-add-unit"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Unit to {activeComplexName}
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
            placeholder="Search by unit number, block, resident..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available Only</option>
            <option value="Occupied">Occupied Only</option>
            <option value="UnderMaintenance">Under Maintenance</option>
          </select>

          <select
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
          >
            <option value="All">All Wings / Blocks</option>
            <option value="Block A - Lotus Wing">Block A - Lotus Wing</option>
            <option value="Block B - Jasmine Wing">Block B - Jasmine Wing</option>
            <option value="Block C - Royal Penthouse">Block C - Royal Penthouse</option>
          </select>

          <div style={{ display: "flex", border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "hidden" }}>
            <button
              onClick={() => setViewMode("grid")}
              style={{
                padding: "8px 12px",
                border: "none",
                background: viewMode === "grid" ? "#6366f1" : "#fff",
                color: viewMode === "grid" ? "#fff" : "#475569",
                cursor: "pointer",
              }}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode("table")}
              style={{
                padding: "8px 12px",
                border: "none",
                background: viewMode === "table" ? "#6366f1" : "#fff",
                color: viewMode === "table" ? "#fff" : "#475569",
                cursor: "pointer",
              }}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
        </div>
      ) : filteredUnits.length === 0 ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "#64748b", margin: 0 }}>No apartment units found matching your criteria.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="units-grid">
          {filteredUnits.map((u) => (
            <div className="unit-card" key={u.id}>
              <div>
                <div className="unit-card-header">
                  <span className="unit-number-title">{u.unitNumber}</span>
                  {getStatusBadge(u.status)}
                </div>

                <p className="unit-block-subtitle">{u.blockName} • Floor {u.floorNumber}</p>

                <div className="unit-specs-pills">
                  <span className="spec-pill">🛏️ {u.numberOfBedrooms} Beds</span>
                  <span className="spec-pill">🚿 {u.numberOfBathrooms} Baths</span>
                  <span className="spec-pill">📐 {u.squareFeet} sqft</span>
                  {u.parkingSlot && <span className="spec-pill">🚗 {u.parkingSlot}</span>}
                </div>

                <div className="unit-resident-box">
                  <div className="label">Current Occupant</div>
                  {u.currentResidentName ? (
                    <div>
                      <div className="name">{u.currentResidentName}</div>
                      <div className="phone">{u.currentResidentPhone}</div>
                    </div>
                  ) : (
                    <div style={{ color: "#94a3b8", fontStyle: "italic" }}>Vacant / Ready for Onboarding</div>
                  )}
                </div>
              </div>

              <div>
                <div className="unit-rent-tag">
                  <span style={{ color: "#64748b" }}>Monthly Rent</span>
                  <span className="amount">LKR {Number(u.monthlyRent).toLocaleString()}</span>
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button
                    className="admin-btn admin-btn--secondary admin-btn--sm"
                    style={{ flex: 1 }}
                    onClick={() => handleOpenEdit(u)}
                  >
                    Edit Unit
                  </button>
                  <button
                    className="admin-btn admin-btn--primary admin-btn--sm"
                    style={{ flex: 1 }}
                  >
                    History
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-card admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Unit #</th>
                <th>Block / Wing</th>
                <th>Floor</th>
                <th>Bedrooms</th>
                <th>Sq. Feet</th>
                <th>Monthly Rent</th>
                <th>Occupant</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 700, color: "#0f172a" }}>{u.unitNumber}</td>
                  <td>{u.blockName}</td>
                  <td>Floor {u.floorNumber}</td>
                  <td>{u.numberOfBedrooms} BHK</td>
                  <td>{u.squareFeet} sqft</td>
                  <td style={{ fontWeight: 600 }}>LKR {Number(u.monthlyRent).toLocaleString()}</td>
                  <td>
                    {u.currentResidentName ? (
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.currentResidentName}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{u.currentResidentPhone}</div>
                      </div>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>—</span>
                    )}
                  </td>
                  <td>{getStatusBadge(u.status)}</td>
                  <td>
                    <button
                      className="admin-btn admin-btn--secondary admin-btn--sm"
                      onClick={() => handleOpenEdit(u)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Unit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <h2>{editingUnit ? `Edit Unit ${editingUnit.unitNumber}` : `Add Unit to ${activeComplexName}`}</h2>
            <form onSubmit={handleSaveUnit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label>Unit Number *</label>
                  <input
                    type="text"
                    name="unitNumber"
                    required
                    placeholder="e.g. A-402"
                    value={formData.unitNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Floor Number *</label>
                  <input
                    type="number"
                    name="floorNumber"
                    required
                    min="0"
                    value={formData.floorNumber}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Block / Wing Name *</label>
                <select name="blockName" value={formData.blockName} onChange={handleInputChange}>
                  <option value="Block A - Lotus Wing">Block A - Lotus Wing</option>
                  <option value="Block B - Jasmine Wing">Block B - Jasmine Wing</option>
                  <option value="Block C - Royal Penthouse">Block C - Royal Penthouse</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label>Bedrooms *</label>
                  <input
                    type="number"
                    name="numberOfBedrooms"
                    min="1"
                    value={formData.numberOfBedrooms}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Bathrooms *</label>
                  <input
                    type="number"
                    name="numberOfBathrooms"
                    min="1"
                    value={formData.numberOfBathrooms}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Area (sqft) *</label>
                  <input
                    type="number"
                    name="squareFeet"
                    min="100"
                    value={formData.squareFeet}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label>Monthly Rent (LKR) *</label>
                  <input
                    type="number"
                    name="monthlyRent"
                    required
                    min="0"
                    value={formData.monthlyRent}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Parking Slot</label>
                  <input
                    type="text"
                    name="parkingSlot"
                    placeholder="e.g. P-A402"
                    value={formData.parkingSlot}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="Available">Available (Vacant)</option>
                  <option value="Occupied">Occupied</option>
                  <option value="UnderMaintenance">Under Maintenance</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary">
                  {editingUnit ? "Update Unit" : "Save Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
