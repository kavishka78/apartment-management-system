using ApartmentManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.DTOs;
using ApartmentManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;

namespace ApartmentManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [Authorize(Roles = PaymentAccess.Roles)]
    [TypeFilter(typeof(PaymentSessionFilter))]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public PaymentsController(
            AppDbContext context,
            IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;

            StripeConfiguration.ApiKey =
                _configuration["Stripe:SecretKey"];
        }


        // POST: api/payments/create
        [Authorize(Roles = PaymentAccess.AdminRoles)]
        [HttpPost("create")]
        public IActionResult CreatePayment(CreatePaymentRequest request) =>
            StatusCode(StatusCodes.Status410Gone, new { message = "Use the Stripe PaymentSheet flow." });

        // POST: api/payments/create-intent
        [HttpPost("create-intent")]
        public async Task<IActionResult> CreatePaymentIntent([FromBody] CreatePaymentIntentRequest request)
        {
            var invoice = await _context.VisibleInvoices(User)
                .Include(i => i.Payments)
                .FirstOrDefaultAsync(i => i.Id == request.InvoiceId);

            if (invoice == null)
            {
                return NotFound(new
                {
                    message = "Invoice not found."
                });
            }

            if (invoice.Status != "Pending" || invoice.TotalAmount <= 0)
            {
                return BadRequest(new
                {
                    message = "This invoice has already been paid."
                });
            }

            var existingPayment = await _context.VisiblePayments(User)
                .AnyAsync(p =>
                    p.InvoiceId == request.InvoiceId &&
                    (p.Status == "Successful" || p.Status == "Verified"));

            if (existingPayment)
            {
                return BadRequest(new
                {
                    message = "A successful payment already exists for this invoice."
                });
            }

            try
            {
                var options = new PaymentIntentCreateOptions
                {
                    // Stripe expects the smallest currency unit.
                    Amount = (long)(invoice.TotalAmount * 100),
                    Currency = "lkr",

                    AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                    {
                        Enabled = true
                    },

                    Metadata = new Dictionary<string, string>
                    {
                        { "invoiceId", invoice.Id.ToString() },
                        { "invoiceNumber", invoice.InvoiceNumber }
                    }
                };

                var service = new PaymentIntentService();
                var paymentIntent = await service.CreateAsync(options, new RequestOptions
                {
                    IdempotencyKey = $"invoice-{invoice.Id}-{options.Amount}-lkr"
                });

                return Ok(new
                {
                    message = "Stripe PaymentIntent created successfully.",
                    paymentIntentId = paymentIntent.Id,
                    clientSecret = paymentIntent.ClientSecret,
                    invoiceId = invoice.Id,
                    invoiceNumber = invoice.InvoiceNumber,
                    amount = invoice.TotalAmount,
                    currency = "lkr"
                });
            }
            catch (StripeException)
            {
                return BadRequest(new
                {
                    message = "Unable to create Stripe PaymentIntent."
                });
            }
        }



