using ApartmentManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApartmentManagement.Api.DTOs;

namespace ApartmentManagement.Api.Controllers
{
    [Route("api/[controller]")]
    [Authorize(Roles = PaymentAccess.Roles)]
    [TypeFilter(typeof(PaymentSessionFilter))]
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

    await EnsureCurrentResidentRentInvoice();

    var query = _context.VisibleInvoices(User)
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
    if (residentId.HasValue && !User.IsInRole("Resident"))
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

    var penaltiesApplied = false;
    var now = DateTime.UtcNow;
    foreach (var invoice in invoices)
        penaltiesApplied |= invoice.AddOverduePenalty(now);

    if (penaltiesApplied)
        await _context.SaveChangesAsync();

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

private async Task EnsureCurrentResidentRentInvoice()
{
    if (!User.IsInRole("Resident") ||
        !int.TryParse(User.FindFirst("residentId")?.Value, out var residentId))
    {
        return;
    }

    var resident = await _context.Residents
        .Where(r => r.Id == residentId && r.Status == "Active")
        .Select(r => new { r.Id, r.TenantId, r.UnitId })
        .FirstOrDefaultAsync();

    if (resident?.UnitId is not int unitId)
        return;

    var unit = await _context.Units.FirstOrDefaultAsync(u =>
        u.Id == unitId && u.TenantId == resident.TenantId);

    if (unit == null || unit.MonthlyRent <= 0)
        return;

    var now = DateTime.UtcNow;
    var billingMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
    var nextMonth = billingMonth.AddMonths(1);

    var rentInvoiceExists = await _context.Invoices
        .Where(i => i.ResidentId == resident.Id &&
                    i.BillingMonth >= billingMonth &&
                    i.BillingMonth < nextMonth)
        .AnyAsync(i => i.InvoiceItems.Any(item => item.ChargeType == "Rent"));

    if (rentInvoiceExists)
        return;

    var dueDate = nextMonth.AddTicks(-1);
    _context.Invoices.Add(new Invoice
    {
        ResidentId = resident.Id,
        ApartmentId = unit.Id,
        InvoiceNumber = $"INV-{now:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
        BillingMonth = billingMonth,
        DueDate = dueDate,
        Status = "Pending",
        CreatedAt = now,
        TotalAmount = unit.MonthlyRent,
        InvoiceItems =
        [
            new InvoiceItem
            {
                Description = $"Monthly Rent - {billingMonth:MMMM yyyy}",
                ChargeType = "Rent",
                Amount = unit.MonthlyRent
            }
        ]
    });

    await _context.SaveChangesAsync();
}

        // GET: api/invoices/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Invoice>> GetInvoice(int id)
        {
            var invoice = await _context.VisibleInvoices(User)
                .Include(i => i.InvoiceItems)
                .Include(i => i.Payments)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null)
            {
                return NotFound();
            }

            if (invoice.AddOverduePenalty(DateTime.UtcNow))
                await _context.SaveChangesAsync();

