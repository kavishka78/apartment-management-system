using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApartmentManagement.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ParkingSlotsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ParkingSlotsController> _logger;

        public ParkingSlotsController(AppDbContext context, ILogger<ParkingSlotsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET All Parking Slots
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ParkingSlot>>> GetParkingSlots()
        {
            try
            {
                var slots = await _context.ParkingSlots
                    .OrderBy(p => p.SlotNumber)
                    .ToListAsync();

                return Ok(slots);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in GetParkingSlots");
                return StatusCode(500, new { Message = "An error occurred while retrieving parking slots.", Details = ex.Message });
            }
        }

        // GET Visitor Parking Slots Only
        [HttpGet("visitor")]
        public async Task<ActionResult<IEnumerable<ParkingSlot>>> GetVisitorParkingSlots()
        {
            try
            {
                var visitorSlots = await _context.ParkingSlots
                    .Where(p => p.SlotType == ParkingSlotType.Visitor)
                    .OrderBy(p => p.SlotNumber)
                    .ToListAsync();

                return Ok(visitorSlots);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in GetVisitorParkingSlots");
                return StatusCode(500, new { Message = "An error occurred while retrieving visitor parking slots.", Details = ex.Message });
            }
        }

        // POST Create New Parking Slot
        [HttpPost]
        public async Task<ActionResult<ParkingSlot>> CreateParkingSlot([FromBody] ParkingSlot slot)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(slot.SlotNumber))
                    return BadRequest("Slot number is required.");

                var existing = await _context.ParkingSlots
                    .FirstOrDefaultAsync(p => p.SlotNumber.ToLower() == slot.SlotNumber.Trim().ToLower());

                if (existing != null)
                    return Conflict($"Parking slot number '{slot.SlotNumber}' already exists.");

                slot.SlotNumber = slot.SlotNumber.Trim().ToUpper();
                slot.CreatedAt = DateTime.UtcNow;

                _context.ParkingSlots.Add(slot);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetParkingSlots), new { id = slot.SlotId }, slot);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in CreateParkingSlot");
                return StatusCode(500, new { Message = "An error occurred while creating parking slot.", Details = ex.Message });
            }
        }

        // PUT Update Parking Slot
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateParkingSlot(int id, [FromBody] ParkingSlot slot)
        {
            try
            {
                var existingSlot = await _context.ParkingSlots.FindAsync(id);
                if (existingSlot == null)
                    return NotFound("Parking slot not found.");

                existingSlot.SlotNumber = slot.SlotNumber.Trim().ToUpper();
                existingSlot.SlotType = slot.SlotType;
                existingSlot.IsAvailable = slot.IsAvailable;
                existingSlot.ResidentId = slot.ResidentId;
                existingSlot.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error in UpdateParkingSlot for SlotId: {SlotId}", id);
                return StatusCode(409, new { Message = "Parking slot was modified by another transaction." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in UpdateParkingSlot for SlotId: {SlotId}", id);
                return StatusCode(500, new { Message = "An error occurred while updating parking slot.", Details = ex.Message });
            }
        }

        // DELETE Parking Slot
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteParkingSlot(int id)
        {
            try
            {
                var slot = await _context.ParkingSlots.FindAsync(id);
                if (slot == null)
                    return NotFound("Parking slot not found.");

                if (!slot.IsAvailable || slot.CurrentVisitorPassId != null)
                    return BadRequest("Cannot delete an occupied parking slot. Please free the slot first.");

                _context.ParkingSlots.Remove(slot);
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Parking slot deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in DeleteParkingSlot for SlotId: {SlotId}", id);
                return StatusCode(500, new { Message = "An error occurred while deleting parking slot.", Details = ex.Message });
            }
        }
    }
}
