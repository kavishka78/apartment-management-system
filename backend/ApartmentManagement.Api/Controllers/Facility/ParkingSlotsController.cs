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

        // GET
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ParkingSlot>>> GetParkingSlots()
        {
            try
            {
                var slots = await _context.ParkingSlots.OrderBy(p => p.SlotNumber).ToListAsync();

                // Seed default visitor parking slots if none exist in the database yet
                if (slots.Count == 0)
                {
                    var defaultSlots = new List<ParkingSlot>
                    {
                        new ParkingSlot { SlotNumber = "V-01", SlotType = ParkingSlotType.Visitor, IsAvailable = true },
                        new ParkingSlot { SlotNumber = "V-02", SlotType = ParkingSlotType.Visitor, IsAvailable = true },
                        new ParkingSlot { SlotNumber = "V-03", SlotType = ParkingSlotType.Visitor, IsAvailable = true },
                        new ParkingSlot { SlotNumber = "V-04", SlotType = ParkingSlotType.Visitor, IsAvailable = true },
                        new ParkingSlot { SlotNumber = "V-05", SlotType = ParkingSlotType.Visitor, IsAvailable = true },
                        new ParkingSlot { SlotNumber = "R-101", SlotType = ParkingSlotType.Resident, IsAvailable = false, ResidentId = 101 },
                        new ParkingSlot { SlotNumber = "R-102", SlotType = ParkingSlotType.Resident, IsAvailable = false, ResidentId = 102 },
                    };

                    _context.ParkingSlots.AddRange(defaultSlots);
                    await _context.SaveChangesAsync();
                    slots = await _context.ParkingSlots.OrderBy(p => p.SlotNumber).ToListAsync();
                }

                return Ok(slots);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in GetParkingSlots");
                return StatusCode(500, new { Message = "An error occurred while retrieving parking slots.", Details = ex.Message });
            }
        }

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

        [HttpPost]
        public async Task<ActionResult<ParkingSlot>> CreateParkingSlot(ParkingSlot slot)
        {
            try
            {
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

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateParkingSlot(int id, ParkingSlot slot)
        {
            try
            {
                if (id != slot.SlotId) return BadRequest("Slot ID mismatch.");

                _context.Entry(slot).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error occurred in UpdateParkingSlot for SlotId: {SlotId}", id);
                return StatusCode(409, new { Message = "Parking slot was modified by another user." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in UpdateParkingSlot for SlotId: {SlotId}", id);
                return StatusCode(500, new { Message = "An error occurred while updating parking slot.", Details = ex.Message });
            }
        }
    }
}