// POST: api/payments/confirm-stripe
[HttpPost("confirm-stripe")]
public async Task<IActionResult> ConfirmStripePayment(
    [FromBody] ConfirmStripePaymentRequest request)
{
    if (string.IsNullOrWhiteSpace(request.PaymentIntentId))
    {
        return BadRequest(new
        {
            message = "PaymentIntent ID is required."
        });
    }

    try
    {
        // Get the PaymentIntent directly from Stripe.
        var service = new PaymentIntentService();
        var paymentIntent =
            await service.GetAsync(request.PaymentIntentId);

        // Get invoice ID stored in Stripe metadata.
        if (!paymentIntent.Metadata.TryGetValue(
                "invoiceId",
                out var invoiceIdText) ||
            !int.TryParse(invoiceIdText, out var invoiceId))
        {
            return BadRequest(new
            {
                message = "Invoice information is missing from Stripe payment."
            });
        }

        var invoice = await _context.VisibleInvoices(User)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == invoiceId);

        if (invoice == null)
        {
            return NotFound(new
            {
                message = "Invoice not found."
            });
        }

        // Never trust Flutter alone for payment success.
        if (paymentIntent.Status != "succeeded")
        {
            return BadRequest(new
            {
                message = "Stripe payment has not succeeded.",
                stripeStatus = paymentIntent.Status
            });
        }

        // Verify Stripe amount against our own database.
        var expectedAmount =
            (long)(invoice.TotalAmount * 100);

        if (paymentIntent.Amount != expectedAmount)
        {
            return BadRequest(new
            {
                message = "Stripe payment amount does not match the invoice."
            });
        }

        if (!string.Equals(
                paymentIntent.Currency,
                "lkr",
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                message = "Invalid payment currency."
            });
        }

        // Prevent duplicate local payment records.
        var existingPayment =
            await _context.VisiblePayments(User)
                .FirstOrDefaultAsync(p =>
                    p.InvoiceId == invoice.Id &&
                    (p.Status == "Successful" ||
                     p.Status == "Verified"));

        if (existingPayment != null)
        {
            return Ok(new
            {
                message = "Payment already recorded.",
                paymentId = existingPayment.Id,
                existingPayment.PaymentReference,
                existingPayment.Status
            });
        }

        string? cardLastFourDigits = null;
        if (!string.IsNullOrWhiteSpace(paymentIntent.PaymentMethodId))
        {
            try
            {
                var paymentMethod = await new PaymentMethodService()
                    .GetAsync(paymentIntent.PaymentMethodId);
                cardLastFourDigits = paymentMethod.Card?.Last4;
            }
            catch (StripeException)
            {
                // Keep recording a verified payment if Stripe cannot return
                // optional card display details.
            }
        }
        if (string.IsNullOrWhiteSpace(cardLastFourDigits) &&
            !string.IsNullOrWhiteSpace(paymentIntent.LatestChargeId))
        {
            try
            {
                var charge = await new ChargeService()
                    .GetAsync(paymentIntent.LatestChargeId);
                cardLastFourDigits = charge.PaymentMethodDetails?.Card?.Last4;
            }
            catch (StripeException)
            {
                // Card digits are optional display information.
            }
        }

        var payment = new Payment
        {
            InvoiceId = invoice.Id,

            PaymentReference =
                $"PAY-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",

            Amount = invoice.TotalAmount,
            PaymentMethod = "Stripe Card",
            CardLastFourDigits = cardLastFourDigits,
            Status = "Successful",
            PaidAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Stripe payment verified and recorded successfully.",
            paymentId = payment.Id,
            payment.PaymentReference,
            payment.InvoiceId,
            payment.Amount,
            payment.PaymentMethod,
            payment.Status,
            payment.PaidAt,
            stripePaymentIntentId = paymentIntent.Id
        });
    }
    catch (StripeException)
    {
        return BadRequest(new
        {
            message = "Unable to verify Stripe payment."
        });
    }
}



        // POST: api/payments/1/verify
[Authorize(Roles = PaymentAccess.AdminRoles)]
[HttpPost("{id}/verify")]
public async Task<IActionResult> VerifyPayment(int id)
{
    var payment = await _context.VisiblePayments(User)
        .Include(p => p.Invoice)
        .Include(p => p.Receipt)
        .FirstOrDefaultAsync(p => p.Id == id);

    if (payment == null)
    {
        return NotFound(new
        {
            message = "Payment not found."
        });
    }

    if (payment.Status == "Verified")
    {
        return BadRequest(new
        {
            message = "Payment has already been verified."
        });
    }

    if (payment.Status != "Successful")
    {
        return BadRequest(new
        {
            message = "Only successful payments can be verified."
        });
    }

    if (payment.Invoice == null)
    {
        return BadRequest(new
        {
            message = "Invoice related to this payment was not found."
        });
    }

    // Verify payment
    payment.Status = "Verified";

    // Mark invoice as paid
    payment.Invoice.Status = "Paid";

    // Generate receipt
    var receipt = new Receipt
    {
        PaymentId = payment.Id,
        ReceiptNumber =
            $"REC-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
        IssuedAt = DateTime.UtcNow
    };

    _context.Receipts.Add(receipt);

    await _context.SaveChangesAsync();

    return Ok(new
    {
        message = "Payment verified successfully.",
        paymentId = payment.Id,
        paymentReference = payment.PaymentReference,
        paymentStatus = payment.Status,
        invoiceId = payment.InvoiceId,
        invoiceStatus = payment.Invoice.Status,
        receiptNumber = receipt.ReceiptNumber,
        receiptIssuedAt = receipt.IssuedAt
    });
}

