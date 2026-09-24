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

        // Get All Visitors (For Admin/Staff Logs)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<VisitorPassResponseDto>>> GetAllVisitors()
        {
            var passes = await _context.VisitorPasses
                .Include(v => v.AssignedParkingSlot)
                .OrderByDescending(v => v.PassId)
                .Select(v => new VisitorPassResponseDto
                {
                    Id = v.PassId,
                    VisitorName = v.VisitorName,
                    VehicleNumber = v.VehicleNumber,
                    ExpectedArrival = v.ExpectedArrival,
                    AccessCode = v.AccessCode,
                    Status = v.Status.ToString(),
                    AssignedParkingSlot = v.AssignedParkingSlot != null ? v.AssignedParkingSlot.SlotNumber : null,
                    AssignedParkingSlotId = v.AssignedParkingSlot != null ? v.AssignedParkingSlot.SlotId : null,
                    CheckInTime = v.CheckInTime,
                    CheckOutTime = v.CheckOutTime
                })
                .ToListAsync();

            return Ok(passes);
        }

        // Get Active Visitors for Security / App Dashboard
        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<VisitorPassResponseDto>>> GetActiveVisitors()
        {
            var activePasses = await _context.VisitorPasses
                .Include(v => v.AssignedParkingSlot)
                .Where(v => v.Status == PassStatus.CheckedIn || v.Status == PassStatus.Pending || v.Status == PassStatus.Active)
                .OrderByDescending(v => v.PassId)
                .Select(v => new VisitorPassResponseDto
                {
                    Id = v.PassId,
                    VisitorName = v.VisitorName,
                    VehicleNumber = v.VehicleNumber,
                    ExpectedArrival = v.ExpectedArrival,
                    AccessCode = v.AccessCode,
                    Status = v.Status.ToString(),
                    AssignedParkingSlot = v.AssignedParkingSlot != null ? v.AssignedParkingSlot.SlotNumber : null,
                    AssignedParkingSlotId = v.AssignedParkingSlot != null ? v.AssignedParkingSlot.SlotId : null,
                    CheckInTime = v.CheckInTime,
                    CheckOutTime = v.CheckOutTime
                })
                .ToListAsync();

            return Ok(activePasses);
        }

        // POST Resident pre-registers visitor using App
        [HttpPost("pre-register")]
        public async Task<ActionResult<VisitorPassResponseDto>> PreRegisterVisitor(CreateVisitorPassDto dto)
        {
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

            // Auto-assign a parking slot if visitor has a vehicle
            if (!string.IsNullOrWhiteSpace(dto.VehicleNumber))
            {
                var availableSlot = await _context.ParkingSlots
                    .FirstOrDefaultAsync(p => p.IsAvailable && p.SlotType == ParkingSlotType.Visitor);

                if (availableSlot != null)
                {
                    availableSlot.IsAvailable = false;
                    availableSlot.CurrentVisitorPassId = visitorPass.PassId;
                    visitorPass.AssignedParkingSlot = availableSlot;
                }
            }

            _context.VisitorPasses.Add(visitorPass);
            await _context.SaveChangesAsync();

            return StatusCode(201, new { Message = "Visitor registered.", AccessCode = accessCode, PassId = visitorPass.PassId });
        }

        // PUT Admin/Staff Updates Visitor Details, Check-In Time, Parking Spot & Status
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateVisitor(int id, [FromBody] UpdateVisitorPassDto dto)
        {
            var visitor = await _context.VisitorPasses
                .Include(v => v.AssignedParkingSlot)
                .FirstOrDefaultAsync(v => v.PassId == id);

            if (visitor == null) return NotFound("Visitor pass not found.");

            if (!string.IsNullOrWhiteSpace(dto.VisitorName))
                visitor.VisitorName = dto.VisitorName.Trim();

            if (dto.VehicleNumber != null)
                visitor.VehicleNumber = dto.VehicleNumber.Trim();

            if (dto.CheckInTime.HasValue)
            {
                visitor.CheckInTime = dto.CheckInTime.Value.Kind == DateTimeKind.Utc
                    ? dto.CheckInTime.Value
                    : DateTime.SpecifyKind(dto.CheckInTime.Value, DateTimeKind.Utc);
            }

            // Update Status if provided
            if (!string.IsNullOrWhiteSpace(dto.Status) && Enum.TryParse<PassStatus>(dto.Status, true, out var parsedStatus))
            {
                visitor.Status = parsedStatus;

                if (parsedStatus == PassStatus.CheckedIn && !visitor.CheckInTime.HasValue)
                {
                    visitor.CheckInTime = DateTime.UtcNow;
                }

                // If Status is set to CheckedOut or Cancelled, free any assigned parking slot
                if (parsedStatus == PassStatus.CheckedOut || parsedStatus == PassStatus.Cancelled)
                {
                    if (visitor.AssignedParkingSlot != null)
                    {
                        visitor.AssignedParkingSlot.IsAvailable = true;
                        visitor.AssignedParkingSlot.CurrentVisitorPassId = null;
                        visitor.AssignedParkingSlot = null;
                    }
                    if (parsedStatus == PassStatus.CheckedOut)
                    {
                        visitor.CheckOutTime = DateTime.UtcNow;
                    }
                }
            }

            // Handle Parking Slot Assignment from Admin
            if (dto.AssignedParkingSlotId.HasValue)
            {
                var newSlot = await _context.ParkingSlots.FindAsync(dto.AssignedParkingSlotId.Value);
                if (newSlot != null && newSlot.SlotId != visitor.AssignedParkingSlot?.SlotId)
                {
                    // Free old slot
                    if (visitor.AssignedParkingSlot != null)
                    {
                        visitor.AssignedParkingSlot.IsAvailable = true;
                        visitor.AssignedParkingSlot.CurrentVisitorPassId = null;
                    }

                    // Assign new slot
                    newSlot.IsAvailable = false;
                    newSlot.CurrentVisitorPassId = visitor.PassId;
                    visitor.AssignedParkingSlot = newSlot;
                }
            }
            else if (dto.AutoAssignParking || (!string.IsNullOrWhiteSpace(visitor.VehicleNumber) && visitor.AssignedParkingSlot == null))
            {
                // Find an available visitor slot
                var availableSlot = await _context.ParkingSlots
                    .FirstOrDefaultAsync(p => p.IsAvailable && p.SlotType == ParkingSlotType.Visitor);

                if (availableSlot != null)
                {
                    availableSlot.IsAvailable = false;
                    availableSlot.CurrentVisitorPassId = visitor.PassId;
                    visitor.AssignedParkingSlot = availableSlot;
                }
            }

            visitor.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Visitor pass updated successfully." });
        }

        // Security / Admin Check In
        [HttpPost("{id}/check-in")]
        public async Task<IActionResult> CheckInVisitor(int id, [FromQuery] string? accessCode)
        {
            var visitor = await _context.VisitorPasses
                .Include(v => v.AssignedParkingSlot)
                .FirstOrDefaultAsync(v => v.PassId == id);

            if (visitor == null) return NotFound("Visitor pass not found.");

            if (!string.IsNullOrEmpty(accessCode) && visitor.AccessCode != accessCode)
                return Unauthorized("Invalid access code.");

            if (visitor.Status == PassStatus.CheckedOut || visitor.Status == PassStatus.Cancelled)
                return BadRequest($"Cannot check in. Current status is {visitor.Status}");

            // Allocate visitor parking slot if visitor has a vehicle and no slot assigned yet
            if (!string.IsNullOrEmpty(visitor.VehicleNumber) && visitor.AssignedParkingSlot == null)
            {
                var availableSlot = await _context.ParkingSlots
                    .FirstOrDefaultAsync(p => p.IsAvailable && p.SlotType == ParkingSlotType.Visitor);

                if (availableSlot != null)
                {
                    availableSlot.IsAvailable = false;
                    availableSlot.CurrentVisitorPassId = visitor.PassId;
                    visitor.AssignedParkingSlot = availableSlot;
                }
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

        // Security / Admin Check Out
        [HttpPost("{id}/check-out")]
        public async Task<IActionResult> CheckOutVisitor(int id)
        {
            var visitor = await _context.VisitorPasses
                .Include(v => v.AssignedParkingSlot)
                .FirstOrDefaultAsync(v => v.PassId == id);

            if (visitor == null) return NotFound();

            if (visitor.AssignedParkingSlot != null)
            {
                visitor.AssignedParkingSlot.IsAvailable = true;
                visitor.AssignedParkingSlot.CurrentVisitorPassId = null;
                visitor.AssignedParkingSlot = null;
            }

            visitor.Status = PassStatus.CheckedOut;
            visitor.CheckOutTime = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Check-out successful. Parking slot released." });
        }

        // Resident / Admin Cancel Visitor Pass
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelVisitor(int id)
        {
            var visitor = await _context.VisitorPasses
                .Include(v => v.AssignedParkingSlot)
                .FirstOrDefaultAsync(v => v.PassId == id);

            if (visitor == null) return NotFound("Visitor pass not found.");

            // Release assigned parking slot if any
            if (visitor.AssignedParkingSlot != null)
            {
                visitor.AssignedParkingSlot.IsAvailable = true;
                visitor.AssignedParkingSlot.CurrentVisitorPassId = null;
                visitor.AssignedParkingSlot = null;
            }

            visitor.Status = PassStatus.Cancelled;
            visitor.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Visitor pass cancelled successfully. Parking slot released." });
        }
    }
}