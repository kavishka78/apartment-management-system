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

        public ParkingSlotsController(AppDbContext context)
        {
            _context = context;
        }

        // GET
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ParkingSlot>>> GetParkingSlots()
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

        
        [HttpGet("visitor")]
        public async Task<ActionResult<IEnumerable<ParkingSlot>>> GetVisitorParkingSlots()
        {
            var visitorSlots = await _context.ParkingSlots
                .Where(p => p.SlotType == ParkingSlotType.Visitor)
                .OrderBy(p => p.SlotNumber)
                .ToListAsync();

            return Ok(visitorSlots);
        }

        
        [HttpPost]
        public async Task<ActionResult<ParkingSlot>> CreateParkingSlot(ParkingSlot slot)
        {
            _context.ParkingSlots.Add(slot);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetParkingSlots), new { id = slot.SlotId }, slot);
        }

        
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateParkingSlot(int id, ParkingSlot slot)
        {
            if (id != slot.SlotId) return BadRequest();

            _context.Entry(slot).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
