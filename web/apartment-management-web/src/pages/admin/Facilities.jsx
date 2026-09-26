import { useCallback, useEffect, useState } from "react";
import Header from "../../components/admin/Header";
import {
  getFacilities,
  createFacility,
  updateFacility,
  updateFacilityStatus,
  getBookings,
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

// Helper to map facility name to an appropriate SVG icon
function getFacilityIcon(name = "") {
  const n = name.toLowerCase();
  if (n.includes("pool") || n.includes("swim")) {
    return (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M3 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M14 6.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM17.5 11l-3-3m0 0l-3 3m3-3v4" />
      </svg>
    );
  }
  if (n.includes("gym") || n.includes("fitness") || n.includes("workout")) {
    return (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 0a2.25 2.25 0 01-2.25-2.25v-1.5C1.5 7.01 2.51 6 3.75 6h.75M3.75 12a2.25 2.25 0 00-2.25 2.25v1.5c0 1.24 1.01 2.25 2.25 2.25h.75m16.5-6a2.25 2.25 0 012.25-2.25v-1.5c0-1.24-1.01-2.25-2.25-2.25h-.75m2.25 6a2.25 2.25 0 002.25 2.25v1.5c0 1.24-1.01 2.25-2.25 2.25h-.75M6.75 6v12m10.5-12v12" />
      </svg>
    );
  }
  if (n.includes("tennis") || n.includes("court") || n.includes("badminton") || n.includes("squash") || n.includes("basketball")) {
    return (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 0112.728 0M18.364 18.364a9 9 0 01-12.728 0" />
      </svg>
    );
  }
  if (n.includes("hall") || n.includes("party") || n.includes("club") || n.includes("event") || n.includes("lounge")) {
    return (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    );
  }
  if (n.includes("bbq") || n.includes("grill") || n.includes("din") || n.includes("kitchen")) {
    return (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m-4-2v2m8-2v2M4 11h16m-1 0a7 7 0 01-14 0m2 0v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
      </svg>
    );
  }
  if (n.includes("park") || n.includes("garden") || n.includes("playground") || n.includes("play")) {
    return (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0v-8m-4 4l4-4 4 4" />
      </svg>
    );
  }
  if (n.includes("sauna") || n.includes("spa") || n.includes("steam")) {
    return (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v4m-4-2v3m8-3v3M4 14a8 8 0 0016 0H4z" />
      </svg>
    );
  }
  // Default building/amenity icon
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.75a.75.75 0 00-.75-.75H4.5a.75.75 0 00-.75.75V21h15.75z" />
    </svg>
  );
}

