using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ApartmentManagement.Api.Models;using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.DTOs.Notification;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace ApartmentManagement.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("resident/{residentId}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<NotificationDto>>> GetResidentNotifications(int residentId)
        {
            if (User.IsInRole("Resident"))
            {
                var resStr = User.FindFirst("residentId")?.Value;
                if (!int.TryParse(resStr, out int rId) || rId != residentId)
                {
                    return Forbid();
                }
            }

            var notifications = await _context.Notifications
                .Where(n => n.ResidentId == residentId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    ResidentId = n.ResidentId,
                    Title = n.Title,
                    Message = n.Message,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt
                })
                .ToListAsync();

            return Ok(notifications);
        }

        [HttpPost("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null) return NotFound();

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        [HttpPost("resident/{residentId}/read-all")]
        [Authorize]
        public async Task<IActionResult> MarkAllAsRead(int residentId)
        {
            if (User.IsInRole("Resident"))
            {
                var resStr = User.FindFirst("residentId")?.Value;
                if (!int.TryParse(resStr, out int rId) || rId != residentId)
                {
                    return Forbid();
                }
            }

            var unread = await _context.Notifications
                .Where(n => n.ResidentId == residentId && !n.IsRead)
                .ToListAsync();

            foreach (var n in unread)
            {
                n.IsRead = true;
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }
    }
}
