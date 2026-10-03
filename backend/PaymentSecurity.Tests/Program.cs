using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using ApartmentManagement.Api.Controllers;
using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Models;
using ApartmentManagement.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Production" });
builder.Logging.ClearProviders();
builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?> {
    ["Jwt:Key"] = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48)),
    ["Jwt:Issuer"] = "payment-security-tests", ["Jwt:Audience"] = "payment-security-tests",
    ["Stripe:SecretKey"] = "test-placeholder-never-sent",
});
var db = new TestData();
var resident = new Resident { Id = 101, TenantId = 1, FullName = "Fixture resident", Email = "one@example.invalid" };
db.Residents.Add(resident);
db.Residents.Add(new Resident { Id = 202, TenantId = 1, Email = "two@example.invalid" });
db.Residents.Add(new Resident { Id = 303, TenantId = 2, Email = "three@example.invalid" });
var admin = new UserAccount { Id = 101, TenantId = 1, Role = "ApartmentAdmin", Name = "Admin", Email = "admin@example.invalid" };
db.UserAccounts.Add(admin); // Deliberately collides with Resident.Id; models remain separate.
db.UserAccounts.Add(new UserAccount { Id = 9, Role = "SuperAdmin" });
db.UserAccounts.Add(new UserAccount { Id = 10, Role = "Technician" });
var residentAccount = new UserAccount { Id = 707, TenantId = 1, Role = "Resident", Email = resident.Email };
residentAccount.PasswordHash = new Microsoft.AspNetCore.Identity.PasswordHasher<UserAccount>()
    .HashPassword(residentAccount, "fixture-password");
db.UserAccounts.Add(residentAccount);
for (var n = 1; n <= 4; n++) db.Invoices.Add(new Invoice {
    Id = n, ResidentId = n == 2 ? 202 : n == 3 ? 303 : 101,
    ApartmentId = 1, InvoiceNumber = $"FIXTURE-{n}", TotalAmount = 100,
    DueDate = DateTime.UtcNow.AddDays(10), BillingMonth = DateTime.UtcNow.AddDays(-10),
});
db.Payments.Add(new Payment { Id = 1, InvoiceId = 1, Amount = 100, Status = "Successful" });
db.Payments.Add(new Payment { Id = 2, InvoiceId = 2, Amount = 100, Status = "Verified" });
db.Receipts.Add(new Receipt { Id = 1, PaymentId = 2, ReceiptNumber = "OTHER-RECEIPT" });
await db.SaveChangesAsync();

builder.Services.AddSingleton<AppDbContext>(db);
builder.Services.AddSingleton<JwtTokenService>();
builder.Services.AddControllers().AddApplicationPart(typeof(InvoicesController).Assembly)
    .AddJsonOptions(o => o.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o => {
    o.TokenValidationParameters = new TokenValidationParameters {
        ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true, ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"], ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = JwtTokenService.GetKey(builder.Configuration), ClockSkew = TimeSpan.FromMinutes(1),
    };
});
builder.Services.AddAuthorization();
await using var app = builder.Build();
app.UseAuthentication(); app.UseAuthorization(); app.MapControllers();
app.Urls.Add("http://127.0.0.1:0");
await app.StartAsync();
var address = app.Services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>()!.Addresses.Single();
using var client = new HttpClient { BaseAddress = new Uri(address) };
var tokens = app.Services.GetRequiredService<JwtTokenService>();
var jwt = tokens.CreateResidentToken(resident);
var adminJwt = tokens.CreateToken(admin);
var stripe = new TestStripe();
Stripe.StripeConfiguration.ApiKey = builder.Configuration["Stripe:SecretKey"];
Stripe.StripeConfiguration.StripeClient = new Stripe.StripeClient(
    builder.Configuration["Stripe:SecretKey"], httpClient: stripe);
var passed = 0;

void Check(bool ok, string name) { if (!ok) throw new Exception($"FAIL: {name}"); passed++; }
async Task<JsonElement?> Call(HttpMethod method, string path, string? token, int status, object? body = null)
{
    using var req = new HttpRequestMessage(method, path);
    if (token != null) req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
    if (body != null) req.Content = JsonContent.Create(body);
    using var response = await client.SendAsync(req);
    Check((int)response.StatusCode == status, $"{method} {path}: expected {status}, got {(int)response.StatusCode}");
    var text = await response.Content.ReadAsStringAsync();
    return text.StartsWith('{') || text.StartsWith('[') ? JsonDocument.Parse(text).RootElement.Clone() : null;
}
string ExpiredToken()
{
    var token = new JwtSecurityToken(builder.Configuration["Jwt:Issuer"], builder.Configuration["Jwt:Audience"],
        [new Claim(ClaimTypes.Role, "Resident"), new Claim("residentId", "101"), new Claim("tenantId", "1")],
        expires: DateTime.UtcNow.AddMinutes(-10),
        signingCredentials: new SigningCredentials(JwtTokenService.GetKey(builder.Configuration), SecurityAlgorithms.HmacSha256));
    return new JwtSecurityTokenHandler().WriteToken(token);
}