export default function Facilities() {
  const [facilities, setFacilities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Timeframe Filter State: 'today' | 'week' | 'month' | 'all' | 'custom'
  const [filterRange, setFilterRange] = useState("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Deactivation Modal State
  const [deactivatingFacility, setDeactivatingFacility] = useState(null);
  const [deactivationReason, setDeactivationReason] = useState("");
  const [toggling, setToggling] = useState(false);

  // View Facility Bookings Modal State
  const [viewingFacility, setViewingFacility] = useState(null);
  const [bookingSearch, setBookingSearch] = useState("");

  const fetchData = useCallback(() => {
    return Promise.allSettled([getFacilities(), getBookings()])
      .then(([facRes, bookRes]) => {
        if (facRes.status === "fulfilled") setFacilities(facRes.value || []);
        if (bookRes.status === "fulfilled") setBookings(bookRes.value || []);
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

  // Date filtering logic
  const filterBookingByTimeframe = useCallback((b) => {
    if (!b.bookingDate) return false;
    const bDate = new Date(b.bookingDate);
    const now = new Date();

    if (filterRange === "today") {
      return (
        bDate.getFullYear() === now.getFullYear() &&
        bDate.getMonth() === now.getMonth() &&
        bDate.getDate() === now.getDate()
      );
    }

    if (filterRange === "week") {
      const firstDayOfWeek = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      firstDayOfWeek.setDate(diff);
      firstDayOfWeek.setHours(0, 0, 0, 0);

      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
      lastDayOfWeek.setHours(23, 59, 59, 999);

      return bDate >= firstDayOfWeek && bDate <= lastDayOfWeek;
    }

    if (filterRange === "month") {
      return (
        bDate.getFullYear() === now.getFullYear() &&
        bDate.getMonth() === now.getMonth()
      );
    }

    if (filterRange === "custom") {
      if (!customStartDate || !customEndDate) return true;
      const start = new Date(customStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      return bDate >= start && bDate <= end;
    }

    return true;
  }, [filterRange, customStartDate, customEndDate]);

  // Calculate filtered non-rejected bookings
  const filteredBookings = bookings.filter(
    (b) => b.status !== "Rejected" && filterBookingByTimeframe(b)
  );

  // Compute facility booking statistics
  const getFacilityStats = (facilityId) => {
    const facilityBookings = filteredBookings.filter(
      (b) => b.facilityId === facilityId
    );
    const totalAllTime = bookings.filter(
      (b) => b.facilityId === facilityId && b.status !== "Rejected"
    ).length;

    return {
      count: facilityBookings.length,
      bookings: facilityBookings,
      totalAllTime,
    };
  };

  // Compute overall KPI metrics
  const activeCount = facilities.filter((f) => f.isActive).length;
  const totalPeriodBookings = filteredBookings.length;

  // Find top booked facility for selected timeframe
  let topFacilityName = "—";
  let maxBookings = 0;
  facilities.forEach((f) => {
    const count = filteredBookings.filter((b) => b.facilityId === f.id).length;
    if (count > maxBookings) {
      maxBookings = count;
      topFacilityName = f.name;
    }
  });

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

  // Deactivation Handlers
  function handleDeactivateClick(facility) {
    setDeactivatingFacility(facility);
    setDeactivationReason("");
  }

  function closeDeactivateModal() {
    setDeactivatingFacility(null);
    setDeactivationReason("");
  }

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

  // Get bookings for viewing facility modal
  const viewFacilityBookings = viewingFacility
    ? bookings
      .filter((b) => b.facilityId === viewingFacility.id)
      .filter((b) => {
        if (!bookingSearch) return true;
        const searchLower = bookingSearch.toLowerCase();
        return (
          String(b.residentId).includes(searchLower) ||
          String(b.id).includes(searchLower) ||
          (b.bookingDate && b.bookingDate.includes(searchLower))
        );
      })
    : [];

  return (
    <div id="facilities-page">
      <Header
        title="Facilities Management"
        subtitle="Manage building amenities, operating hours, capacity and resident reservations."
      >
        <button className="admin-btn admin-btn--primary" onClick={openAdd} id="btn-add-facility">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Facility
        </button>
      </Header>

      {error && <div className="overview-error-banner">{error}</div>}

      {/* Metric Cards - Clean Professional Layout */}
      <section className="fac-kpi-grid">
        <div className="fac-kpi-card">
          <div className="fac-kpi-header">
            <span className="fac-kpi-label">Active Amenities</span>
          </div>
          <h2 className="fac-kpi-value">
            {activeCount} <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>/ {facilities.length} Total</span>
          </h2>
        </div>

        <div className="fac-kpi-card">
          <div className="fac-kpi-header">
            <span className="fac-kpi-label">Bookings ({filterRange.toUpperCase()})</span>
          </div>
          <h2 className="fac-kpi-value" style={{ color: "#0f172a" }}>
            {totalPeriodBookings}
          </h2>
        </div>

        <div className="fac-kpi-card">
          <div className="fac-kpi-header">
            <span className="fac-kpi-label">Top Amenity</span>
          </div>
          <h2 className="fac-kpi-value" style={{ fontSize: "1.1rem", color: "#0f172a" }}>
            {topFacilityName}
          </h2>
        </div>
      </section>

      {/* Timeframe Segmented Control Bar */}
      <div className="fac-filter-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span className="fac-filter-label">Time Period:</span>
          <div className="fac-segmented-control">
            <button
              className={`fac-seg-button ${filterRange === "today" ? "active" : ""}`}
              onClick={() => setFilterRange("today")}
            >
              Today
            </button>
            <button
              className={`fac-seg-button ${filterRange === "week" ? "active" : ""}`}
              onClick={() => setFilterRange("week")}
            >
              This Week
            </button>
            <button
              className={`fac-seg-button ${filterRange === "month" ? "active" : ""}`}
              onClick={() => setFilterRange("month")}
            >
              This Month
            </button>
            <button
              className={`fac-seg-button ${filterRange === "all" ? "active" : ""}`}
              onClick={() => setFilterRange("all")}
            >
              All Time
            </button>
            <button
              className={`fac-seg-button ${filterRange === "custom" ? "active" : ""}`}
              onClick={() => setFilterRange("custom")}
            >
              Custom Date
            </button>
          </div>
        </div>

        {filterRange === "custom" && (
          <div className="fac-custom-dates">
            <label>From:</label>
            <input
              type="date"
              className="fac-date-input"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
            />
            <label>To:</label>
            <input
              type="date"
              className="fac-date-input"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

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
                  <th>Operating Hours & Capacity</th>
                  <th>Bookings ({filterRange})</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {facilities.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
                      No facilities found. Click "Add Facility" to get started.
                    </td>
                  </tr>
                ) : (
                  facilities.map((f) => {
                    const stats = getFacilityStats(f.id);
                    const bookingCount = stats.count;

                    return (
                      <tr key={f.id}>
                        <td>
                          <div className="facility-cell">
                            <span className="facility-icon-badge">
                              {getFacilityIcon(f.name)}
                            </span>
                            <div>
                              <span className="facility-name">{f.name}</span>
                              <div className="td-desc" style={{ marginTop: "2px" }}>
                                {f.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: "13px", fontWeight: "500", color: "#334155" }}>
                            {formatTime(f.openTime)} – {formatTime(f.closeTime)}
                          </div>
                          <div style={{ marginTop: "4px" }}>
                            <span className="capacity-badge">Capacity: {f.capacity}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                            <span
                              className={`fac-booking-chip ${bookingCount === 0 ? "zero" : ""}`}
                            >
                              {bookingCount} {bookingCount === 1 ? "Booking" : "Bookings"}
                            </span>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>
                              All-Time Total: {stats.totalAllTime}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${f.isActive ? "badge--success" : "badge--danger"}`}
                          >
                            {f.isActive ? "Active" : "Inactive"}
                          </span>
                          {!f.isActive && f.deactivationReason && (
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#dc2626",
                                marginTop: "4px",
                                maxWidth: "170px",
                                lineHeight: "1.3",
                              }}
                            >
                              Reason: {f.deactivationReason}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="fac-action-group">
                            <button
                              className="fac-btn fac-btn--view"
                              onClick={() => setViewingFacility(f)}
                              title="View all bookings for this facility"
                            >
                              View Bookings
                            </button>
                            <button
                              className="fac-btn fac-btn--edit"
                              onClick={() => openEdit(f)}
                            >
                              Edit
                            </button>
                            {f.isActive ? (
                              <button
                                className="fac-btn fac-btn--deactivate"
                                onClick={() => handleDeactivateClick(f)}
                                disabled={toggling}
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                className="fac-btn fac-btn--activate"
                                onClick={() => handleActivateClick(f)}
                                disabled={toggling}
                              >
                                Activate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Facility Modal */}
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
                  placeholder="Brief description of the amenity"
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
                  <label htmlFor="fac-open">Opens At</label>
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
                  <label htmlFor="fac-close">Closes At</label>
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
            style={{ maxWidth: "480px", borderRadius: "14px", padding: "24px", background: "#fff" }}
          >
            <h3 style={{ margin: "0 0 10px 0", fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>
              Deactivate {deactivatingFacility.name}
            </h3>

            <p style={{ fontSize: "13.5px", color: "#475569", marginBottom: "16px", lineHeight: "1.5" }}>
              Are you sure you want to deactivate <strong>{deactivatingFacility.name}</strong>? Residents will see a notice on the mobile app that this facility is currently unavailable.
            </p>

            <form onSubmit={confirmDeactivation}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#334155" }}>
                  Reason for Deactivation (Optional)
                </label>
                <textarea
                  className="admin-input"
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13.5px",
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
                  className="fac-btn fac-btn--edit"
                  onClick={closeDeactivateModal}
                  disabled={toggling}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fac-btn fac-btn--deactivate"
                  disabled={toggling}
                >
                  {toggling ? "Deactivating..." : "Deactivate Facility"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Facility Bookings Modal */}
      {viewingFacility && (
        <div className="modal-overlay" onClick={() => setViewingFacility(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "720px", borderRadius: "14px", padding: "24px", background: "#fff" }}
          >
            <div className="fac-modal-header">
              <div>
                <h3 className="fac-modal-title">
                  {viewingFacility.name} Bookings
                </h3>
                <p className="fac-modal-subtitle">
                  Capacity: {viewingFacility.capacity} spots | Operating Hours: {formatTime(viewingFacility.openTime)} – {formatTime(viewingFacility.closeTime)}
                </p>
              </div>
              <button
                className="fac-btn fac-btn--edit"
                onClick={() => setViewingFacility(null)}
              >
                Close
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <input
                type="text"
                placeholder="Search by Resident ID or Date..."
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px"
                }}
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
              />
            </div>

            <div className="admin-table-wrap" style={{ maxHeight: "360px", overflowY: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Resident ID</th>
                    <th>Date</th>
                    <th>Time Slot</th>
                  </tr>
                </thead>
                <tbody>
                  {viewFacilityBookings.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", padding: "28px 0", color: "#94a3b8" }}>
                        No bookings recorded for this facility.
                      </td>
                    </tr>
                  ) : (
                    viewFacilityBookings.map((b) => (
                      <tr key={b.id}>
                        <td>#{b.id}</td>
                        <td>Resident #{b.residentId}</td>
                        <td>{new Date(b.bookingDate).toLocaleDateString()}</td>
                        <td>
                          {b.startTime?.substring(0, 5)} – {b.endTime?.substring(0, 5)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
