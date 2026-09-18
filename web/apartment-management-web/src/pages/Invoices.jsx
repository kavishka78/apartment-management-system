import { useEffect, useState } from "react";
import "./PaymentDashboard.css";
import "./Invoices.css";
import PaymentSidebar from "../components/PaymentSidebar";

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;
  const [sort, setSort] = useState("newest");

  useEffect(() => {
  setLoading(true);

  let sortBy = "createdAt";
  let sortOrder = "desc";

if (sort === "oldest") {
  sortBy = "createdAt";
  sortOrder = "asc";
} else if (sort === "amountHigh") {
  sortBy = "totalAmount";
  sortOrder = "desc";
} else if (sort === "amountLow") {
  sortBy = "totalAmount";
  sortOrder = "asc";
}


  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    sortBy: sortBy,
    sortOrder: sortOrder,
  });

  if (search.trim()) {
    params.append("search", search.trim());
  }

  if (status) {
    params.append("status", status);
  }

  fetch(`http://localhost:5073/api/invoices?${params.toString()}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load invoices");
      }

      return response.json();
    })
    .then((data) => {
      setInvoices(data.items);
      setTotalPages(data.totalPages);
setLoading(false);
    })
    .catch((error) => {
      console.error(error);
      setLoading(false);
    });
}, [search, status, page, sort]);

  return (
    <div className="payment-page">

      <PaymentSidebar activePage="invoices" />

      <main className="payment-content">

        <header className="payment-header">
          <div>
            <p className="page-label">PAYMENT MANAGEMENT</p>

            <h1>Invoice Management</h1>

            <p className="page-description">
              View and manage resident maintenance invoices.
            </p>
          </div>

          <button className="generate-btn">
            + Generate Invoice
          </button>
        </header>

        <div className="invoice-filters">

  <div className="invoice-search">
    <input
      type="text"
      placeholder="Search invoices..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  </div>

    <select
  className="sort-filter"
  value={sort}
  onChange={(e) => {
    setSort(e.target.value);
    setPage(1);
  }}
>
  <option value="newest">Newest First</option>
  <option value="oldest">Oldest First</option>
  <option value="amountHigh">Amount: High to Low</option>
  <option value="amountLow">Amount: Low to High</option>
</select>


  <select
    className="status-filter"
    value={status}
    onChange={(e) => setStatus(e.target.value)}
  >
    <option value="">All Statuses</option>
    <option value="Pending">Pending</option>
    <option value="Paid">Paid</option>
  </select>

</div>

        <section className="invoice-panel">
          <div className="invoice-panel-heading">
            <div>
              <h2>All Invoices</h2>
              <p>
                {loading
                  ? "Loading invoices..."
                  : `${invoices.length} invoices loaded`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="invoice-message">
              Loading invoices...
            </div>
          ) : invoices.length === 0 ? (
            <div className="invoice-message">
              No invoices found.
            </div>
          ) : (
            <div className="table-wrapper">

              <table className="invoice-table">

                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Resident</th>
                    <th>Apartment</th>
                    <th>Billing Month</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>

                      <td className="invoice-number">
                        {invoice.invoiceNumber}
                      </td>

                      <td>
                        Resident #{invoice.residentId}
                      </td>

                      <td>
                        Apartment #{invoice.apartmentId}
                      </td>

                      <td>
                        {invoice.billingMonth}
                      </td>

                      <td className="invoice-amount">
                        Rs. {invoice.totalAmount.toLocaleString()}
                      </td>

                      <td>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </td>

                      <td>
                        <span
                          className={`invoice-status ${invoice.status.toLowerCase()}`}
                        >
                          {invoice.status}
                        </span>
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

          {!loading && totalPages > 1 && (
  <div className="invoice-pagination">

    <button
      onClick={() => setPage((prev) => prev - 1)}
      disabled={page === 1}
    >
      ← Previous
    </button>

    <span>
      Page {page} of {totalPages}
    </span>

    <button
      onClick={() => setPage((prev) => prev + 1)}
      disabled={page === totalPages}
    >
      Next →
    </button>

  </div>
)}

        </section>

      </main>
    </div>
  );
}

export default Invoices;