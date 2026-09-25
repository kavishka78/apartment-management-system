import { useCallback, useEffect, useState } from "react";
import Header from "../../components/admin/Header";
import {
  getFacilities,
  createFacility,
  updateFacility,
  updateFacilityStatus,
} from "../../services/api";
import "./Facilities.css";

const EMPTY_FORM = {
  name: "",
  description: "",
  capacity: "",
  openTime: "08:00",
  closeTime: "22:00",
  isActive: true,
};

export default function Facilities() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Deactivation Modal State
  const [deactivatingFacility, setDeactivatingFacility] = useState(null);
  const [deactivationReason, setDeactivationReason] = useState("");
  const [toggling, setToggling] = useState(false);

  const fetchData = useCallback(() => {
    return getFacilities()
      .then((data) => {
        setFacilities(data);
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

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(facility) {
    setEditing(facility);
    setForm({
      name: facility.name,
      description: facility.description,
      capacity: String(facility.capacity),
      openTime: facility.openTime?.substring(0, 5) || "08:00",
      closeTime: facility.closeTime?.substring(0, 5) || "22:00",
      isActive: facility.isActive,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function handleChange(e) {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
  }

  // Open Deactivate Confirmation Modal
  function handleDeactivateClick(facility) {
    setDeactivatingFacility(facility);
    setDeactivationReason("");
  }

  function closeDeactivateModal() {
    setDeactivatingFacility(null);
    setDeactivationReason("");
  }

  // Confirm Deactivation
  async function confirmDeactivation(e) {
    e.preventDefault();
    if (!deactivatingFacility) return;

    setToggling(true);
    try {
      await updateFacilityStatus(deactivatingFacility.id, false, deactivationReason);
      closeDeactivateModal();
      await load();
    } catch (err) {
      alert("Failed to deactivate facility: " + err.message);
    } finally {
      setToggling(false);
    }
  }

  // Handle Direct Activation
  async function handleActivateClick(facility) {
    if (!window.confirm(`Are you sure you want to activate ${facility.name}?`)) return;

    setToggling(true);
    try {
      await updateFacilityStatus(facility.id, true, "");
      await load();
    } catch (err) {
      alert("Failed to activate facility: " + err.message);
    } finally {
      setToggling(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        capacity: parseInt(form.capacity, 10),
        openTime: form.openTime + ":00",
        closeTime: form.closeTime + ":00",
        isActive: form.isActive,
      };

      if (editing) {
        await updateFacility(editing.id, payload);
      } else {
        await createFacility(payload);
      }

      closeModal();
      await load();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div id="facilities-page">
      <Header
        title="Facilities Management"
        subtitle="Manage building amenities, operating hours and capacity."
      >
        <button className="admin-btn admin-btn--primary" onClick={openAdd} id="btn-add-facility">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Facility
        </button>
      </Header>

      {error && (
        <div className="overview-error-banner">
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table" id="facilities-table">
              <thead>
                <tr>
                  <th>Facility</th>
                  <th>Description</th>
                  <th>Capacity</th>
                  <th>Opens</th>
                  <th>Closes</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {facilities.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
                      No facilities found. Click "Add Facility" to get started.
                    </td>
                  </tr>
                ) : (
                  facilities.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <span className="facility-name">{f.name}</span>
                        {!f.isActive && f.deactivationReason && (
                          <div style={{ fontSize: "12px", color: "#ef4444", marginTop: "2px" }}>
                            Reason: {f.deactivationReason}
                          </div>
                        )}
                      </td>
                      <td className="td-desc">{f.description}</td>
                      <td>
                        <span className="capacity-badge">{f.capacity}</span>
                      </td>
                      <td>{formatTime(f.openTime)}</td>
                      <td>{formatTime(f.closeTime)}</td>
                      <td>
                        <span className={`badge ${f.isActive ? "badge--success" : "badge--danger"}`}>
                          {f.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            className="admin-btn admin-btn--secondary admin-btn--sm"
                            onClick={() => openEdit(f)}
                          >
                            Edit
                          </button>
                          {f.isActive ? (
                            <button
                              className="admin-btn admin-btn--sm admin-btn--danger"
                              onClick={() => handleDeactivateClick(f)}
                              disabled={toggling}
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              className="admin-btn admin-btn--sm admin-btn--success"
                              onClick={() => handleActivateClick(f)}
                              disabled={toggling}
                            >
                              Activate
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? "Edit Facility" : "Add New Facility"}</h2>
            <form onSubmit={handleSubmit} id="facility-form">
              <div className="form-group">
                <label htmlFor="fac-name">Facility Name</label>
                <input
                  id="fac-name"
                  name="name"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Swimming Pool"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fac-desc">Description</label>
                <textarea
                  id="fac-desc"
                  name="description"
                  rows="2"
                  maxLength={100}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Brief description"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fac-cap">Capacity</label>
                  <input
                    id="fac-cap"
                    name="capacity"
                    type="number"
                    min="1"
                    required
                    value={form.capacity}
                    onChange={handleChange}
                    placeholder="50"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fac-open">Opens</label>
                  <input
                    id="fac-open"
                    name="openTime"
                    type="time"
                    required
                    value={form.openTime}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fac-close">Closes</label>
                  <input
                    id="fac-close"
                    name="closeTime"
                    type="time"
                    required
                    value={form.closeTime}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                  />
                  <span>Active Facility</span>
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary"
                  disabled={saving}
                >
                  {saving ? "Saving…" : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivation Confirmation Modal */}
      {deactivatingFacility && (
        <div className="modal-overlay" onClick={closeDeactivateModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "480px", borderRadius: "16px", padding: "24px", background: "#fff" }}
          >
            <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: "700", color: "#991b1b" }}>
              Deactivate Facility: {deactivatingFacility.name}?
            </h3>

            <p style={{ fontSize: "14px", color: "#4b5563", marginBottom: "16px", lineHeight: "1.5" }}>
              Are you sure you want to deactivate <strong>{deactivatingFacility.name}</strong>? Residents will see a notification on the mobile app indicating that this facility is currently unavailable.
            </p>

            <form onSubmit={confirmDeactivation}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                  Reason for Deactivation (Optional)
                </label>
                <textarea
                  className="admin-input"
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                    resize: "vertical"
                  }}
                  placeholder="e.g. Maintenance in progress, Closed for cleaning until Friday..."
                  value={deactivationReason}
                  onChange={(e) => setDeactivationReason(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={closeDeactivateModal}
                  disabled={toggling}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn--danger"
                  disabled={toggling}
                >
                  {toggling ? "Deactivating..." : "Deactivate Facility"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(timeStr) {
  if (!timeStr) return "—";
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}
