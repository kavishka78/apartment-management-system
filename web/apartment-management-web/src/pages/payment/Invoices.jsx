import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PaymentDashboard.css";
import "./Invoices.css";
import PaymentSidebar from "../../components/payment/PaymentSidebar";

const emptyEditForm = {
  residentId: "",
  apartmentId: "",
  billingMonth: "",
  dueDate: "",
  maintenanceFee: "",
  utilityCharge: "",
  parkingCharge: "",
  facilityCharge: "",
};

function Invoices() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const pageSize = 5;

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchInvoices = useCallback(() => {
    let sortBy = "createdAt";
    let sortOrder = "desc";

    if (sort === "oldest") {
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
      `http://localhost:5073/api/invoices?${params.toString()}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load invoices.");
        }
        return response.json();
      })
      .then((data) => {
        setInvoices(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      })
      .catch((error) => {
        console.error("Error loading invoices:", error);
        setErrorMessage("Unable to load invoices.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page, search, status, sort]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const readErrorMessage = async (response, fallback) => {
    try {
      const data = await response.json();
      return data.message || fallback;
    } catch {
      return fallback;
    }
  };

  const handleView = async (id) => {
    setSuccessMessage("");
    setErrorMessage("");
    setViewLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5073/api/invoices/${id}`
      );

      if (!response.ok) {
        throw new Error("Failed to load invoice.");
      }

      const data = await response.json();
      setSelectedInvoice(data);
    } catch (error) {
      console.error("Error loading invoice:", error);
      setErrorMessage("Unable to load invoice details.");
    } finally {
      setViewLoading(false);
    }
  };

  const getChargeAmount = (items, chargeType) => {
    const item = items?.find(
      (invoiceItem) =>
        invoiceItem.chargeType?.toLowerCase() === chargeType.toLowerCase()
    );

    return item ? item.amount : "";
  };

  const handleEdit = async (id) => {
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        `http://localhost:5073/api/invoices/${id}`
      );

      if (!response.ok) {
        throw new Error("Failed to load invoice.");
      }

      const invoice = await response.json();

      if (invoice.status === "Paid") {
        setErrorMessage("Paid invoices cannot be modified.");
        return;
      }

      setEditingInvoice(invoice);

      setEditForm({
        residentId: invoice.residentId,
        apartmentId: invoice.apartmentId,

        billingMonth: invoice.billingMonth
          ? invoice.billingMonth.substring(0, 7)
          : "",

        dueDate: invoice.dueDate
          ? invoice.dueDate.substring(0, 10)
          : "",

        maintenanceFee: getChargeAmount(
          invoice.invoiceItems,
          "Maintenance"
        ),

        utilityCharge: getChargeAmount(
          invoice.invoiceItems,
          "Utility"
        ),

        parkingCharge: getChargeAmount(
          invoice.invoiceItems,
          "Parking"
        ),

        facilityCharge: getChargeAmount(
          invoice.invoiceItems,
          "Facility"
        ),
      });
    } catch (error) {
      console.error("Error preparing invoice edit:", error);
      setErrorMessage("Unable to load invoice for editing.");
    }
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const buildInvoiceItems = () => {
    const items = [];

    const charges = [
      {
        value: editForm.maintenanceFee,
        description: "Monthly Maintenance Fee",
        chargeType: "Maintenance",
      },
      {
        value: editForm.utilityCharge,
        description: "Utility Charge",
        chargeType: "Utility",
      },
      {
        value: editForm.parkingCharge,
        description: "Parking Charge",
        chargeType: "Parking",
      },
      {
        value: editForm.facilityCharge,
        description: "Facility Charge",
        chargeType: "Facility",
      },
    ];

    charges.forEach((charge) => {
      const amount = Number(charge.value) || 0;

      if (amount > 0) {
        items.push({
          description: charge.description,
          chargeType: charge.chargeType,
          amount,
        });
      }
    });

    return items;
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editingInvoice) {
      return;
    }

    setSuccessMessage("");
    setErrorMessage("");

    const invoiceItems = buildInvoiceItems();

    if (invoiceItems.length === 0) {
      setErrorMessage(
        "At least one invoice charge must be greater than zero."
      );
      return;
    }

    const billingMonth = `${editForm.billingMonth}-01T00:00:00.000Z`;
    const dueDate = `${editForm.dueDate}T00:00:00.000Z`;

    if (new Date(dueDate) <= new Date(billingMonth)) {
      setErrorMessage("Due date must be after the billing month.");
      return;
    }

    const updatedInvoice = {
      residentId: Number(editForm.residentId),
      apartmentId: Number(editForm.apartmentId),
      billingMonth,
      dueDate,
      invoiceItems,
    };

    setSaving(true);

    try {
      const response = await fetch(
        `http://localhost:5073/api/invoices/${editingInvoice.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedInvoice),
        }
      );

      if (!response.ok) {
        const message = await readErrorMessage(
          response,
          "Failed to update invoice."
        );

        setErrorMessage(message);
        return;
      }

      setEditingInvoice(null);
      setSuccessMessage("Invoice updated successfully.");

      setLoading(true);
      await fetchInvoices();
    } catch (error) {
      console.error("Error updating invoice:", error);

      setErrorMessage(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (invoice) => {
    if (invoice.status === "Paid") {
      setErrorMessage("Paid invoices cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${invoice.invoiceNumber}?`
    );

    if (!confirmed) {
      return;
    }

    setSuccessMessage("");
    setErrorMessage("");
    setDeletingId(invoice.id);

    try {
      const response = await fetch(
        `http://localhost:5073/api/invoices/${invoice.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const message = await readErrorMessage(
          response,
          "Failed to delete invoice."
        );

        setErrorMessage(message);
        return;
      }

      setSuccessMessage("Invoice deleted successfully.");

      setLoading(true);
      if (invoices.length === 1 && page > 1) {
        setPage((previous) => previous - 1);
      } else {
        await fetchInvoices();
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);

      setErrorMessage(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

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

          <button
            className="generate-btn"
            onClick={() => navigate("/payments/generate")}
          >
            + Generate Invoice
          </button>
        </header>

        {successMessage && (
          <div className="invoice-page-alert invoice-success-alert">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="invoice-page-alert invoice-error-alert">
            {errorMessage}
          </div>
        )}

        <div className="invoice-filters">
          <div className="invoice-search">
            <input
              type="text"
              placeholder="Search invoice number..."
              value={search}
              onChange={(event) => {
                setLoading(true);
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="sort-filter"
            value={sort}
            onChange={(event) => {
              setLoading(true);
              setSort(event.target.value);
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

          <select
            className="status-filter"
            value={status}
            onChange={(event) => {
              setLoading(true);
              setStatus(event.target.value);
              setPage(1);
            }}
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
                  : `${totalCount} invoice${
                      totalCount !== 1 ? "s" : ""
                    } found`}
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
                    <th>Actions</th>
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
                        {invoice.billingMonth
                          ? new Date(
                              invoice.billingMonth
                            ).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "long",
                            })
                          : "-"}
                      </td>

                      <td className="invoice-amount">
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
                        <span
                          className={`invoice-status ${invoice.status.toLowerCase()}`}
                        >
                          {invoice.status}
                        </span>
                      </td>

                      <td>
                        <div className="invoice-actions">
                          <button
                            className="invoice-action-btn view-btn"
                            onClick={() =>
                              handleView(invoice.id)
                            }
                          >
                            View
                          </button>

                          <button
                            className="invoice-action-btn edit-btn"
                            onClick={() =>
                              handleEdit(invoice.id)
                            }
                            disabled={invoice.status === "Paid"}
                            title={
                              invoice.status === "Paid"
                                ? "Paid invoices cannot be edited"
                                : "Edit invoice"
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="invoice-action-btn delete-btn"
                            onClick={() =>
                              handleDelete(invoice)
                            }
                            disabled={
                              invoice.status === "Paid" ||
                              deletingId === invoice.id
                            }
                            title={
                              invoice.status === "Paid"
                                ? "Paid invoices cannot be deleted"
                                : "Delete invoice"
                            }
                          >
                            {deletingId === invoice.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
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
                onClick={() => {
                  setLoading(true);
                  setPage((previous) => previous - 1);
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
                  setPage((previous) => previous + 1);
                }}
                disabled={page === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </section>
      </main>

      {viewLoading && (
        <div className="invoice-modal-overlay">
          <div className="invoice-modal small-modal">
            <p className="invoice-modal-loading">
              Loading invoice details...
            </p>
          </div>
        </div>
      )}

      {selectedInvoice && !viewLoading && (
        <div
          className="invoice-modal-overlay"
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            className="invoice-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="invoice-modal-header">
              <div>
                <p className="modal-label">
                  INVOICE DETAILS
                </p>

                <h2>
                  {selectedInvoice.invoiceNumber}
                </h2>
              </div>

              <button
                className="modal-close-btn"
                onClick={() => setSelectedInvoice(null)}
              >
                ×
              </button>
            </div>

            <div className="invoice-detail-grid">
              <div>
                <span>Resident</span>
                <strong>
                  Resident #{selectedInvoice.residentId}
                </strong>
              </div>

              <div>
                <span>Apartment</span>
                <strong>
                  Apartment #{selectedInvoice.apartmentId}
                </strong>
              </div>

              <div>
                <span>Billing Month</span>
                <strong>
                  {new Date(
                    selectedInvoice.billingMonth
                  ).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                  })}
                </strong>
              </div>

              <div>
                <span>Due Date</span>
                <strong>
                  {new Date(
                    selectedInvoice.dueDate
                  ).toLocaleDateString()}
                </strong>
              </div>

              <div>
                <span>Status</span>

                <strong>
                  <span
                    className={`invoice-status ${selectedInvoice.status.toLowerCase()}`}
                  >
                    {selectedInvoice.status}
                  </span>
                </strong>
              </div>

              <div>
                <span>Total Amount</span>
                <strong>
                  Rs.{" "}
                  {Number(
                    selectedInvoice.totalAmount
                  ).toLocaleString()}
                </strong>
              </div>
            </div>

            <div className="invoice-items-section">
              <h3>Invoice Charges</h3>

              {selectedInvoice.invoiceItems?.length > 0 ? (
                <div className="invoice-items-list">
                  {selectedInvoice.invoiceItems.map(
                    (item) => (
                      <div
                        className="invoice-item-row"
                        key={item.id}
                      >
                        <div>
                          <strong>
                            {item.description}
                          </strong>

                          <span>{item.chargeType}</span>
                        </div>

                        <strong>
                          Rs.{" "}
                          {Number(
                            item.amount
                          ).toLocaleString()}
                        </strong>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="no-invoice-items">
                  No invoice items found.
                </p>
              )}
            </div>

            <div className="invoice-modal-footer">
              <button
                className="modal-secondary-btn"
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editingInvoice && (
        <div
          className="invoice-modal-overlay"
          onClick={() => {
            if (!saving) {
              setEditingInvoice(null);
            }
          }}
        >
          <div
            className="invoice-modal edit-invoice-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="invoice-modal-header">
              <div>
                <p className="modal-label">
                  EDIT INVOICE
                </p>

                <h2>
                  {editingInvoice.invoiceNumber}
                </h2>
              </div>

              <button
                className="modal-close-btn"
                disabled={saving}
                onClick={() => setEditingInvoice(null)}
              >
                ×
              </button>
            </div>

            <form
              className="invoice-edit-form"
              onSubmit={handleUpdate}
            >
              <div className="invoice-edit-grid">
                <div className="invoice-edit-field">
                  <label>Resident ID</label>

                  <input
                    type="number"
                    name="residentId"
                    min="1"
                    required
                    value={editForm.residentId}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="invoice-edit-field">
                  <label>Apartment ID</label>

                  <input
                    type="number"
                    name="apartmentId"
                    min="1"
                    required
                    value={editForm.apartmentId}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="invoice-edit-field">
                  <label>Billing Month</label>

                  <input
                    type="month"
                    name="billingMonth"
                    required
                    value={editForm.billingMonth}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="invoice-edit-field">
                  <label>Due Date</label>

                  <input
                    type="date"
                    name="dueDate"
                    required
                    value={editForm.dueDate}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="invoice-edit-field">
                  <label>Maintenance Fee</label>

                  <input
                    type="number"
                    name="maintenanceFee"
                    min="0"
                    step="0.01"
                    value={editForm.maintenanceFee}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="invoice-edit-field">
                  <label>Utility Charge</label>

                  <input
                    type="number"
                    name="utilityCharge"
                    min="0"
                    step="0.01"
                    value={editForm.utilityCharge}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="invoice-edit-field">
                  <label>Parking Charge</label>

                  <input
                    type="number"
                    name="parkingCharge"
                    min="0"
                    step="0.01"
                    value={editForm.parkingCharge}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="invoice-edit-field">
                  <label>Facility Charge</label>

                  <input
                    type="number"
                    name="facilityCharge"
                    min="0"
                    step="0.01"
                    value={editForm.facilityCharge}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div className="invoice-modal-footer">
                <button
                  type="button"
                  className="modal-secondary-btn"
                  disabled={saving}
                  onClick={() =>
                    setEditingInvoice(null)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Invoices;