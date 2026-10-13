# Payment access rules

Payment endpoints combine JWT authentication, role restrictions and scoped queries.

- Residents see their own invoices and payments using signed resident and tenant claims.
- Apartment admins are restricted to residents within their tenant.
- SuperAdmin has global scope.
- `PaymentSessionFilter` checks that the account or resident remains active.
- `PaymentAccess` provides scoped invoice and payment queries.

A resident-supplied query ID cannot expand the resident's scope. Requests for another resident's records return 404. Admin-only operations, such as verification and reporting, reject resident access with 403. Missing, invalid or expired authentication is checked separately and returns 401.

Stripe confirmation checks the server-retrieved PaymentIntent rather than trusting a client claim that a payment succeeded.

See `backend/PaymentSecurity.Tests/Program.cs` for executable checks of these rules, including overlapping Resident and UserAccount IDs.
