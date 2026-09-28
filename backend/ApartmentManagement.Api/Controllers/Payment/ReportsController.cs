using ApartmentManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using ApartmentManagement.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApartmentManagement.Api.Controllers
{
    [Route("api/reports")]
    [Authorize(Roles = PaymentAccess.AdminRoles)]
    [TypeFilter(typeof(PaymentSessionFilter))]
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
            var totalInvoiced = await _context.VisibleInvoices(User)
                .SumAsync(i => i.TotalAmount);

            var totalCollected = await _context.VisiblePayments(User)
                .Where(p => p.Status == "Verified")
                .SumAsync(p => p.Amount);

            var pendingAmount = await _context.VisibleInvoices(User)
                .Where(i => i.Status != "Paid")
                .SumAsync(i => i.TotalAmount);

            var totalInvoices = await _context.VisibleInvoices(User).CountAsync();

            var paidInvoices = await _context.VisibleInvoices(User)
                .CountAsync(i => i.Status == "Paid");

            var pendingInvoices = await _context.VisibleInvoices(User)
                .CountAsync(i => i.Status != "Paid");

            var overdueInvoices = await _context.VisibleInvoices(User)
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