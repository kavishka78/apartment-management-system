import { useCallback, useEffect, useState } from "react";
import PaymentSidebar from "../../components/payment/PaymentSidebar";
import "./PaymentDashboard.css";
import "./Payments.css";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [verifyingId, setVerifyingId] = useState(null);

  // Receipt states
  const [receipt, setReceipt] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const fetchPayments = useCallback(() => {
    let sortBy = "paidAt";
    let sortOrder = "desc";

    if (sort === "oldest") {
      sortBy = "paidAt";
      sortOrder = "asc";
    } else if (sort === "amountHigh") {
      sortBy = "amount";
      sortOrder = "desc";
    } else if (sort === "amountLow") {
      sortBy = "amount";
      sortOrder = "asc";
    }

    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      sortBy,
      sortOrder,
    });

    if (search.trim()) {
      params.append("search", search.trim());
    }

    if (status) {
      params.append("status", status);
    }

    return fetch(
      `http://localhost:5073/api/payments?${params.toString()}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load payments.");
        }
        return response.json();
      })
      .then((data) => {
        setPayments(data.items || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch((error) => {
        console.error("Error loading payments:", error);
        setErrorMessage("Unable to load payments.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [search, status, sort, page]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleVerify = async (paymentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to verify this payment?"
    );

    if (!confirmed) {
      return;
    }

    setSuccessMessage("");
    setErrorMessage("");
    setVerifyingId(paymentId);

    try {
      const response = await fetch(
        `http://localhost:5073/api/payments/${paymentId}/verify`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        let message = "Failed to verify payment.";

        try {
          const errorData = await response.json();
          message = errorData.message || message;
        } catch {
          // Keep default error message
        }

        setErrorMessage(message);
        return;
      }

      const data = await response.json();

      setSuccessMessage(
        data.message || "Payment verified successfully."
      );

      setLoading(true);
      await fetchPayments();
    } catch (error) {
      console.error("Error verifying payment:", error);

      setErrorMessage(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setVerifyingId(null);
    }
  };

  // Load receipt from backend
  const handleViewReceipt = async (paymentId) => {
    setErrorMessage("");
    setReceiptLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5073/api/payments/${paymentId}/receipt`
      );

      if (!response.ok) {
        let message = "Failed to load receipt.";

        try {
          const errorData = await response.json();
          message = errorData.message || message;
        } catch {
          // Keep default message
        }

        setErrorMessage(message);
        return;
      }

      const data = await response.json();
      setReceipt(data);
    } catch (error) {
      console.error("Error loading receipt:", error);

      setErrorMessage(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setReceiptLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString();
  };

  const formatCurrency = (amount) => {
    return `Rs. ${Number(amount || 0).toLocaleString()}`;
  };

  return (
    <div className="payment-page">
      <PaymentSidebar activePage="payments" />

      <main className="payment-content">
        <header className="payment-header">
          <div>
            <p className="page-label">PAYMENT MANAGEMENT</p>

            <h1>Payments</h1>

            <p className="page-description">
              View, search and verify resident payment transactions.
            </p>
          </div>
        </header>

        {successMessage && (
          <div className="payment-page-message success-message">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="payment-page-message error-message">
            {errorMessage}
          </div>
        )}

        <div className="payment-filters">
          <div className="payment-search">
            <input
              type="text"
              placeholder="Search payment reference or invoice..."
              value={search}
              onChange={(e) => {
                setLoading(true);
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setLoading(true);
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="Successful">Successful</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
          </select>

          <select
            value={sort}
            onChange={(e) => {
              setLoading(true);
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amountHigh">
              Amount: High to Low
            </option>
            <option value="amountLow">
              Amount: Low to High
            </option>
          </select>
        </div>

        <section className="payments-panel">
          <div className="payments-panel-header">
            <div>
              <h2>Payment Transactions</h2>

              <p>
                Review payment details and verify successful
                transactions.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="payments-loading">
              Loading payments...
            </p>
          ) : payments.length === 0 ? (
            <p className="payments-loading">
              No payments found.
            </p>
          ) : (
            <>
              <div className="payments-table-wrapper">
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Invoice</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Card</th>
                      <th>Status</th>
                      <th>Paid Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>
                          {payment.paymentReference}
                        </td>

                        <td>
                          {payment.invoiceNumber}
                        </td>

                        <td>
                          {formatCurrency(payment.amount)}
                        </td>

                        <td>
                          {payment.paymentMethod}
                        </td>

                        <td>
                          {payment.cardLastFourDigits
                            ? `•••• ${payment.cardLastFourDigits}`
                            : "-"}
                        </td>

                        <td>
                          <span
                            className={`payment-status ${payment.status.toLowerCase()}`}
                          >
                            {payment.status}
                          </span>
                        </td>

                        <td>
                          {payment.paidAt
                            ? new Date(
                                payment.paidAt
                              ).toLocaleDateString()
                            : "-"}
                        </td>

                        <td>
                          {payment.status === "Successful" ? (
                            <button
                              className="verify-payment-btn"
                              onClick={() =>
                                handleVerify(payment.id)
                              }
                              disabled={
                                verifyingId === payment.id
                              }
                            >
                              {verifyingId === payment.id
                                ? "Verifying..."
                                : "Verify"}
                            </button>
                          ) : payment.status === "Verified" ? (
                            <button
                              className="view-receipt-btn"
                              onClick={() =>
                                handleViewReceipt(payment.id)
                              }
                              disabled={receiptLoading}
                            >
                              View Receipt
                            </button>
                          ) : (
                            <span className="no-action">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="payments-pagination">
                  <button
                    onClick={() => {
                      setLoading(true);
                      setPage((prev) => prev - 1);
                    }}
                    disabled={page === 1}
                  >
                    ← Previous
                  </button>

                  <span>
                    Page {page} of {totalPages}
                  </span>

                  <button
                    onClick={() => {
                      setLoading(true);
                      setPage((prev) => prev + 1);
                    }}
                    disabled={page === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {receiptLoading && (
        <div className="receipt-modal-overlay">
          <div className="receipt-modal receipt-loading-modal">
            Loading receipt...
          </div>
        </div>
      )}

      {receipt && !receiptLoading && (
        <div
          className="receipt-modal-overlay"
          onClick={() => setReceipt(null)}
        >
          <div
            className="receipt-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="receipt-print-area"
              id="receipt-print-area"
            >
              <div className="receipt-header">
                <div>
                  <p className="receipt-company">
                    APARTMENTHUB
                  </p>

                  <h2>Payment Receipt</h2>

                  <p className="receipt-subtitle">
                    Maintenance Fee & Payment Management
                  </p>
                </div>

                <span className="receipt-paid-badge">
                  PAID
                </span>
              </div>

              <div className="receipt-number-section">
                <span>Receipt Number</span>

                <strong>
                  {receipt.receiptNumber || "-"}
                </strong>
              </div>

              <div className="receipt-details-grid">
                <div>
                  <span>Payment Reference</span>
                  <strong>
                    {receipt.paymentReference || "-"}
                  </strong>
                </div>

                <div>
                  <span>Invoice Number</span>
                  <strong>
                    {receipt.invoiceNumber || "-"}
                  </strong>
                </div>

                <div>
                  <span>Payment Method</span>
                  <strong>
                    {receipt.paymentMethod || "-"}
                  </strong>
                </div>

                <div>
                  <span>Card</span>
                  <strong>
                    {receipt.cardLastFourDigits
                      ? `•••• ${receipt.cardLastFourDigits}`
                      : "-"}
                  </strong>
                </div>

                <div>
                  <span>Paid Date</span>
                  <strong>
                    {formatDate(receipt.paidAt)}
                  </strong>
                </div>

                <div>
                  <span>Receipt Issued</span>
                  <strong>
                    {formatDate(receipt.issuedAt)}
                  </strong>
                </div>
              </div>

              <div className="receipt-total">
                <div>
                  <span>Total Paid</span>
                  <p>Payment successfully verified</p>
                </div>

                <strong>
                  {formatCurrency(receipt.amount)}
                </strong>
              </div>

              <div className="receipt-footer-note">
                <p>
                  Thank you. This receipt confirms the
                  verified payment recorded in ApartmentHub.
                </p>
              </div>
            </div>

            <div className="receipt-modal-actions">
              <button
                className="receipt-close-btn"
                onClick={() => setReceipt(null)}
              >
                Close
              </button>

              <button
                className="receipt-print-btn"
                onClick={handlePrintReceipt}
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;