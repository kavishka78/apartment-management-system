import { useEffect, useState } from "react";
import PaymentSidebar from "../../components/payment/PaymentSidebar";
import "./PaymentDashboard.css";
import "./CollectionReports.css";

function CollectionReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchCollectionReport = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await fetch(
          "http://localhost:5073/api/reports/collections"
        );

        if (!response.ok) {
          throw new Error("Failed to load collection report.");
        }

        const data = await response.json();
        setReport(data);
      } catch (error) {
        console.error("Error loading collection report:", error);

        setErrorMessage(
          "Unable to load collection report. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionReport();
  }, []);

  const formatCurrency = (amount) => {
    return `Rs. ${Number(amount || 0).toLocaleString()}`;
  };

  const calculatePercentage = (value, total) => {
    if (!total || total === 0) {
      return 0;
    }

    return Math.round((value / total) * 100);
  };

  if (loading) {
    return (
      <div className="payment-page">
        <PaymentSidebar activePage="reports" />

        <main className="payment-content">
          <header className="payment-header">
            <div>
              <p className="page-label">PAYMENT MANAGEMENT</p>
              <h1>Collection Reports</h1>
              <p className="page-description">
                View invoice and payment collection performance.
              </p>
            </div>
          </header>

          <div className="reports-loading">
            Loading collection report...
          </div>
        </main>
      </div>
    );
  }

  const collectionRate = calculatePercentage(
    report?.totalCollected,
    report?.totalInvoiced
  );

  const paidRate = calculatePercentage(
    report?.paidInvoices,
    report?.totalInvoices
  );

  const pendingRate = calculatePercentage(
    report?.pendingInvoices,
    report?.totalInvoices
  );

  const overdueRate = calculatePercentage(
    report?.overdueInvoices,
    report?.totalInvoices
  );

  return (
    <div className="payment-page">
      <PaymentSidebar activePage="reports" />

      <main className="payment-content">
        <header className="payment-header">
          <div>
            <p className="page-label">PAYMENT MANAGEMENT</p>

            <h1>Collection Reports</h1>

            <p className="page-description">
              Review invoice totals, collections and outstanding
              payment performance.
            </p>
          </div>
        </header>

        {errorMessage && (
          <div className="report-message error-message">
            {errorMessage}
          </div>
        )}

        {report && (
          <>
            <section className="report-summary-grid">
              <div className="report-summary-card">
                <p>Total Invoiced</p>

                <h2>
                  {formatCurrency(report.totalInvoiced)}
                </h2>

                <span>
                  {report.totalInvoices} total invoices
                </span>
              </div>

              <div className="report-summary-card">
                <p>Total Collected</p>

                <h2>
                  {formatCurrency(report.totalCollected)}
                </h2>

                <span>
                  {collectionRate}% of invoiced amount
                </span>
              </div>

              <div className="report-summary-card">
                <p>Pending Amount</p>

                <h2>
                  {formatCurrency(report.pendingAmount)}
                </h2>

                <span>
                  {report.pendingInvoices} unpaid invoices
                </span>
              </div>

              <div className="report-summary-card">
                <p>Overdue Accounts</p>

                <h2>{report.overdueInvoices}</h2>

                <span>
                  {overdueRate}% of all invoices
                </span>
              </div>
            </section>

            <section className="collection-overview-panel">
              <div className="collection-overview-header">
                <div>
                  <h2>Collection Overview</h2>

                  <p>
                    Current invoice and payment collection
                    performance.
                  </p>
                </div>
              </div>

              <div className="collection-rate-section">
                <div className="collection-rate-top">
                  <div>
                    <p>Overall Collection Rate</p>

                    <h3>{collectionRate}%</h3>
                  </div>

                  <div className="collection-rate-values">
                    <span>
                      Collected{" "}
                      <strong>
                        {formatCurrency(
                          report.totalCollected
                        )}
                      </strong>
                    </span>

                    <span>
                      Invoiced{" "}
                      <strong>
                        {formatCurrency(
                          report.totalInvoiced
                        )}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="report-progress">
                  <div
                    className="report-progress-fill"
                    style={{
                      width: `${Math.min(
                        collectionRate,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="invoice-report-grid">
                <div className="invoice-report-item paid">
                  <div>
                    <p>Paid Invoices</p>
                    <h3>{report.paidInvoices}</h3>
                  </div>

                  <span>{paidRate}%</span>
                </div>

                <div className="invoice-report-item pending">
                  <div>
                    <p>Pending Invoices</p>
                    <h3>{report.pendingInvoices}</h3>
                  </div>

                  <span>{pendingRate}%</span>
                </div>

                <div className="invoice-report-item overdue">
                  <div>
                    <p>Overdue Invoices</p>
                    <h3>{report.overdueInvoices}</h3>
                  </div>

                  <span>{overdueRate}%</span>
                </div>

                <div className="invoice-report-item total">
                  <div>
                    <p>Total Invoices</p>
                    <h3>{report.totalInvoices}</h3>
                  </div>

                  <span>100%</span>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default CollectionReports;