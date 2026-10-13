# Running payment checks

From the repository root, run:

```powershell
dotnet run --project .\backend\PaymentSecurity.Tests\PaymentSecurity.Tests.csproj
```

This project is a custom executable test suite. Its entry point is `Program.cs`; the command uses `dotnet run`.

| File | Role |
| --- | --- |
| `Program.cs` | Starts the local test server, sends requests and checks responses and state |
| `TestData.cs` | Supplies queryable fixtures and fake notifications |
| `TestStripe.cs` | Supplies simulated Stripe PaymentIntent responses |

The suite exercises JWT validation, ownership, tenant boundaries, role permissions, Stripe confirmation and admin workflows. It also checks PostgreSQL query translation without opening a database connection. It does not charge cards or contact the production database.

Successful execution prints a `PASS:` message with the assertion count. A failed check throws an exception containing `FAIL:`. The count represents assertions, including response checks, rather than individually named test methods.

Additional checks are in `agent-services/payment-agent/test_security.py`, `agent-services/payment-agent/integration_probe.py`, and `mobile/test/payment_chat_test.dart`. See the payment agent README for their setup and commands.
