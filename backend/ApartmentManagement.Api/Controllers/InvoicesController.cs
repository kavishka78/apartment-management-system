using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApartmentManagement.Api.DTOs;

namespace ApartmentManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InvoicesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InvoicesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/invoices
        [HttpGet]
public async Task<IActionResult> GetInvoices(
    string? search = null,
    string? status = null,
    int? residentId = null,
    string sortBy = "createdAt",
    string sortOrder = "desc",
    int page = 1,
    int pageSize = 10)
{
    if (page < 1)
        page = 1;

    if (pageSize < 1 || pageSize > 100)
        pageSize = 10;

    var query = _context.Invoices
        .Include(i => i.InvoiceItems)
        .Include(i => i.Payments)
        .AsQueryable();

    // Search by invoice number
    if (!string.IsNullOrWhiteSpace(search))
    {
        query = query.Where(i =>
            i.InvoiceNumber.ToLower().Contains(search.ToLower()));
    }

    // Filter by status
    if (!string.IsNullOrWhiteSpace(status))
    {
        query = query.Where(i =>
            i.Status.ToLower() == status.ToLower());
    }

    // Filter by resident
    if (residentId.HasValue)
    {
        query = query.Where(i =>
            i.ResidentId == residentId.Value);
    }

    // Sorting
    bool ascending = sortOrder.ToLower() == "asc";

    query = sortBy.ToLower() switch
    {
        "duedate" => ascending
            ? query.OrderBy(i => i.DueDate)
            : query.OrderByDescending(i => i.DueDate),

        "totalamount" => ascending
            ? query.OrderBy(i => i.TotalAmount)
            : query.OrderByDescending(i => i.TotalAmount),

        "billingmonth" => ascending
            ? query.OrderBy(i => i.BillingMonth)
            : query.OrderByDescending(i => i.BillingMonth),

        _ => ascending
            ? query.OrderBy(i => i.CreatedAt)
            : query.OrderByDescending(i => i.CreatedAt)
    };

    var totalCount = await query.CountAsync();

    var invoices = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    return Ok(new
    {
        items = invoices,
        totalCount,
        page,
        pageSize,
        totalPages = (int)Math.Ceiling(
            totalCount / (double)pageSize)
    });
}

        // GET: api/invoices/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Invoice>> GetInvoice(int id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.InvoiceItems)
                .Include(i => i.Payments)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null)
            {
                return NotFound();
            }

            return invoice;
        }

        // POST: api/invoices
        [HttpPost]
        public async Task<ActionResult<Invoice>> CreateInvoice(Invoice invoice)
        {
            invoice.InvoiceNumber =
                $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

            invoice.CreatedAt = DateTime.UtcNow;
            invoice.Status = "Pending";

            invoice.TotalAmount = invoice.InvoiceItems.Sum(item => item.Amount);

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetInvoice),
                new { id = invoice.Id },
                invoice
            );
        }

        // PUT: api/invoices/5
[HttpPut("{id}")]
public async Task<IActionResult> UpdateInvoice(int id, Invoice updatedInvoice)
{
    var invoice = await _context.Invoices
        .Include(i => i.InvoiceItems)
        .FirstOrDefaultAsync(i => i.Id == id);

    if (invoice == null)
    {
        return NotFound();
    }

    invoice.ResidentId = updatedInvoice.ResidentId;
    invoice.ApartmentId = updatedInvoice.ApartmentId;
    invoice.BillingMonth = updatedInvoice.BillingMonth;
    invoice.DueDate = updatedInvoice.DueDate;

    // Remove old invoice items
    _context.InvoiceItems.RemoveRange(invoice.InvoiceItems);

    // Add updated invoice items
    invoice.InvoiceItems = updatedInvoice.InvoiceItems;

    // Recalculate total on the server
    invoice.TotalAmount = updatedInvoice.InvoiceItems.Sum(item => item.Amount);

    await _context.SaveChangesAsync();

    return Ok(invoice);
}


// DELETE: api/invoices/5
[HttpDelete("{id}")]
public async Task<IActionResult> DeleteInvoice(int id)
{
    var invoice = await _context.Invoices
        .Include(i => i.InvoiceItems)
        .FirstOrDefaultAsync(i => i.Id == id);

    if (invoice == null)
    {
        return NotFound();
    }

    _context.Invoices.Remove(invoice);
    await _context.SaveChangesAsync();

    return NoContent();
}


// POST: api/invoices/generate-monthly
[HttpPost("generate-monthly")]
public async Task<IActionResult> GenerateMonthlyInvoice(
    GenerateMonthlyInvoiceRequest request)
{
    if (request.DueDate <= request.BillingMonth)
    {
        return BadRequest(new
        {
            message = "Due date must be after the billing month."
        });
    }

    if (request.MaintenanceFee < 0 ||
        request.UtilityCharge < 0 ||
        request.ParkingCharge < 0 ||
        request.FacilityCharge < 0)
    {
        return BadRequest(new
        {
            message = "Charges cannot be negative."
        });
    }

    // Prevent duplicate monthly invoices
    var existingInvoice = await _context.Invoices
        .AnyAsync(i =>
            i.ResidentId == request.ResidentId &&
            i.ApartmentId == request.ApartmentId &&
            i.BillingMonth.Year == request.BillingMonth.Year &&
            i.BillingMonth.Month == request.BillingMonth.Month);

    if (existingInvoice)
    {
        return BadRequest(new
        {
            message = "An invoice already exists for this resident and billing month."
        });
    }

    var items = new List<InvoiceItem>();

    if (request.MaintenanceFee > 0)
    {
        items.Add(new InvoiceItem
        {
            Description = "Monthly Maintenance Fee",
            ChargeType = "Maintenance",
            Amount = request.MaintenanceFee
        });
    }

    if (request.UtilityCharge > 0)
    {
        items.Add(new InvoiceItem
        {
            Description = "Utility Charge",
            ChargeType = "Utility",
            Amount = request.UtilityCharge
        });
    }

    if (request.ParkingCharge > 0)
    {
        items.Add(new InvoiceItem
        {
            Description = "Parking Charge",
            ChargeType = "Parking",
            Amount = request.ParkingCharge
        });
    }

    if (request.FacilityCharge > 0)
    {
        items.Add(new InvoiceItem
        {
            Description = "Facility Charge",
            ChargeType = "Facility",
            Amount = request.FacilityCharge
        });
    }

    if (items.Count == 0)
    {
        return BadRequest(new
        {
            message = "At least one charge must be greater than zero."
        });
    }

    var invoice = new Invoice
    {
        ResidentId = request.ResidentId,
        ApartmentId = request.ApartmentId,

        InvoiceNumber =
            $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",

        BillingMonth = request.BillingMonth,
        DueDate = request.DueDate,
        Status = "Pending",
        CreatedAt = DateTime.UtcNow,
        InvoiceItems = items,
        TotalAmount = items.Sum(i => i.Amount)
    };

    _context.Invoices.Add(invoice);
    await _context.SaveChangesAsync();

    return Ok(new
    {
        message = "Monthly invoice generated successfully.",
        invoice.Id,
        invoice.InvoiceNumber,
        invoice.ResidentId,
        invoice.ApartmentId,
        invoice.BillingMonth,
        invoice.DueDate,
        invoice.TotalAmount,
        invoice.Status,
        invoice.InvoiceItems
    });
}

    }
}