            return invoice;
        }

        // POST: api/invoices
        [Authorize(Roles = PaymentAccess.AdminRoles)]
        [HttpPost]
        public async Task<ActionResult<Invoice>> CreateInvoice(Invoice invoice)
        {
            if (!await _context.CanManageResident(User, invoice.ResidentId)) return Forbid();
            // Do not accept nested payments or client-selected financial state.
            invoice.Id = 0;
            invoice.Payments = new();
            invoice.InvoiceItems = invoice.InvoiceItems.Select(item => new InvoiceItem
            {
                Description = item.Description, ChargeType = item.ChargeType, Amount = item.Amount
            }).ToList();
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
[Authorize(Roles = PaymentAccess.AdminRoles)]
[HttpPut("{id}")]
public async Task<IActionResult> UpdateInvoice(
    int id,
    Invoice updatedInvoice)
{
    var invoice = await _context.VisibleInvoices(User)
        .Include(i => i.InvoiceItems)
        .Include(i => i.Payments)
        .FirstOrDefaultAsync(i => i.Id == id);

    if (invoice == null)
    {
        return NotFound(new
        {
            message = "Invoice not found."
        });
    }

    // Paid invoices cannot be changed
    if (invoice.Status == "Paid")
    {
        return BadRequest(new
        {
            message = "Paid invoices cannot be modified."
        });
    }

    // Protect invoices that already have payment activity
    if (invoice.Payments.Any())
    {
        return BadRequest(new
        {
            message =
                "Invoices with existing payment transactions cannot be modified."
        });
    }

    if (!await _context.CanManageResident(User, updatedInvoice.ResidentId)) return Forbid();

    // Validate resident and apartment IDs
    if (updatedInvoice.ResidentId <= 0 ||
        updatedInvoice.ApartmentId <= 0)
    {
        return BadRequest(new
        {
            message =
                "Resident ID and Apartment ID must be valid."
        });
    }

    // Validate dates
    if (updatedInvoice.DueDate <=
        updatedInvoice.BillingMonth)
    {
        return BadRequest(new
        {
            message =
                "Due date must be after the billing month."
        });
    }

    // Invoice must contain charges
    if (updatedInvoice.InvoiceItems == null ||
        updatedInvoice.InvoiceItems.Count == 0)
    {
        return BadRequest(new
        {
            message =
                "At least one invoice charge is required."
        });
    }

    // Prevent negative or zero charges
    if (updatedInvoice.InvoiceItems.Any(
        item => item.Amount <= 0))
    {
        return BadRequest(new
        {
            message =
                "Invoice charges must be greater than zero."
        });
    }

    // Prevent duplicate invoice for same resident,
    // apartment and billing month
    var duplicateInvoice = await _context.VisibleInvoices(User)
        .AnyAsync(i =>
            i.Id != id &&
            i.ResidentId == updatedInvoice.ResidentId &&
            i.ApartmentId == updatedInvoice.ApartmentId &&
            i.BillingMonth.Year ==
                updatedInvoice.BillingMonth.Year &&
            i.BillingMonth.Month ==
                updatedInvoice.BillingMonth.Month);

    if (duplicateInvoice)
    {
        return BadRequest(new
        {
            message =
                "An invoice already exists for this resident and billing month."
        });
    }

    // Update basic invoice information
    invoice.ResidentId = updatedInvoice.ResidentId;
    invoice.ApartmentId = updatedInvoice.ApartmentId;

    // Ensure PostgreSQL receives UTC DateTimes
    invoice.BillingMonth = DateTime.SpecifyKind(
        updatedInvoice.BillingMonth,
        DateTimeKind.Utc
    );

    invoice.DueDate = DateTime.SpecifyKind(
        updatedInvoice.DueDate,
        DateTimeKind.Utc
    );

    // Remove existing invoice items
    _context.InvoiceItems.RemoveRange(
        invoice.InvoiceItems
    );

    // Add new invoice items
    invoice.InvoiceItems =
        updatedInvoice.InvoiceItems
            .Select(item => new InvoiceItem
            {
                Description = item.Description,
                ChargeType = item.ChargeType,
                Amount = item.Amount
            })
            .ToList();

    // Calculate total on backend
    invoice.TotalAmount =
        invoice.InvoiceItems.Sum(item => item.Amount);

    await _context.SaveChangesAsync();

    return Ok(new
    {
        message = "Invoice updated successfully.",
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

// DELETE: api/invoices/5
[Authorize(Roles = PaymentAccess.AdminRoles)]
[HttpDelete("{id}")]
public async Task<IActionResult> DeleteInvoice(int id)
{
    var invoice = await _context.VisibleInvoices(User)
        .Include(i => i.InvoiceItems)
        .Include(i => i.Payments)
        .FirstOrDefaultAsync(i => i.Id == id);

    if (invoice == null)
    {
        return NotFound(new
        {
            message = "Invoice not found."
        });
    }

    // Paid invoices cannot be deleted
    if (invoice.Status == "Paid")
    {
        return BadRequest(new
        {
            message = "Paid invoices cannot be deleted."
        });
    }

    // Do not delete an invoice if a payment
    // transaction already exists
    if (invoice.Payments.Any())
    {
        return BadRequest(new
        {
            message =
                "Invoices with existing payment transactions cannot be deleted."
        });
    }

    _context.Invoices.Remove(invoice);

    await _context.SaveChangesAsync();

    return NoContent();
}


        // Facility bookings available to invoice, restricted to the admin's tenant.
        [Authorize(Roles = PaymentAccess.AdminRoles)]
        [HttpGet("facility-bookings")]
        public async Task<IActionResult> GetFacilityBookings()
        {
            var query = _context.FacilityBookings
                .Include(b => b.Facility)
                .Include(b => b.Resident)
                .AsQueryable();

            if (!User.IsInRole("SuperAdmin"))
            {
                if (!int.TryParse(User.FindFirst("tenantId")?.Value, out var tenantId))
                    return Forbid();
                query = query.Where(b => b.Resident != null && b.Resident.TenantId == tenantId);
            }

            var bookings = await query.OrderByDescending(b => b.BookingDate)
                .ThenByDescending(b => b.StartTime)
                .Select(b => new
                {
                    bookingId = b.BookingId,
                    facilityName = b.Facility != null ? b.Facility.FacilityName : "Unknown",
                    residentId = b.ResidentId,
                    residentName = b.Resident != null ? b.Resident.FullName : "Unknown",
                    apartmentId = b.Resident != null ? b.Resident.UnitId : null,
                    apartmentNumber = b.Resident != null ? b.Resident.UnitNumber : null,
                    bookingDate = b.BookingDate,
                    startTime = b.StartTime,
                    endTime = b.EndTime,
                    amount = b.TotalCost,
                    status = b.Status.ToString(),
                    isInvoiced = _context.Invoices.Any(i => i.FacilityBookingId == b.BookingId)
                }).ToListAsync();

            return Ok(bookings);
        }

        [Authorize(Roles = PaymentAccess.AdminRoles)]
        [HttpPost("generate-booking")]
        public async Task<IActionResult> GenerateBookingInvoice(GenerateBookingInvoiceRequest request)
        {
            var booking = await _context.FacilityBookings
                .Include(b => b.Facility)
                .Include(b => b.Resident)
                .FirstOrDefaultAsync(b => b.BookingId == request.BookingId);

            if (booking == null || booking.Resident == null) return NotFound(new { message = "Facility booking not found." });
            if (!await _context.CanManageResident(User, booking.ResidentId)) return Forbid();
            if (booking.Status == BookingStatus.Rejected)
                return BadRequest(new { message = "Rejected bookings cannot be invoiced." });
            if (booking.TotalCost <= 0)
                return BadRequest(new { message = "This booking has no invoiceable charge." });
            if (request.Amount <= 0 || request.ApartmentId <= 0)
                return BadRequest(new { message = "A valid apartment and positive facility charge are required." });
            if (booking.Resident.UnitId == null || booking.Resident.UnitId.Value != request.ApartmentId)
                return BadRequest(new { message = "Apartment ID must match the resident's assigned apartment." });
            if (await _context.Invoices.AnyAsync(i => i.FacilityBookingId == booking.BookingId))
                return Conflict(new { message = "This booking has already been invoiced." });

            var billingMonth = DateTime.SpecifyKind(new DateTime(booking.BookingDate.Year, booking.BookingDate.Month, 1), DateTimeKind.Utc);
            if (request.DueDate.Date <= billingMonth.Date)
                return BadRequest(new { message = "Due date must be after the booking month begins." });

            var invoice = new Invoice
            {
                ResidentId = booking.ResidentId,
                ApartmentId = request.ApartmentId,
                FacilityBookingId = booking.BookingId,
                InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
                BillingMonth = billingMonth,
                DueDate = DateTime.SpecifyKind(request.DueDate.Date, DateTimeKind.Utc),
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                InvoiceItems = new List<InvoiceItem>
                {
                    new() { Description = $"{booking.Facility?.FacilityName ?? "Facility"} booking #{booking.BookingId}", ChargeType = "Facility", Amount = request.Amount }
                },
                TotalAmount = request.Amount
            };

            _context.Invoices.Add(invoice);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return Conflict(new { message = "This booking has already been invoiced." });
            }

            return Ok(new { message = "Facility booking invoice generated successfully.", invoice.Id, invoice.InvoiceNumber, invoice.ResidentId, invoice.ApartmentId, invoice.FacilityBookingId, invoice.TotalAmount, invoice.Status });
        }

        // POST: api/invoices/generate-monthly
[Authorize(Roles = PaymentAccess.AdminRoles)]
[HttpPost("generate-monthly")]
public async Task<IActionResult> GenerateMonthlyInvoice(
    GenerateMonthlyInvoiceRequest request)
{
    if (!await _context.CanManageResident(User, request.ResidentId)) return Forbid();
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
    var existingInvoice = await _context.VisibleInvoices(User)
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

        BillingMonth = DateTime.SpecifyKind(
    request.BillingMonth,
    DateTimeKind.Utc
),

DueDate = DateTime.SpecifyKind(
    request.DueDate,
    DateTimeKind.Utc
),
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