try
{
    foreach (var token in new string?[] { null, "invalid", ExpiredToken() })
        foreach (var path in new[] { "/api/invoices", "/api/payments", "/api/payments/1/receipt", "/api/reports/collections" })
            await Call(HttpMethod.Get, path, token, 401);
    await Call(HttpMethod.Get, "/api/invoices", tokens.CreateToken(db.UserAccounts.First(u => u.Id == 10)), 403);
    await Call(HttpMethod.Get, "/api/invoices", tokens.CreateToken(new UserAccount { Id = 101, Role = "Resident", TenantId = 1 }), 401);
    var me = (await Call(HttpMethod.Get, "/api/v1/auth/me", jwt, 200))!.Value;
    Check(me.GetProperty("role").GetString() == "Resident", "Resident /me does not resolve colliding UserAccount");
    me = (await Call(HttpMethod.Get, "/api/v1/auth/me", adminJwt, 200))!.Value;
    Check(me.GetProperty("role").GetString() == "ApartmentAdmin", "Admin /me preserved");
    await Call(HttpMethod.Post, "/api/v1/auth/resident/dev-login", null, 404, new { email = resident.Email });
    var login = (await Call(HttpMethod.Post, "/api/v1/auth/login", null, 200,
        new { email = resident.Email, password = "fixture-password" }))!.Value;
    Check(login.GetProperty("user").GetProperty("id").GetInt32() == 707 &&
        login.GetProperty("resident").GetProperty("id").GetInt32() == 101, "Login maps resident by unique tenant/email, never UserAccount.Id");
    var loginToken = login.GetProperty("token").GetString()!;
    await Call(HttpMethod.Get, "/api/invoices/1", loginToken, 200);
    await Call(HttpMethod.Get, "/api/invoices/2", loginToken, 404);
    resident.Status = "Inactive";
    await Call(HttpMethod.Get, "/api/invoices", jwt, 401);
    resident.Status = "Active";

    var rows = (await Call(HttpMethod.Get, "/api/invoices?residentId=202", jwt, 200))!.Value.GetProperty("items");
    Check(rows.GetArrayLength() == 2 && rows.EnumerateArray().All(i => i.GetProperty("residentId").GetInt32() == 101), "Query ID cannot change resident scope");
    await Call(HttpMethod.Get, "/api/invoices/2", jwt, 404);
    await Call(HttpMethod.Get, "/api/invoices/1", jwt, 200);
    await Call(HttpMethod.Get, "/api/payments/2/receipt", jwt, 404);
    rows = (await Call(HttpMethod.Get, "/api/payments?invoiceId=2", jwt, 200))!.Value.GetProperty("items");
    Check(rows.GetArrayLength() == 0, "Cannot read other invoice's payment history");
    await Call(HttpMethod.Post, "/api/payments/create-intent", jwt, 404, new { invoiceId = 2 });
    await Call(HttpMethod.Post, "/api/payments/create-intent", jwt, 400, new { invoiceId = 1 });
    Check(stripe.Calls == 0, "Unauthorized/non-payable invoices never contact Stripe");
    await Call(HttpMethod.Post, "/api/payments/create-intent", jwt, 200, new { invoiceId = 4 });
    var confirmBody = new { paymentIntentId = "pi_fixture" };
    stripe.InvoiceId = 2;
    await Call(HttpMethod.Post, "/api/payments/confirm-stripe", jwt, 404, confirmBody);
    stripe.InvoiceId = 4;
    stripe.Status = "requires_payment_method";
    await Call(HttpMethod.Post, "/api/payments/confirm-stripe", jwt, 400, confirmBody);
    stripe.Status = "succeeded"; stripe.Amount = 1;
    await Call(HttpMethod.Post, "/api/payments/confirm-stripe", jwt, 400, confirmBody);
    stripe.Amount = 10000; stripe.Currency = "usd";
    await Call(HttpMethod.Post, "/api/payments/confirm-stripe", jwt, 400, confirmBody);
    stripe.Currency = "lkr";
    await Call(HttpMethod.Post, "/api/payments/confirm-stripe", jwt, 200, confirmBody);
    Check(db.Invoices.First(i => i.Id == 4).Status == "Pending" && !db.Invoices.First(i => i.Id == 4).CanPay,
        "Stripe success leaves invoice pending and prevents Pay Now");
    await Call(HttpMethod.Post, "/api/payments/confirm-stripe", jwt, 200, confirmBody);
    Check(db.Payments.Count(p => p.InvoiceId == 4) == 1, "Repeated Stripe confirmation is idempotent");
    foreach (var path in new[] { "/api/payments/1/verify", "/api/payments/create", "/api/invoices", "/api/invoices/generate-monthly" })
        await Call(HttpMethod.Post, path, jwt, 403, new { });
    await Call(HttpMethod.Put, "/api/invoices/1", jwt, 403, new { });
    await Call(HttpMethod.Delete, "/api/invoices/1", jwt, 403);
    await Call(HttpMethod.Get, "/api/reports/collections", jwt, 403);
    await Call(HttpMethod.Get, "/api/invoices/3", adminJwt, 404);
    await Call(HttpMethod.Get, "/api/invoices/3", tokens.CreateToken(db.UserAccounts.First(u => u.Id == 9)), 200);
    await Call(HttpMethod.Get, "/api/reports/collections", adminJwt, 200);
    await Call(HttpMethod.Get, "/api/payments/overdue", adminJwt, 200);
    await Call(HttpMethod.Post, "/api/payments/1/verify", adminJwt, 200);
    Check(db.Invoices.First(i => i.Id == 1).Status == "Paid" && db.Payments.First(p => p.Id == 1).Status == "Verified", "Admin verification updates invoice/payment");
    await Call(HttpMethod.Get, "/api/payments/1/receipt", jwt, 200);
    await Call(HttpMethod.Post, "/api/payments/1/verify", adminJwt, 400);
    var invoiceBody = new { residentId = 101, apartmentId = 1, billingMonth = "2030-01-01T00:00:00Z", dueDate = "2030-01-15T00:00:00Z",
        invoiceItems = new[] { new { description = "Fixture", chargeType = "Maintenance", amount = 55 } } };
    var created = (await Call(HttpMethod.Post, "/api/invoices", adminJwt, 201, invoiceBody))!.Value;
    var createdId = created.GetProperty("id").GetInt32();
    await Call(HttpMethod.Put, $"/api/invoices/{createdId}", adminJwt, 200, invoiceBody);
    await Call(HttpMethod.Delete, $"/api/invoices/{createdId}", adminJwt, 204);
    await Call(HttpMethod.Post, "/api/invoices/generate-monthly", adminJwt, 200, new {
        residentId = 101, apartmentId = 1, billingMonth = "2031-01-01T00:00:00Z", dueDate = "2031-01-15T00:00:00Z", maintenanceFee = 100 });
    await Call(HttpMethod.Post, "/api/invoices/generate-monthly", adminJwt, 403, new {
        residentId = 303, apartmentId = 1, billingMonth = "2031-01-01T00:00:00Z", dueDate = "2031-01-15T00:00:00Z", maintenanceFee = 100 });

    // Verify that the actual PostgreSQL provider can translate ownership predicates without opening a connection.
    using var sqlDb = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseNpgsql("Host=localhost;Database=unused").Options);
    var principal = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Role, "Resident"), new Claim("residentId", "101"), new Claim("tenantId", "1")], "test"));
    Check(sqlDb.VisibleInvoices(principal).ToQueryString().Contains("ResidentId"), "PostgreSQL invoice scope translates");
    Check(sqlDb.VisiblePayments(principal).ToQueryString().Contains("ResidentId"), "PostgreSQL payment scope translates");
    Console.WriteLine($"PASS: {passed} JWT, ownership, admin workflow and PostgreSQL query assertions. No database was contacted.");
    if (args.Length > 0)
    {
        // Pass only short-lived fixture credentials to the child; never print JWTs.
        var root = new DirectoryInfo(AppContext.BaseDirectory);
        while (!Directory.Exists(Path.Combine(root.FullName, "agent-services"))) root = root.Parent!;
        var start = new System.Diagnostics.ProcessStartInfo(Path.GetFullPath(args[0], root.FullName)) {
            WorkingDirectory = Path.Combine(root.FullName, "agent-services/payment-agent"),
            UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true,
        };
        start.ArgumentList.Add("integration_probe.py");
        start.Environment["BACKEND_API_URL"] = address + "/api";
        start.Environment["PAYMENT_TEST_JWT"] = jwt;
        start.Environment["PAYMENT_TEST_EXPIRED_JWT"] = ExpiredToken();
        using var probe = System.Diagnostics.Process.Start(start)!;
        var probeOutput = probe.StandardOutput.ReadToEndAsync();
        var probeError = probe.StandardError.ReadToEndAsync();
        await probe.WaitForExitAsync();
        Console.Write(await probeOutput);
        if (probe.ExitCode != 0) Console.Write(await probeError);
        Check(probe.ExitCode == 0, "Python/.NET integration probe");
    }
}
finally { await app.StopAsync(); }
