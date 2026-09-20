import { useEffect, useState } from "react";
import Header from "../../components/admin/Header";
import {
  getFacilities,
  createFacility,
  updateFacility,
} from "../../services/api";
import "./Facilities.css";

const EMPTY_FORM = {
  name: "",
  description: "",
  capacity: "",
  openTime: "08:00",
  closeTime: "22:00",
};

export default function Facilities() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getFacilities();
      setFacilities(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

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
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
          ⚠️ {error}
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
                        <button
                          className="admin-btn admin-btn--secondary admin-btn--sm"
                          onClick={() => openEdit(f)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
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
