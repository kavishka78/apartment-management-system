using ApartmentManagement.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApartmentManagement.Api.Controllers
{
    [Route("api/reports")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/reports/collections
        [HttpGet("collections")]
        public async Task<IActionResult> GetCollectionReport()
        {
            var totalInvoiced = await _context.Invoices
                .SumAsync(i => i.TotalAmount);

            var totalCollected = await _context.Payments
                .Where(p => p.Status == "Verified")
                .SumAsync(p => p.Amount);

            var pendingAmount = await _context.Invoices
                .Where(i => i.Status != "Paid")
                .SumAsync(i => i.TotalAmount);

            var totalInvoices = await _context.Invoices.CountAsync();

            var paidInvoices = await _context.Invoices
                .CountAsync(i => i.Status == "Paid");

            var pendingInvoices = await _context.Invoices
                .CountAsync(i => i.Status != "Paid");

            var overdueInvoices = await _context.Invoices
                .CountAsync(i =>
                    i.DueDate < DateTime.UtcNow &&
                    i.Status != "Paid");

            return Ok(new
            {
                totalInvoiced,
                totalCollected,
                pendingAmount,
                totalInvoices,
                paidInvoices,
                pendingInvoices,
                overdueInvoices
            });
        }
    }
}