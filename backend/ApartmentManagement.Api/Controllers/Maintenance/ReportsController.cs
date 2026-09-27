using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.DTOs.Maintenance;

namespace ApartmentManagement.Api.Controllers.Maintenance
{
    [Route("api/reports/maintenance")]
    [ApiController]
    public class MaintenanceReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MaintenanceReportsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<MaintenanceReportDto>> GetMaintenanceReport()
        {
            var total = await _context.Maintenances.CountAsync();
            var pending = await _context.Maintenances.CountAsync(m => m.Status == "Pending");
            var assigned = await _context.Maintenances.CountAsync(m => m.Status == "Assigned");
            var inProgress = await _context.Maintenances.CountAsync(m => m.Status == "In Progress");
            var resolved = await _context.Maintenances.CountAsync(m => m.Status == "Resolved");
            var closed = await _context.Maintenances.CountAsync(m => m.Status == "Closed");
            
            var totalRepairCost = await _context.Maintenances.SumAsync(m => m.RepairCost);

            var now = System.DateTimeOffset.UtcNow;
            var slaRiskCount = await _context.Maintenances
                .Where(m => m.Status != "Resolved" && m.Status != "Closed" && m.SlaDueDate != null)
                .CountAsync(m => m.SlaDueDate.Value <= now.AddHours(24));

            return Ok(new MaintenanceReportDto
            {
                Total = total,
                Pending = pending,
                Assigned = assigned,
                InProgress = inProgress,
                Resolved = resolved,
                Closed = closed,
                SlaRiskCount = slaRiskCount,
                TotalRepairCost = totalRepairCost
            });
        }
    }
}
