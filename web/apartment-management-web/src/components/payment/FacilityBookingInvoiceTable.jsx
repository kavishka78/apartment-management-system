import { useEffect, useMemo, useState } from "react";
import { getInvoiceFacilityBookings } from "../../services/api";

const dateText = (value) => value ? new Date(value).toLocaleDateString() : "—";
const timeText = (value) => value ? String(value).slice(0, 5) : "—";

export default function FacilityBookingInvoiceTable({ onSelect, refreshKey = 0 }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [facility, setFacility] = useState("");
  const [status, setStatus] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getInvoiceFacilityBookings()
      .then((data) => { if (!cancelled) setBookings(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setError("Unable to load facility bookings. Check your connection and try again."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [attempt, refreshKey]);

  const facilities = useMemo(() => [...new Set(bookings.map((b) => b.facilityName).filter(Boolean))].sort(), [bookings]);
  const visible = bookings.filter((b) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [b.bookingId, b.residentId, b.residentName]
      .some((v) => String(v ?? "").toLowerCase().includes(q));
    return matchesSearch && (!facility || b.facilityName === facility) && (!status || b.status === status);
  });

  return <section className="generate-invoice-panel resident-reference" aria-labelledby="facility-bookings-title">
    <div className="generate-form-header">
      <h2 id="facility-bookings-title">Facility Bookings</h2>
      <p>Select a valid booking to review it in the invoice form below.</p>
    </div>
    <div className="resident-reference-controls">
      <div className="form-group"><label htmlFor="booking-search">Search bookings</label>
        <input id="booking-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Booking ID, resident ID or name" />
      </div>
      <div className="form-group"><label htmlFor="booking-facility">Facility</label>
        <select id="booking-facility" value={facility} onChange={(e) => setFacility(e.target.value)}><option value="">All facilities</option>{facilities.map((name) => <option key={name}>{name}</option>)}</select>
      </div>
      <div className="form-group"><label htmlFor="booking-status">Status</label>
        <select id="booking-status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{[...new Set(bookings.map((b) => b.status))].sort().map((s) => <option key={s}>{s}</option>)}</select>
      </div>
    </div>
    {loading ? <p className="resident-reference-status" role="status">Loading facility bookings...</p>
      : error ? <div className="resident-reference-status" role="alert"><p>{error}</p><button type="button" className="cancel-btn" onClick={() => setAttempt((n) => n + 1)}>Retry</button></div>
        : visible.length === 0 ? <p className="resident-reference-status" role="status">{bookings.length ? "No bookings match these filters." : "No facility bookings found."}</p>
          : <div className="resident-reference-scroll" tabIndex={0} role="region" aria-label="Facility bookings table">
            <table><thead><tr>{["Booking ID", "Facility", "Resident ID", "Resident Name", "Apartment / Unit", "Booking Date", "Booking Time", "Amount", "Status", "Action"].map((h) => <th scope="col" key={h}>{h}</th>)}</tr></thead>
              <tbody>{visible.map((b) => {
                const eligibleStatus = ["Pending", "Approved", "Completed"].includes(b.status);
                const canInvoice = eligibleStatus && !b.isInvoiced && Number(b.amount) > 0 && b.apartmentId != null;
                return <tr key={b.bookingId}>
                  <td>{b.bookingId}</td><td>{b.facilityName || "—"}</td><td>{b.residentId}</td><td>{b.residentName || "—"}</td>
                  <td>{b.apartmentNumber || (b.apartmentId == null ? "Unassigned" : b.apartmentId)}</td><td>{dateText(b.bookingDate)}</td>
                  <td>{timeText(b.startTime)}–{timeText(b.endTime)}</td><td>Rs. {Number(b.amount || 0).toFixed(2)}</td>
                  <td>{b.isInvoiced ? "Invoiced" : b.status}</td>
                  <td><button type="button" className="generate-btn booking-invoice-btn" disabled={!canInvoice}
                    title={!canInvoice ? (b.isInvoiced ? "Already invoiced" : !eligibleStatus ? "Booking is not invoiceable" : !b.apartmentId ? "Resident has no apartment assigned" : "No invoiceable amount") : undefined}
                    onClick={() => onSelect(b)}>{b.isInvoiced ? "Invoiced" : "Generate Invoice"}</button></td>
                </tr>;
              })}</tbody>
            </table>
          </div>}
  </section>;
}
