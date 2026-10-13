# Payment file map

Use this map to locate the payment module during a code walkthrough.

| Area | Repository location | Purpose |
| --- | --- | --- |
| Models | `backend/ApartmentManagement.Api/Models/Payment/` | Invoices, invoice items, payments and receipts |
| Controllers | `backend/ApartmentManagement.Api/Controllers/Payment/` | Invoice operations, payment processing and reports |
| Request DTOs | `backend/ApartmentManagement.Api/DTOs/Payment/` | Request data structures |
| Access rules | `backend/ApartmentManagement.Api/Services/PaymentAccess.cs` | Resident and tenant scope |
| Session checks | `backend/ApartmentManagement.Api/Services/PaymentSessionFilter.cs` | Active account validation |
| Admin pages | `web/apartment-management-web/src/pages/payment/` | Dashboard, invoices, payments and reports |
| Web components | `web/apartment-management-web/src/components/payment/` | Shared payment interface components |
| Resident screens | `mobile/lib/screens/payment/` | Invoice, checkout, history, receipt and chat screens |
| Mobile API service | `mobile/lib/services/payment/payment_api_service.dart` | Backend requests |
| Payment agent | `agent-services/payment-agent/` | Chat API and backend integration |
| Backend checks | `backend/PaymentSecurity.Tests/` | Executable security and workflow checks |

Shared authentication, database configuration and notification services are outside the payment folders.
