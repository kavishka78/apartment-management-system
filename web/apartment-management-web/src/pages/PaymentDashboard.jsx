import { useEffect, useState } from "react";
import "./PaymentDashboard.css";
import PaymentSidebar from "../components/PaymentSidebar";

function PaymentDashboard() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentPayments, setRecentPayments] = useState([]);

  // Load collection report
  useEffect(() => {
    fetch("http://localhost:5073/api/reports/collections")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load collection report");
        }

        return response.json();
      })
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  // Load recent payments
  useEffect(() => {
    fetch(
      "http://localhost:5073/api/payments?sortBy=paidAt&sortOrder=desc&page=1&pageSize=5"
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load payments");
        }

        return response.json();
      })
      .then((data) => {
        setRecentPayments(data.items);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  return (
    <div className="payment-page">

      {/* Sidebar */}
      <PaymentSidebar activePage="dashboard" />

      {/* Main Content */}
      <main className="payment-content">

        {/* Header */}
        <header className="payment-header">
          <div>
            <p className="page-label">ADMIN PORTAL</p>

            <h1>Payment Management</h1>

            <p className="page-description">
              Monitor invoices, payments and outstanding balances.
            </p>
          </div>

          <button className="generate-btn">
            + Generate Invoice
          </button>
        </header>

        {/* Summary Cards */}
        <section className="summary-grid">

          <div className="summary-card">
            <p>Total Invoiced</p>

            <h2>
              {loading
                ? "Loading..."
                : `Rs. ${report?.totalInvoiced?.toLocaleString() ?? 0}`}
            </h2>

            <span>All generated invoices</span>
          </div>

          <div className="summary-card">
            <p>Total Collected</p>

            <h2>
              {loading
                ? "Loading..."
                : `Rs. ${report?.totalCollected?.toLocaleString() ?? 0}`}
            </h2>

            <span>Verified payments</span>
          </div>

          <div className="summary-card">
            <p>Pending Amount</p>

            <h2>
              {loading
                ? "Loading..."
                : `Rs. ${report?.pendingAmount?.toLocaleString() ?? 0}`}
            </h2>

            <span>Outstanding balance</span>
          </div>

          <div className="summary-card">
            <p>Overdue Invoices</p>

            <h2>
              {loading ? "..." : report?.overdueInvoices ?? 0}
            </h2>

            <span>Require attention</span>
          </div>

        </section>

        {/* Recent Payments */}
        <section className="dashboard-panel">

          <div className="panel-heading">
            <div>
              <h2>Recent Payments</h2>
              <p>Latest payment activity from residents.</p>
            </div>

            <button className="view-btn">
              View All
            </button>
          </div>

          {recentPayments.length === 0 ? (

            <div className="empty-state">
              <h3>No payments yet</h3>
              <p>Resident payment activity will appear here.</p>
            </div>

          ) : (

            <div className="table-wrapper">
              <table className="payment-table">

                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Invoice</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {recentPayments.map((payment) => (

                    <tr key={payment.id}>

                      <td>{payment.paymentReference}</td>

                      <td>
                        {payment.invoiceNumber ||
                          `Invoice #${payment.invoiceId}`}
                      </td>

                      <td>
                        Rs. {payment.amount.toLocaleString()}
                      </td>

                      <td>{payment.paymentMethod}</td>

                      <td>
                        <span
                          className={`status-badge ${payment.status.toLowerCase()}`}
                        >
                          {payment.status}
                        </span>
                      </td>

                      <td>
                        {payment.paidAt
                          ? new Date(payment.paidAt).toLocaleDateString()
                          : "-"}
                      </td>

                    </tr>

                  ))}
                </tbody>

              </table>
            </div>

          )}

        </section>

      </main>
    </div>
  );
}

export default PaymentDashboard;