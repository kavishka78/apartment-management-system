using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
        public async Task<ActionResult<IEnumerable<Invoice>>> GetInvoices()
        {
            return await _context.Invoices
                .Include(i => i.InvoiceItems)
                .Include(i => i.Payments)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();
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

    }
}