import { useEffect, useState } from "react";
import PaymentSidebar from "../../components/payment/PaymentSidebar";
import "./PaymentDashboard.css";
import "./OverdueAccounts.css";

function OverdueAccounts() {
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [urgency, setUrgency] = useState("all");
  const [sort, setSort] = useState("mostOverdue");

  useEffect(() => {
    const fetchOverdueInvoices = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await fetch(
          "http://localhost:5073/api/payments/overdue"
        );

        if (!response.ok) {
          throw new Error("Failed to load overdue accounts.");
        }

        const data = await response.json();
        setOverdueInvoices(data);
      } catch (error) {
        console.error("Error loading overdue accounts:", error);
        setErrorMessage(
          "Unable to load overdue accounts. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOverdueInvoices();
  }, []);

  const filteredInvoices = overdueInvoices
    .filter((invoice) => {
      const searchTerm = search.toLowerCase().trim();

      const matchesSearch =
        invoice.invoiceNumber
          ?.toLowerCase()
          .includes(searchTerm) ||
        String(invoice.residentId).includes(searchTerm) ||
        String(invoice.apartmentId).includes(searchTerm);

      let matchesUrgency = true;

      if (urgency === "1-7") {
        matchesUrgency =
          invoice.daysOverdue >= 1 &&
          invoice.daysOverdue <= 7;
      } else if (urgency === "8-30") {
        matchesUrgency =
          invoice.daysOverdue >= 8 &&
          invoice.daysOverdue <= 30;
      } else if (urgency === "30+") {
        matchesUrgency = invoice.daysOverdue > 30;
      }

      return matchesSearch && matchesUrgency;
    })
    .sort((a, b) => {
      if (sort === "leastOverdue") {
        return a.daysOverdue - b.daysOverdue;
      }

      if (sort === "amountHigh") {
        return b.totalAmount - a.totalAmount;
      }

      if (sort === "amountLow") {
        return a.totalAmount - b.totalAmount;
      }

      return b.daysOverdue - a.daysOverdue;
    });

  const getUrgencyClass = (days) => {
    if (days > 30) {
      return "critical";
    }

    if (days > 7) {
      return "warning";
    }

    return "recent";
  };

  return (
    <div className="payment-page">
      <PaymentSidebar activePage="overdue" />

      <main className="payment-content">
        <header className="payment-header">
          <div>
            <p className="page-label">PAYMENT MANAGEMENT</p>

            <h1>Overdue Accounts</h1>

            <p className="page-description">
              Monitor unpaid invoices that have passed their due date.
            </p>
          </div>
        </header>

        {errorMessage && (
          <div className="overdue-message error-message">
            {errorMessage}
          </div>
        )}

        <div className="overdue-filters">
          <div className="overdue-search">
            <input
              type="text"
              placeholder="Search invoice, resident or apartment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
          >
            <option value="all">All Overdue</option>
            <option value="1-7">1 - 7 Days</option>
            <option value="8-30">8 - 30 Days</option>
            <option value="30+">More Than 30 Days</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="mostOverdue">
              Most Overdue First
            </option>

            <option value="leastOverdue">
              Least Overdue First
            </option>

            <option value="amountHigh">
              Amount: High to Low
            </option>

            <option value="amountLow">
              Amount: Low to High
            </option>
          </select>
        </div>

        <section className="overdue-panel">
          <div className="overdue-panel-header">
            <div>
              <h2>Overdue Invoices</h2>

              <p>
                {filteredInvoices.length} overdue account
                {filteredInvoices.length !== 1 ? "s" : ""} found.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="overdue-loading">
              Loading overdue accounts...
            </p>
          ) : filteredInvoices.length === 0 ? (
            <div className="overdue-empty">
              <h3>No overdue accounts found</h3>
              <p>
                There are no invoices matching the selected
                filters.
              </p>
            </div>
          ) : (
            <div className="overdue-table-wrapper">
              <table className="overdue-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Resident ID</th>
                    <th>Apartment ID</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Days Overdue</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="invoice-number">
                        {invoice.invoiceNumber}
                      </td>

                      <td>{invoice.residentId}</td>

                      <td>{invoice.apartmentId}</td>

                      <td>
                        Rs.{" "}
                        {Number(
                          invoice.totalAmount
                        ).toLocaleString()}
                      </td>

                      <td>
                        {new Date(
                          invoice.dueDate
                        ).toLocaleDateString()}
                      </td>

                      <td>
                        <span className="overdue-status">
                          {invoice.status}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`days-overdue ${getUrgencyClass(
                            invoice.daysOverdue
                          )}`}
                        >
                          {invoice.daysOverdue} days
                        </span>
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

export default OverdueAccounts;