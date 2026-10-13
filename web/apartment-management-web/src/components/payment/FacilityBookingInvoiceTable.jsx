import { useEffect, useMemo, useState } from "react";
import { getInvoiceFacilityBookings } from "../../services/api";

const dateText = (value) => value ? new Date(value).toLocaleDateString() : "—";
const timeText = (value) => value ? String(value).slice(0, 5) : "—";

export default function FacilityBookingInvoiceTable({ onSelect, refreshKey = 0, invoicedBookingIds = [] }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [facility, setFacility] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("bookingId-desc");
  const [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, facility, status, sort]);

  useEffect(() => {
    let cancelled = false;
    getInvoiceFacilityBookings()
      .then((data) => { 
        if (!cancelled) {
          setError("");
          setBookings(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch(() => { 
        if (!cancelled) {
          setError("Unable to load facility bookings. Check your connection and try again.");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [attempt, refreshKey]);

  const facilities = useMemo(() => [...new Set(bookings.map((b) => b.facilityName).filter(Boolean))].sort(), [bookings]);
  const displayedBookings = bookings.map((b) => ({
    ...b,
    isInvoiced: b.isInvoiced || invoicedBookingIds.includes(b.bookingId),
  }));
  const bookingStatus = (b) => b.isInvoiced ? "Invoiced" : b.status;
  const visible = displayedBookings.filter((b) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [b.bookingId, b.residentId, b.residentName]
      .some((v) => String(v ?? "").toLowerCase().includes(q));
    return matchesSearch && (!facility || b.facilityName === facility) && (!status || bookingStatus(b) === status);
  }).sort((a, b) => {
    const [field, direction] = sort.split("-");
    const value = (booking) => field === "bookingDate"
      ? Date.parse(`${String(booking.bookingDate).slice(0, 10)}T${String(booking.startTime || "00:00").slice(0, 5)}:00`) || 0
      : Number(booking[field]) || 0;
    return (value(a) - value(b)) * (direction === "asc" ? 1 : -1)
      || Number(b.bookingId) - Number(a.bookingId);
  });

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageBookings = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
        <select id="booking-status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{[...new Set(displayedBookings.map(bookingStatus))].sort().map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      <div className="form-group"><label htmlFor="booking-sort">Sort by</label>
        <select id="booking-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="bookingId-desc">Latest bookings (highest ID first)</option>
          <option value="bookingId-asc">Booking ID: lowest first</option>
          <option value="bookingDate-desc">Booking date: latest first</option>
          <option value="bookingDate-asc">Booking date: earliest first</option>
          <option value="residentId-asc">Resident ID: lowest first</option>
          <option value="residentId-desc">Resident ID: highest first</option>
          <option value="amount-desc">Amount: highest first</option>
          <option value="amount-asc">Amount: lowest first</option>
        </select>
      </div>
    </div>
    {loading ? <p className="resident-reference-status" role="status">Loading facility bookings...</p>
      : error ? <div className="resident-reference-status" role="alert"><p>{error}</p><button type="button" className="cancel-btn" onClick={() => setAttempt((n) => n + 1)}>Retry</button></div>
        : visible.length === 0 ? <p className="resident-reference-status" role="status">{bookings.length ? "No bookings match these filters." : "No facility bookings found."}</p>
          : <><div className="resident-reference-scroll" tabIndex={0} role="region" aria-label="Facility bookings table">
            <table><thead><tr>{["Booking ID", "Facility", "Resident ID", "Resident Name", "Apartment / Unit", "Booking Date", "Booking Time", "Amount", "Status", "Action"].map((h) => <th scope="col" key={h}>{h}</th>)}</tr></thead>
              <tbody>{pageBookings.map((b) => {
                const eligibleStatus = ["Pending", "Approved", "Completed"].includes(b.status);
                const canInvoice = eligibleStatus && !b.isInvoiced && Number(b.amount) > 0 && b.apartmentId != null;
                return <tr key={b.bookingId}>
                  <td>{b.bookingId}</td><td>{b.facilityName || "—"}</td><td>{b.residentId}</td><td>{b.residentName || "—"}</td>
                  <td>{b.apartmentNumber || (b.apartmentId == null ? "Unassigned" : b.apartmentId)}</td><td>{dateText(b.bookingDate)}</td>
                  <td>{timeText(b.startTime)}–{timeText(b.endTime)}</td><td>Rs. {Number(b.amount || 0).toFixed(2)}</td>
                  <td>{b.isInvoiced ? "Invoiced" : b.status}</td>
                  <td><button type="button" className="generate-btn booking-invoice-btn" disabled={!canInvoice}
                    title={!canInvoice ? (b.isInvoiced ? "Already invoiced" : !eligibleStatus ? "Booking is not invoiceable" : !b.apartmentId ? "Resident has no apartment assigned" : "No invoiceable amount") : undefined}
                    onClick={() => onSelect(b)}>{b.isInvoiced ? "Invoiced" : Number(b.amount) <= 0 ? "No charge" : "Generate Invoice"}</button></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
          <nav className="booking-pagination" aria-label="Facility bookings pagination">
            <button type="button" className="cancel-btn" disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}>Previous</button>
            <span aria-live="polite">Page {currentPage} of {totalPages}</span>
            <button type="button" className="cancel-btn" disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}>Next</button>
          </nav></>}
  </section>;
}
