import { useState } from "react";
import PaymentSidebar from "../components/PaymentSidebar";
import "./PaymentDashboard.css";
import "./GenerateInvoice.css";

function GenerateInvoice() {
  const [formData, setFormData] = useState({
    residentId: "",
    apartmentId: "",
    billingMonth: "",
    dueDate: "",
    maintenanceFee: "",
    utilityCharge: "",
    parkingCharge: "",
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

    console.log("Generate button clicked");

  const invoiceData = {
    residentId: Number(formData.residentId),
    apartmentId: Number(formData.apartmentId),
    billingMonth: `${formData.billingMonth}-01`,
    dueDate: formData.dueDate,
    maintenanceFee: Number(formData.maintenanceFee) || 0,
    utilityCharge: Number(formData.utilityCharge) || 0,
    parkingCharge: Number(formData.parkingCharge) || 0,
    facilityCharge: Number(formData.facilityCharge) || 0,
  };

  try {
    const response = await fetch(
      "http://localhost:5073/api/invoices/generate-monthly",
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
  maintenanceFee: "",
  utilityCharge: "",
  parkingCharge: "",
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

        <section className="generate-invoice-panel">

          <div className="generate-form-header">
  <h2>Invoice Details</h2>
  <p>Enter the resident, apartment and monthly charge details.</p>
</div>

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
                <label>Maintenance Fee (Rs.)</label>
                <input
                  type="number"
                  name="maintenanceFee"
                  value={formData.maintenanceFee}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Utility Charge (Rs.)</label>
                <input
                  type="number"
                  name="utilityCharge"
                  value={formData.utilityCharge}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Parking Charge (Rs.)</label>
                <input
                  type="number"
                  name="parkingCharge"
                  value={formData.parkingCharge}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
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
                  min="0"
                />
              </div>

            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn">
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