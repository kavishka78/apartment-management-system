# Payment data model

The payment entities are in `backend/ApartmentManagement.Api/Models/Payment/`.

- `Invoice` identifies the resident and apartment, billing month, due date, total and status.
- `InvoiceItem` represents an individual invoice charge.
- `Payment` references an invoice and records the amount, method, reference and payment status.
- `Receipt` references a payment and records its receipt number and issue time.

An invoice exposes collections of invoice items and payments. A payment has an invoice navigation property and a receipt navigation property. Database relationship configuration is in `backend/ApartmentManagement.Api/Data/AppDbContext.cs`.

`Invoice.CanPay` is computed rather than stored as a database column. It requires a Pending invoice with no Successful or Verified payment.

`Invoice.AddOverduePenalty` adds a 5% charge only when the invoice is Pending, its due date is before the supplied UTC date, no Successful or Verified payment exists, and no OverduePenalty item exists. The amount is rounded to two decimal places, with midpoint rounding away from zero. A non-positive penalty is skipped.

`FacilityBookingId` is optional. Its unique database index prevents duplicate invoicing of the same facility booking.
