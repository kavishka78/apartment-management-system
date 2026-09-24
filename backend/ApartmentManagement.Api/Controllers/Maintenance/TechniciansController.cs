using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Models;

namespace ApartmentManagement.Api.Controllers.Maintenance
{
    [Route("api/technicians")]
    [ApiController]
    public class TechniciansController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TechniciansController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/technicians
        [HttpGet]
        public async Task<IActionResult> GetTechnicians()
        {
            // We want to return technicians with their active workload count
            var techs = await _context.Technicians.ToListAsync();
            
            var workloads = await _context.Maintenances
                .Where(m => m.Status == "Assigned" || m.Status == "In Progress")
                .Where(m => m.TechnicianId != null)
                .GroupBy(m => m.TechnicianId.Value)
                .Select(g => new { TechId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(g => g.TechId, g => g.Count);

            var result = techs.Select(t => new {
                t.Id,
                t.Name,
                t.ContactInformation,
                t.Skills,
                t.Status,
                t.PhotoBase64,
                ActiveWorkload = workloads.ContainsKey(t.Id) ? workloads[t.Id] : 0
            });

            return Ok(result);
        }

        // GET: api/technicians/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTechnician(int id)
        {
            var tech = await _context.Technicians.FindAsync(id);
            if (tech == null) return NotFound();
            return Ok(tech);
        }

        // POST: api/technicians
        [HttpPost]
        public async Task<IActionResult> CreateTechnician([FromBody] Technician technician)
        {
            _context.Technicians.Add(technician);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetTechnician), new { id = technician.Id }, technician);
        }

        // PUT: api/technicians/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTechnician(int id, [FromBody] Technician technician)
        {
            if (id != technician.Id) return BadRequest();

            _context.Entry(technician).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TechnicianExists(id)) return NotFound();
                else throw;
            }

            return NoContent();
        }

        // DELETE: api/technicians/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTechnician(int id)
        {
            var tech = await _context.Technicians.FindAsync(id);
            if (tech == null) return NotFound();

            // Instead of deleting, just set to Offline or handle cascading
            tech.Status = "Offline"; 
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool TechnicianExists(int id)
        {
            return _context.Technicians.Any(e => e.Id == id);
        }
    }
}
