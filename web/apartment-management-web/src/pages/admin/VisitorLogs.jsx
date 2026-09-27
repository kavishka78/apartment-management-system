import { useCallback, useEffect, useState } from "react";
import Header from "../../components/admin/Header";
import {
  getAllVisitors,
  checkInVisitor,
  checkOutVisitor,
  updateVisitor,
  cancelVisitor,
  getParkingSlots,
  createParkingSlot,
  updateParkingSlot,
  deleteParkingSlot,
} from "../../services/api";
import "./VisitorLogs.css";

const EMPTY_SLOT_FORM = {
  slotNumber: "",
  isAvailable: true,
};

export default function VisitorLogs() {
  const [visitors, setVisitors] = useState([]);
  const [parkingSlots, setParkingSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab State: 'passes' | 'slots'
  const [activeTab, setActiveTab] = useState("passes");

  // Edit Visitor Modal State
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [editForm, setEditForm] = useState({
    visitorName: "",
    vehicleNumber: "",
    checkInTime: "",
    status: "Pending",
    assignedParkingSlotId: "",
  });
  const [saving, setSaving] = useState(false);

  // Add Parking Slot Modal State
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [slotForm, setSlotForm] = useState(EMPTY_SLOT_FORM);
  const [creatingSlot, setCreatingSlot] = useState(false);

  const fetchData = useCallback(() => {
    return Promise.all([getAllVisitors(), getParkingSlots()])
      .then(([vData, pData]) => {
        setVisitors(vData || []);
        setParkingSlots(pData || []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function load() {
    setLoading(true);
    setError(null);
    return fetchData();
  }

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Visitor Pass Handlers
  function openEditModal(v) {
    setEditingVisitor(v);
    setEditForm({
      visitorName: v.visitorName || "",
      vehicleNumber: v.vehicleNumber || "",
      checkInTime: v.checkInTime ? new Date(v.checkInTime).toISOString().slice(0, 16) : "",
      status: v.status || "Pending",
      assignedParkingSlotId: v.assignedParkingSlotId || "",
    });
  }

  function closeEditModal() {
    setEditingVisitor(null);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editingVisitor) return;

    setSaving(true);
    try {
      const payload = {
        visitorName: editForm.visitorName,
        vehicleNumber: editForm.vehicleNumber,
        status: editForm.status,
        checkInTime: editForm.checkInTime ? new Date(editForm.checkInTime).toISOString() : null,
        assignedParkingSlotId: editForm.assignedParkingSlotId ? parseInt(editForm.assignedParkingSlotId, 10) : null,
      };

      await updateVisitor(editingVisitor.id, payload);
      closeEditModal();
      await load();
    } catch (err) {
      alert("Failed to update visitor: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckIn(id) {
    try {
      await checkInVisitor(id);
      await load();
    } catch (err) {
      alert("Error checking in: " + err.message);
    }
  }

  async function handleCheckOut(id) {
    if (!window.confirm("Check out this visitor and release any assigned parking spot?")) return;
    try {
      await checkOutVisitor(id);
      await load();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  async function handleCancel(id) {
    if (!window.confirm("Cancel this visitor pass and free assigned parking slot?")) return;
    try {
      await cancelVisitor(id);
      await load();
    } catch (err) {
      alert("Error cancelling visitor pass: " + err.message);
    }
  }

  // Parking Slot Handlers
  function openAddSlotModal() {
    setSlotForm(EMPTY_SLOT_FORM);
    setShowAddSlotModal(true);
  }

  function closeAddSlotModal() {
    setShowAddSlotModal(false);
    setSlotForm(EMPTY_SLOT_FORM);
  }

  async function handleCreateSlot(e) {
    e.preventDefault();
    if (!slotForm.slotNumber.trim()) {
      alert("Please enter a slot number.");
      return;
    }

    setCreatingSlot(true);
    try {
      const payload = {
        slotNumber: slotForm.slotNumber.trim().toUpperCase(),
        slotType: 1, // Visitor Parking Slot
        isAvailable: slotForm.isAvailable,
      };

      await createParkingSlot(payload);
      closeAddSlotModal();
      await load();
    } catch (err) {
      alert("Failed to create parking slot: " + err.message);
    } finally {
      setCreatingSlot(false);
    }
  }

  async function handleToggleSlotAvailability(slot) {
    try {
      await updateParkingSlot(slot.slotId, {
        slotId: slot.slotId,
        slotNumber: slot.slotNumber,
        slotType: 1,
        isAvailable: !slot.isAvailable,
      });
      await load();
    } catch (err) {
      alert("Failed to update slot status: " + err.message);
    }
  }

  async function handleDeleteSlot(slot) {
    if (!slot.isAvailable) {
      alert("Cannot delete an occupied parking slot. Free the slot first.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete visitor parking slot ${slot.slotNumber}?`)) return;

    try {
      await deleteParkingSlot(slot.slotId);
      await load();
    } catch (err) {
      alert("Failed to delete parking slot: " + err.message);
    }
  }

  function statusBadgeClass(status) {
    switch (status) {
      case "CheckedIn":
        return "badge badge--success";
      case "Pending":
      case "Active":
        return "badge badge--warning";
      case "CheckedOut":
        return "badge badge--neutral";
      case "Cancelled":
        return "badge badge--danger";
      default:
        return "badge badge--info";
    }
  }

  // Metrics
  const activeVisitorCount = visitors.filter(
    (v) => v.status === "CheckedIn" || v.status === "Active"
  ).length;
  const freeVisitorSlotCount = parkingSlots.filter((s) => s.isAvailable).length;
  const totalOccupiedSlots = parkingSlots.filter((s) => !s.isAvailable).length;

  return (
    <div id="visitors-page">
      <Header
        title="Visitor & Parking Management"
        subtitle="Monitor visitor gate logs, assign visitor parking spots, and configure building visitor slots."
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="admin-btn admin-btn--primary"
            onClick={openAddSlotModal}
            id="btn-add-parking-slot"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Visitor Parking Slot
          </button>
          <button
            className="admin-btn admin-btn--secondary"
            onClick={load}
            id="btn-refresh-visitors"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20.49 9A9 9 0 005.64 5.64L4 4m16 16l-1.64-1.64A9 9 0 014.51 15" />
            </svg>
            Refresh
          </button>
        </div>
      </Header>

      {error && <div className="overview-error-banner">{error}</div>}

      {/* Metric Cards - Clean Professional Layout */}
      <section className="visitor-kpi-grid">
        <div className="visitor-kpi-card">
          <div className="visitor-kpi-header">
            <span className="visitor-kpi-label">Active Visitors</span>
          </div>
          <h2 className="visitor-kpi-value" style={{ color: "#0f172a" }}>
            {activeVisitorCount}
          </h2>
        </div>

        <div className="visitor-kpi-card">
          <div className="visitor-kpi-header">
            <span className="visitor-kpi-label">Visitor Parking Slots</span>
          </div>
          <h2 className="visitor-kpi-value">
            {parkingSlots.length}
          </h2>
        </div>

        <div className="visitor-kpi-card">
          <div className="visitor-kpi-header">
            <span className="visitor-kpi-label">Available Visitor Spots</span>
          </div>
          <h2 className="visitor-kpi-value" style={{ color: "#166534" }}>
            {freeVisitorSlotCount} <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>/ {parkingSlots.length} Total</span>
          </h2>
        </div>

        <div className="visitor-kpi-card">
          <div className="visitor-kpi-header">
            <span className="visitor-kpi-label">Occupied Spots</span>
          </div>
          <h2 className="visitor-kpi-value" style={{ color: "#991b1b" }}>
            {totalOccupiedSlots}
          </h2>
        </div>
      </section>

      {/* Tab Navigation Bar */}
      <div className="visitor-nav-bar">
        <div className="visitor-tab-group">
          <button
            className={`visitor-tab-btn ${activeTab === "passes" ? "active" : ""}`}
            onClick={() => setActiveTab("passes")}
          >
            Visitor Passes & Gate Logs
            <span className="visitor-tab-badge">{visitors.length}</span>
          </button>
          <button
            className={`visitor-tab-btn ${activeTab === "slots" ? "active" : ""}`}
            onClick={() => setActiveTab("slots")}
          >
            Visitor Parking Slots Directory
            <span className="visitor-tab-badge">{parkingSlots.length}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
        </div>
      ) : activeTab === "passes" ? (
        /* TAB 1: VISITOR PASSES TABLE */
        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table" id="visitors-table">
              <thead>
                <tr>
                  <th>Visitor Name</th>
                  <th>Access Code</th>
                  <th>Expected Arrival</th>
                  <th>Check-In Time</th>
                  <th>Parking Slot</th>
                  <th>Vehicle Number</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visitors.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
                      No visitor passes registered.
                    </td>
                  </tr>
                ) : (
                  visitors.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <div className="visitor-name-cell">
                          <div className="visitor-avatar">
                            {v.visitorName?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <span className="visitor-name">{v.visitorName}</span>
                        </div>
                      </td>
                      <td>
                        <code className="access-code">{v.accessCode}</code>
                      </td>
                      <td>{formatDateTime(v.expectedArrival)}</td>
                      <td>{v.checkInTime ? formatDateTime(v.checkInTime) : "—"}</td>
                      <td>
                        {v.assignedParkingSlot ? (
                          <span className="parking-slot-badge">{v.assignedParkingSlot}</span>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>None</span>
                        )}
                      </td>
                      <td>{v.vehicleNumber || "—"}</td>
                      <td>
                        <span className={statusBadgeClass(v.status)}>
                          {v.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            className="v-btn v-btn--secondary"
                            onClick={() => openEditModal(v)}
                            disabled={v.status === "Cancelled"}
                            style={v.status === "Cancelled" ? { opacity: 0.45, cursor: "not-allowed" } : {}}
                            title={v.status === "Cancelled" ? "Cancelled by resident" : "Edit Visitor & Assign Slot"}
                          >
                            Edit
                          </button>

                          {v.status === "Pending" && (
                            <button
                              className="v-btn v-btn--primary"
                              onClick={() => handleCheckIn(v.id)}
                            >
                              Check In
                            </button>
                          )}

                          {v.status === "CheckedIn" && (
                            <button
                              className="v-btn v-btn--secondary"
                              style={{ color: "#d97706", borderColor: "#fef3c7", background: "#fffbeb" }}
                              onClick={() => handleCheckOut(v.id)}
                            >
                              Check Out
                            </button>
                          )}

                          {v.status !== "CheckedOut" && v.status !== "Cancelled" && (
                            <button
                              className="v-btn v-btn--danger"
                              onClick={() => handleCancel(v.id)}
                              title="Cancel Pass"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 2: VISITOR PARKING SLOTS DIRECTORY GRID */
        <div>
          {parkingSlots.length === 0 ? (
            <div className="admin-card" style={{ padding: "48px 0", textAlign: "center", color: "#94a3b8" }}>
              No visitor parking slots added yet. Click <strong>"Add Visitor Slot"</strong> above to configure visitor slots.
            </div>
          ) : (
            <div className="parking-grid-container">
              {parkingSlots.map((slot) => (
                <div key={slot.slotId} className="slot-card">
                  <div>
                    <div className="slot-card-header">
                      <span className="slot-number-pill">{slot.slotNumber}</span>
                    </div>

                    <div className="slot-status-row">
                      <span className="slot-avail-indicator">
                        <span className={`dot ${slot.isAvailable ? "available" : "occupied"}`} />
                        {slot.isAvailable ? "Available" : "Occupied"}
                      </span>
                    </div>

                    <div className="slot-assigned-info">
                      {slot.currentVisitorPassId ? (
                        <div>Assigned to Visitor Pass #{slot.currentVisitorPassId}</div>
                      ) : slot.isAvailable ? (
                        <div>Ready for visitor allocation</div>
                      ) : (
                        <div>Occupied / Unavailable</div>
                      )}
                    </div>
                  </div>

                  <div className="slot-actions-bar">
                    <button
                      className="v-btn v-btn--secondary"
                      style={{ flex: 1 }}
                      onClick={() => handleToggleSlotAvailability(slot)}
                    >
                      {slot.isAvailable ? "Mark Occupied" : "Mark Available"}
                    </button>
                    <button
                      className="v-btn v-btn--danger"
                      onClick={() => handleDeleteSlot(slot)}
                      title="Delete Visitor Slot"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Visitor Parking Slot Modal */}
      {showAddSlotModal && (
        <div className="modal-overlay" onClick={closeAddSlotModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "440px", padding: "24px", background: "#fff", borderRadius: "14px" }}
          >
            <div className="fac-modal-header">
              <div>
                <h3 className="fac-modal-title">Add Visitor Parking Slot</h3>
                <p className="fac-modal-subtitle">Create a dedicated visitor parking spot for incoming vehicles.</p>
              </div>
              <button className="v-btn v-btn--secondary" onClick={closeAddSlotModal}>
                Close
              </button>
            </div>

            <form onSubmit={handleCreateSlot}>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>
                  Slot Number / Identifier
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. V-01, V-02, V-03"
                  className="fac-date-input"
                  style={{ width: "100%", padding: "10px" }}
                  value={slotForm.slotNumber}
                  onChange={(e) => setSlotForm({ ...slotForm, slotNumber: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13.5px" }}>
                  <input
                    type="checkbox"
                    checked={slotForm.isAvailable}
                    onChange={(e) => setSlotForm({ ...slotForm, isAvailable: e.target.checked })}
                  />
                  <span>Available Immediately for Visitor Allocation</span>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="v-btn v-btn--secondary"
                  onClick={closeAddSlotModal}
                  disabled={creatingSlot}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="v-btn v-btn--primary"
                  disabled={creatingSlot}
                >
                  {creatingSlot ? "Creating..." : "Create Visitor Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Visitor Modal */}
      {editingVisitor && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", padding: "24px", background: "#fff", borderRadius: "14px" }}>
            <div className="fac-modal-header">
              <div>
                <h3 className="fac-modal-title">Edit Visitor: {editingVisitor.visitorName}</h3>
                <p className="fac-modal-subtitle">Update visitor check-in, parking spot and pass status.</p>
              </div>
              <button className="v-btn v-btn--secondary" onClick={closeEditModal}>
                Close
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: "14px", padding: "12px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "2px" }}>Visitor & Vehicle</div>
                <div style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a" }}>
                  {editingVisitor.visitorName} ({editingVisitor.vehicleNumber || "No vehicle"})
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>
                  Assign Visitor Parking Slot
                </label>
                {(() => {
                  const hasVehicle = editingVisitor.vehicleNumber && editingVisitor.vehicleNumber.trim().length > 0;
                  return (
                    <>
                      <select
                        className="fac-date-input"
                        style={{
                          width: "100%",
                          padding: "10px",
                          opacity: hasVehicle ? 1 : 0.5,
                          cursor: hasVehicle ? "default" : "not-allowed",
                        }}
                        value={editForm.assignedParkingSlotId}
                        onChange={(e) => setEditForm({ ...editForm, assignedParkingSlotId: e.target.value })}
                        disabled={!hasVehicle}
                      >
                        <option value="">-- No Slot Assigned --</option>
                        {parkingSlots.map((slot) => {
                          const isCurrentSlot = slot.slotId === editingVisitor.assignedParkingSlotId;
                          const isOccupied = !slot.isAvailable && !isCurrentSlot;
                          return (
                            <option
                              key={slot.slotId}
                              value={slot.slotId}
                              disabled={isOccupied}
                              style={isOccupied ? { color: "#9ca3af" } : {}}
                            >
                              {slot.slotNumber} {isOccupied ? "(Occupied)" : slot.isAvailable ? "(Available)" : "(Currently Assigned)"}
                            </option>
                          );
                        })}
                      </select>
                      {!hasVehicle && (
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                          Visitor has no registered vehicle. Parking slot assignment disabled.
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>
                  Visitor Status
                </label>
                <select
                  className="fac-date-input"
                  style={{ width: "100%", padding: "10px" }}
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="CheckedIn">Checked In (Auto-sets current check-in time)</option>
                  <option value="CheckedOut">Checked Out</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="v-btn v-btn--secondary"
                  onClick={closeEditModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="v-btn v-btn--primary"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateTime(str) {
  if (!str) return "—";
  const d = new Date(str);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
