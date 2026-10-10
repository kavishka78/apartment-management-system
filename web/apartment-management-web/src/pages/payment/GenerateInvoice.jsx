import { paymentFetch } from "../../services/api";
import { useState } from "react";
import PaymentSidebar from "../../components/payment/PaymentSidebar";
import "./PaymentDashboard.css";
import "./GenerateInvoice.css";
import "./PaymentAdminTheme.css";
import FacilityBookingInvoiceTable from "../../components/payment/FacilityBookingInvoiceTable";

function GenerateInvoice() {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingRefresh, setBookingRefresh] = useState(0);
  const [formData, setFormData] = useState({
    residentId: "",
    apartmentId: "",
    billingMonth: "",
    dueDate: "",
    facilityCharge: "",
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  setSuccessMessage("");
  setErrorMessage("");

  if (selectedBooking) {
    try {
      const response = await paymentFetch("/invoices/generate-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: selectedBooking.bookingId, apartmentId: Number(formData.apartmentId), amount: Number(formData.facilityCharge), dueDate: formData.dueDate }),
      });
      const result = await response.json();
      if (!response.ok) { setErrorMessage(result.message || "Failed to generate invoice."); return; }
      setSuccessMessage("Facility booking invoice generated successfully.");
      setSelectedBooking(null);
      setBookingRefresh((n) => n + 1);
      setFormData({ residentId: "", apartmentId: "", billingMonth: "", dueDate: "", facilityCharge: "" });
    } catch {
      setErrorMessage("Unable to connect to the server. Please try again.");
    }
    return;
  }

  const invoiceData = {
    residentId: Number(formData.residentId),
    apartmentId: Number(formData.apartmentId),
    billingMonth: `${formData.billingMonth}-01`,
    dueDate: formData.dueDate,
    maintenanceFee: 0,
    utilityCharge: 0,
    parkingCharge: 0,
    facilityCharge: Number(formData.facilityCharge) || 0,
  };

  try {
    const response = await paymentFetch(
      "/invoices/generate-monthly",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      }
    );

   if (!response.ok) {
  const errorData = await response.json();

  setErrorMessage(
    errorData.message || "Failed to generate invoice."
  );

  return;
}

    const data = await response.json();

    console.log("Invoice generated successfully:", data);
    setSuccessMessage("Invoice generated successfully.");

setFormData({
  residentId: "",
  apartmentId: "",
  billingMonth: "",
  dueDate: "",
  facilityCharge: "",
});

  } catch (error) {
  console.error("Error generating invoice:", error);
  setErrorMessage(
    "Unable to connect to the server. Please try again."
  );
}
};

  return (
    <div className="payment-page">

      <PaymentSidebar activePage="generate" />

      <main className="payment-content">

        <header className="payment-header">
          <div>
            <p className="page-label">PAYMENT MANAGEMENT</p>
            <h1>Generate Invoice</h1>
            <p className="page-description">
              Create a monthly invoice for an apartment resident.
            </p>
          </div>
        </header>

        <FacilityBookingInvoiceTable refreshKey={bookingRefresh} onSelect={(booking) => {
          setSelectedBooking(booking);
          setSuccessMessage("");
          setErrorMessage("");
          const [year, month] = String(booking.bookingDate).slice(0, 10).split("-").map(Number);
          const billingMonth = `${year}-${String(month).padStart(2, "0")}`;
          const due = new Date(year, month, 0);
          setFormData((prev) => ({ ...prev, residentId: String(booking.residentId), apartmentId: String(booking.apartmentId), billingMonth, dueDate: `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`, facilityCharge: String(booking.amount) }));
        }} />

        <section className="generate-invoice-panel">

          <div className="generate-form-header">
  <h2>Invoice Details</h2>
  <p>{selectedBooking ? `Review the invoice details for ${selectedBooking.facilityName} booking #${selectedBooking.bookingId}.` : "Enter the resident, apartment and monthly charge details."}</p>
</div>

{selectedBooking && <div className="booking-selection-summary">Selected booking #{selectedBooking.bookingId}: {selectedBooking.facilityName} · {selectedBooking.residentName} · {selectedBooking.apartmentNumber} · {selectedBooking.startTime?.slice(0, 5)}–{selectedBooking.endTime?.slice(0, 5)}</div>}

{successMessage && (
  <div className="invoice-message success-message">
    {successMessage}
  </div>
)}

{errorMessage && (
  <div className="invoice-message error-message">
    {errorMessage}
  </div>
)}

<form
  className="generate-invoice-form"
  onSubmit={handleSubmit}
>
            <div className="form-grid">

              <div className="form-group">
                <label>Resident ID</label>
                <input
                  type="number"
                  name="residentId"
                  value={formData.residentId}
                  onChange={handleChange}
                  placeholder="Enter resident ID"
                  required
                />
              </div>

              <div className="form-group">
                <label>Apartment ID</label>
                <input
                  type="number"
                  name="apartmentId"
                  value={formData.apartmentId}
                  onChange={handleChange}
                  placeholder="Enter apartment ID"
                  required
                />
              </div>

              <div className="form-group">
                <label>Billing Month</label>
                <input
                  type="month"
                  name="billingMonth"
                  value={formData.billingMonth}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Facility Charge (Rs.)</label>
                <input
                  type="number"
                  name="facilityCharge"
                  value={formData.facilityCharge}
                  onChange={handleChange}
                  placeholder="0.00"
                  min={selectedBooking ? "0.01" : "0"}
                  step="any"
                  required={Boolean(selectedBooking)}
                />
              </div>

            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => { setSelectedBooking(null); setFormData({ residentId: "", apartmentId: "", billingMonth: "", dueDate: "", facilityCharge: "" }); }}>
                Cancel
              </button>

              <button type="submit" className="generate-btn">
                Generate Invoice
              </button>
            </div>

          </form>

        </section>

      </main>
    </div>
  );
}

export default GenerateInvoice;
