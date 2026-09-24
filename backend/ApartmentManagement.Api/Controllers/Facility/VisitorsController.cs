using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.DTOs;
using ApartmentManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApartmentManagement.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VisitorsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VisitorsController(AppDbContext context)
        {
            _context = context;
        }

        // Get Active Visitors for Security Dashboard
        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<VisitorPassResponseDto>>> GetActiveVisitors()
        {
            var activePasses = await _context.VisitorPasses
                .Include(v => v.AssignedParkingSlot)
                .Where(v => v.Status == PassStatus.CheckedIn || v.Status == PassStatus.Pending)
                .Select(v => new VisitorPassResponseDto
                {
                    Id = v.PassId,
                    VisitorName = v.VisitorName,
                    VehicleNumber = v.VehicleNumber,
                    ExpectedArrival = v.ExpectedArrival,
                    AccessCode = v.AccessCode,
                    Status = v.Status.ToString(),
                    AssignedParkingSlot = v.AssignedParkingSlot != null ? v.AssignedParkingSlot.SlotNumber : null,
                    CheckInTime = v.CheckInTime
                })
                .ToListAsync();

            return Ok(activePasses);
        }

        // POST Resident pre-registers visitor using App
        [HttpPost("pre-register")]
        public async Task<ActionResult<VisitorPassResponseDto>> PreRegisterVisitor(CreateVisitorPassDto dto)
        {
            // Generate a code for the QR generator
            var accessCode = Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();

            var arrivalUtc = dto.ExpectedArrival.Kind == DateTimeKind.Utc
                ? dto.ExpectedArrival
                : DateTime.SpecifyKind(dto.ExpectedArrival, DateTimeKind.Utc);

            var visitorPass = new VisitorPass
            {
                ResidentId = dto.ResidentId,
                VisitorName = dto.VisitorName,
                PhoneNumber = dto.PhoneNumber,
                VehicleNumber = dto.VehicleNumber,
                ExpectedArrival = arrivalUtc,
                AccessCode = accessCode,
                Status = PassStatus.Pending
            };

            _context.VisitorPasses.Add(visitorPass);
            await _context.SaveChangesAsync();

            return StatusCode(201, new { Message = "Visitor registered.", AccessCode = accessCode, PassId = visitorPass.PassId });
        }

        //  Security Check In and Dynamic Parking Assignment
        [HttpPost("{id}/check-in")]
        public async Task<IActionResult> CheckInVisitor(int id, [FromQuery] string accessCode)
        {
            var visitor = await _context.VisitorPasses
                .Include(v => v.AssignedParkingSlot)
                .FirstOrDefaultAsync(v => v.PassId == id);

            if (visitor == null) return NotFound("Visitor pass not found.");
            
            if (visitor.AccessCode != accessCode) 
                return Unauthorized("Invalid access code.");

            if (visitor.Status != PassStatus.Pending)
                return BadRequest($"Cannot check in. Current status is {visitor.Status}");

            // If the visitor has a vehicle, allocate an available visitor parking slot
            if (!string.IsNullOrEmpty(visitor.VehicleNumber))
            {
                var availableSlot = await _context.ParkingSlots
                    .FirstOrDefaultAsync(p => p.IsAvailable && p.SlotType == ParkingSlotType.Visitor);

                if (availableSlot == null)
                    return Conflict("No visitor parking slots are currently available.");

                availableSlot.IsAvailable = false;
                availableSlot.CurrentVisitorPassId = visitor.PassId;
                visitor.AssignedParkingSlot = availableSlot;
            }

            visitor.Status = PassStatus.CheckedIn;
            visitor.CheckInTime = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new 
            { 
                Message = "Check-in successful.", 
                ParkingSlot = visitor.AssignedParkingSlot?.SlotNumber ?? "No parking required" 
            });
        }

        //  Security Check Out and Free Parking Slot
        [HttpPost("{id}/check-out")]
        public async Task<IActionResult> CheckOutVisitor(int id)
        {
            var visitor = await _context.VisitorPasses
                .Include(v => v.AssignedParkingSlot)
                .FirstOrDefaultAsync(v => v.PassId == id);

            if (visitor == null) return NotFound();

            if (visitor.Status != PassStatus.CheckedIn)
                return BadRequest("Visitor is not currently checked in.");

            // Release the parking slot if one was assigned
            if (visitor.AssignedParkingSlot != null)
            {
                visitor.AssignedParkingSlot.IsAvailable = true;
                visitor.AssignedParkingSlot.CurrentVisitorPassId = null;
            }

            visitor.Status = PassStatus.CheckedOut;
            visitor.CheckOutTime = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Check-out successful. Parking slot released." });
        }
    }
}