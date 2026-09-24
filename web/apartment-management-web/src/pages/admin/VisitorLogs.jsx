import { useCallback, useEffect, useState } from "react";
import Header from "../../components/admin/Header";
import {
  getAllVisitors,
  checkInVisitor,
  checkOutVisitor,
  updateVisitor,
  cancelVisitor,
  getParkingSlots,
} from "../../services/api";
import "./VisitorLogs.css";

export default function VisitorLogs() {
  const [visitors, setVisitors] = useState([]);
  const [parkingSlots, setParkingSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Modal State
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [editForm, setEditForm] = useState({
    visitorName: "",
    vehicleNumber: "",
    checkInTime: "",
    status: "Pending",
    assignedParkingSlotId: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    return Promise.all([getAllVisitors(), getParkingSlots()])
      .then(([vData, pData]) => {
        setVisitors(vData);
        setParkingSlots(pData);
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
        assignedParkingSlotId: editForm.assignedParkingSlotId ? parseInt(editForm.assignedParkingSlotId) : null,
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
    if (!confirm("Check out this visitor and release any assigned parking spot?")) return;
    try {
      await checkOutVisitor(id);
      await load();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  async function handleCancel(id) {
    if (!confirm("Cancel this visitor pass and free assigned parking slot?")) return;
    try {
      await cancelVisitor(id);
      await load();
    } catch (err) {
      alert("Error cancelling visitor pass: " + err.message);
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

  // Available Visitor Slots for dropdown
  const visitorSlots = parkingSlots.filter(
    (s) => s.slotType === "Visitor" || s.slotType === 1
  );

  return (
    <div id="visitors-page">
      <Header
        title="Visitor & Parking Logs"
        subtitle="Manage visitor passes, update check-in times, assign parking slots, and monitor status."
      >
        <button
          className="admin-btn admin-btn--secondary"
          onClick={load}
          id="btn-refresh-visitors"
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M20.49 9A9 9 0 005.64 5.64L4 4m16 16l-1.64-1.64A9 9 0 014.51 15" />
          </svg>
          Refresh
        </button>
      </Header>

      {error && <div className="overview-error-banner">⚠️ {error}</div>}

      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
        </div>
      ) : (
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
                    <td colSpan="8" style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
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
                          <span className="parking-slot">{v.assignedParkingSlot}</span>
                        ) : (
                          <span style={{ color: "#9ca3af" }}>None</span>
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
                            className="admin-btn admin-btn--secondary admin-btn--sm"
                            onClick={() => openEditModal(v)}
                            title="Edit Visitor & Assign Slot"
                          >
                            ✏️ Edit
                          </button>

                          {v.status === "Pending" && (
                            <button
                              className="admin-btn admin-btn--primary admin-btn--sm"
                              onClick={() => handleCheckIn(v.id)}
                            >
                              Check In
                            </button>
                          )}

                          {v.status === "CheckedIn" && (
                            <button
                              className="admin-btn admin-btn--warning admin-btn--sm"
                              onClick={() => handleCheckOut(v.id)}
                            >
                              Check Out
                            </button>
                          )}

                          {v.status !== "CheckedOut" && v.status !== "Cancelled" && (
                            <button
                              className="admin-btn admin-btn--danger admin-btn--sm"
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
      )}

      {/* Edit Visitor Modal */}
      {editingVisitor && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", padding: "24px", background: "#fff", borderRadius: "16px" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "700" }}>
              Edit Visitor: {editingVisitor.visitorName}
            </h3>

            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>
                  Visitor Name
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                  value={editForm.visitorName}
                  onChange={(e) => setEditForm({ ...editForm, visitorName: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>
                  Vehicle Number
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                  placeholder="e.g. WP CAA-1234"
                  value={editForm.vehicleNumber}
                  onChange={(e) => setEditForm({ ...editForm, vehicleNumber: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>
                  Assign Visitor Parking Slot
                </label>
                <select
                  className="admin-input"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                  value={editForm.assignedParkingSlotId}
                  onChange={(e) => setEditForm({ ...editForm, assignedParkingSlotId: e.target.value })}
                >
                  <option value="">-- No Slot / Auto Assign --</option>
                  {visitorSlots.map((slot) => (
                    <option key={slot.slotId} value={slot.slotId}>
                      {slot.slotNumber} ({slot.isAvailable ? "Available" : "Occupied"})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>
                  Check-In Time
                </label>
                <input
                  type="datetime-local"
                  className="admin-input"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                  value={editForm.checkInTime}
                  onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600" }}>
                  Visitor Status
                </label>
                <select
                  className="admin-input"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="CheckedIn">Checked In</option>
                  <option value="CheckedOut">Checked Out</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={closeEditModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary"
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
