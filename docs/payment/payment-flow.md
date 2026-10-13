# Payment workflow

1. An admin creates or generates an invoice.
2. The resident views the invoice through the mobile payment screens.
3. The backend creates a Stripe PaymentIntent for an eligible invoice.
4. The resident completes checkout through the existing Stripe PaymentSheet.
5. The backend retrieves the PaymentIntent and validates invoice ownership, success status, amount and currency before recording the payment.
6. A Successful payment awaits admin verification. The invoice remains Pending, but `CanPay` prevents another payment.
7. Admin verification changes the payment to Verified, changes the invoice to Paid and creates a receipt.

Repeated confirmation returns the existing payment instead of creating another transaction.

For a walkthrough, open `InvoicesController.cs`, `PaymentsController.cs`, `card_payment_screen.dart`, and then the payment tests. The payment agent offers read-only financial assistance; checkout uses the mobile payment flow.
