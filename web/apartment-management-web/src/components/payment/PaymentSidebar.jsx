import { useNavigate } from "react-router-dom";

function PaymentSidebar({ activePage }) {
  const navigate = useNavigate();

  return (
    <aside className="payment-sidebar">
      <div className="payment-logo">
        <span className="payment-logo-icon">A</span>
        <span>ApartmentHub</span>
      </div>

      <p className="menu-label">PAYMENT MANAGEMENT</p>

      <nav className="payment-menu">
        <button
          className={`menu-item ${
            activePage === "dashboard" ? "active" : ""
          }`}
          onClick={() => navigate("/payments")}
        >
          Dashboard
        </button>

        <button
          className={`menu-item ${
            activePage === "invoices" ? "active" : ""
          }`}
          onClick={() => navigate("/payments/invoices")}
        >
          Invoices
        </button>

        <button
          className={`menu-item ${
            activePage === "generate" ? "active" : ""
          }`}
          onClick={() => navigate("/payments/generate")}
        >
          Generate Invoice
        </button>

        <button
          className={`menu-item ${
            activePage === "payments" ? "active" : ""
          }`}
          onClick={() => navigate("/payments/list")}
        >
          Payments
        </button>

        <button
          className={`menu-item ${
            activePage === "overdue" ? "active" : ""
          }`}
          onClick={() => navigate("/payments/overdue")}
        >
          Overdue Accounts
        </button>

        <button
          className={`menu-item ${
            activePage === "reports" ? "active" : ""
          }`}
          onClick={() => navigate("/payments/reports")}
        >
          Collection Reports
        </button>
      </nav>

      <div className="sidebar-bottom">
        <a href="/">← Back to Home</a>
      </div>
    </aside>
  );
}

export default PaymentSidebar;