using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.DTOs;
using ApartmentManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApartmentManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PaymentsController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/payments/create
        [HttpPost("create")]
        public async Task<IActionResult> CreatePayment(CreatePaymentRequest request)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Payments)
                .FirstOrDefaultAsync(i => i.Id == request.InvoiceId);

            if (invoice == null)
            {
                return NotFound(new
                {
                    message = "Invoice not found."
                });
            }

            if (invoice.Status == "Paid")
            {
                return BadRequest(new
                {
                    message = "This invoice has already been paid."
                });
            }

            // Prevent duplicate successful or verified payments
                var existingPayment = await _context.Payments
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


            if (request.Amount != invoice.TotalAmount)
            {
                return BadRequest(new
                {
                    message = $"Payment amount must be {invoice.TotalAmount}."
                });
            }

            if (request.PaymentMethod != "Card")
            {
                return BadRequest(new
                {
                    message = "Only card payments are supported in this demo."
                });
            }

            // Basic demo validation
            var cleanCardNumber = request.CardNumber.Replace(" ", "");

            if (cleanCardNumber.Length != 16 ||
                !cleanCardNumber.All(char.IsDigit))
            {
                return BadRequest(new
                {
                    message = "Invalid card number."
                });
            }

            if (request.Cvv.Length != 3 ||
                !request.Cvv.All(char.IsDigit))
            {
                return BadRequest(new
                {
                    message = "Invalid CVV."
                });
            }

            var payment = new Payment
            {
                InvoiceId = invoice.Id,

                PaymentReference =
                    $"PAY-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",

                Amount = request.Amount,
                PaymentMethod = "Card",
                Status = "Successful",
                PaidAt = DateTime.UtcNow,

                // Only last 4 digits are stored
                CardLastFourDigits = cleanCardNumber[^4..]
            };

            _context.Payments.Add(payment);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Demo card payment successful.",
                payment.Id,
                payment.PaymentReference,
                payment.Amount,
                payment.Status,
                payment.PaidAt,
                payment.CardLastFourDigits
            });
        }

        // POST: api/payments/1/verify
[HttpPost("{id}/verify")]
public async Task<IActionResult> VerifyPayment(int id)
{
    var payment = await _context.Payments
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

    var query = _context.Payments
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
    var payment = await _context.Payments
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

    var overdueInvoices = await _context.Invoices
        .Where(i => i.DueDate < now && i.Status != "Paid")
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