// GET: api/payments
[HttpGet]
public async Task<IActionResult> GetPayments(
    string? search = null,
    string? status = null,
    string? paymentMethod = null,
    int? invoiceId = null,
    string sortBy = "paidAt",
    string sortOrder = "desc",
    int page = 1,
    int pageSize = 10)
{
    if (page < 1)
        page = 1;

    if (pageSize < 1 || pageSize > 100)
        pageSize = 10;

    var query = _context.VisiblePayments(User)
        .Include(p => p.Invoice)
        .Include(p => p.Receipt)
        .AsQueryable();

    // Search by payment reference or invoice number
if (!string.IsNullOrWhiteSpace(search))
{
    var searchTerm = search.ToLower();

    query = query.Where(p =>
        p.PaymentReference.ToLower().Contains(searchTerm) ||
        (p.Invoice != null &&
         p.Invoice.InvoiceNumber.ToLower().Contains(searchTerm)));
}

    // Filter by payment status
    if (!string.IsNullOrWhiteSpace(status))
    {
        query = query.Where(p =>
            p.Status.ToLower() == status.ToLower());
    }

    // Filter by payment method
    if (!string.IsNullOrWhiteSpace(paymentMethod))
    {
        query = query.Where(p =>
            p.PaymentMethod.ToLower() == paymentMethod.ToLower());
    }

    // Filter by invoice
    if (invoiceId.HasValue)
    {
        query = query.Where(p =>
            p.InvoiceId == invoiceId.Value);
    }

    // Sorting
    bool ascending = sortOrder.ToLower() == "asc";

    query = sortBy.ToLower() switch
    {
        "amount" => ascending
            ? query.OrderBy(p => p.Amount)
            : query.OrderByDescending(p => p.Amount),

        "status" => ascending
            ? query.OrderBy(p => p.Status)
            : query.OrderByDescending(p => p.Status),

        _ => ascending
            ? query.OrderBy(p => p.PaidAt)
            : query.OrderByDescending(p => p.PaidAt)
    };

    var totalCount = await query.CountAsync();

    var payments = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(p => new
        {
            p.Id,
            p.PaymentReference,
            p.InvoiceId,
            p.Amount,
            p.PaymentMethod,
            p.Status,
            p.PaidAt,
            p.CardLastFourDigits,

            InvoiceNumber = p.Invoice != null
                ? p.Invoice.InvoiceNumber
                : null,

            ReceiptNumber = p.Receipt != null
                ? p.Receipt.ReceiptNumber
                : null
        })
        .ToListAsync();

    return Ok(new
    {
        items = payments,
        totalCount,
        page,
        pageSize,
        totalPages = (int)Math.Ceiling(
            totalCount / (double)pageSize)
    });
}

// GET: api/payments/2/receipt
[HttpGet("{id}/receipt")]
public async Task<IActionResult> GetReceipt(int id)
{
    var payment = await _context.VisiblePayments(User)
        .Include(p => p.Invoice)
        .Include(p => p.Receipt)
        .FirstOrDefaultAsync(p => p.Id == id);

    if (payment == null)
    {
        return NotFound(new
        {
            message = "Payment not found."
        });
    }

    if (payment.Status != "Verified" || payment.Receipt == null)
    {
        return BadRequest(new
        {
            message = "Receipt is only available for verified payments."
        });
    }

    return Ok(new
    {
        receiptId = payment.Receipt.Id,
        payment.Receipt.ReceiptNumber,
        payment.Receipt.IssuedAt,

        paymentId = payment.Id,
        payment.PaymentReference,
        payment.Amount,
        payment.PaymentMethod,
        payment.PaidAt,
        payment.CardLastFourDigits,

        invoiceId = payment.InvoiceId,
        invoiceNumber = payment.Invoice?.InvoiceNumber,
        residentId = payment.Invoice?.ResidentId,
        apartmentId = payment.Invoice?.ApartmentId
    });
}



// GET: api/payments/overdue
[HttpGet("overdue")]
public async Task<IActionResult> GetOverdueInvoices()
{
    var now = DateTime.UtcNow;

    var overdueInvoices = await _context.VisibleInvoices(User)
        .Where(i => i.DueDate < now && i.Status != "Paid" &&
            !i.Payments.Any(p => p.Status == "Successful" || p.Status == "Verified"))
        .OrderBy(i => i.DueDate)
        .Select(i => new
        {
            i.Id,
            i.InvoiceNumber,
            i.ResidentId,
            i.ApartmentId,
            i.TotalAmount,
            i.DueDate,
            i.Status,

            DaysOverdue = (now - i.DueDate).Days
        })
        .ToListAsync();

    return Ok(overdueInvoices);
}

    }
}
