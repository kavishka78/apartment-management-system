using System.Net;
using System.Text.Json;
using Stripe;

sealed class TestStripe : IHttpClient
{
    public int InvoiceId { get; set; } = 4;
    public string Status { get; set; } = "succeeded";
    public long Amount { get; set; } = 10000;
    public string Currency { get; set; } = "lkr";
    public int Calls { get; private set; }

    public Task<StripeStreamedResponse> MakeStreamingRequestAsync(StripeRequest request, CancellationToken cancellationToken = default)
        => throw new NotSupportedException("PaymentIntent tests do not stream responses.");

    public Task<StripeResponse> MakeRequestAsync(StripeRequest request, CancellationToken cancellationToken = default)
    {
        Calls++;
        using var response = new HttpResponseMessage(HttpStatusCode.OK);
        return Task.FromResult(new StripeResponse(HttpStatusCode.OK, response.Headers, JsonSerializer.Serialize(new {
            id = "pi_fixture", @object = "payment_intent", status = Status,
            amount = Amount, currency = Currency, client_secret = "fixture-client-secret",
            metadata = new { invoiceId = InvoiceId.ToString() },
        })));
    }
}
