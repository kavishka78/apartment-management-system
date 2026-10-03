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
            var techs = await _context.Technicians.Where(t => t.Status != "Inactive").ToListAsync();
            
            var workloads = await _context.Maintenances
                .Where(m => m.Status == "Assigned" || m.Status == "In Progress")
                .Where(m => m.TechnicianId != null)
                .GroupBy(m => m.TechnicianId.Value)
                .Select(g => new { TechId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(g => g.TechId, g => g.Count);

            var result = techs.Select(t => new {
                t.Id,
                t.Name,
                t.Email,
                t.ContactInformation,
                t.Skills,
                t.Status,
                t.PhotoBase64,
                t.NicNumber,
                t.AccessPassCode,
                t.WorkingHours,
                t.IsAccessGranted,
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
            string email = !string.IsNullOrWhiteSpace(technician.Email) 
                ? technician.Email.Trim().ToLower()
                : $"tech{Guid.NewGuid().ToString().Substring(0, 4)}@apartment.lk";
                
            // Check if email already exists in UserAccounts
            if (await _context.UserAccounts.AnyAsync(u => u.Email.ToLower() == email))
            {
                return BadRequest(new { message = "That email address is already in use by another account." });
            }

            // Ensure technician email is set
            technician.Email = email;

            _context.Technicians.Add(technician);
            await _context.SaveChangesAsync();
            
            // Auto-generate Access Pass Code based on the new ID
            technician.AccessPassCode = $"TECH-{technician.Id:D3}";
            
            // Create a matching UserAccount so the technician can log in

            
            var generatedPassword = Guid.NewGuid().ToString().Substring(0, 8);

            var userAccount = new UserAccount
            {
                Name = technician.Name,
                Email = email,
                Phone = technician.ContactInformation,
                Role = "Technician",
                Status = "Active",
                AssignedAt = DateTime.UtcNow.ToString("O"),
                RequiresPasswordReset = true
            };
            var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<UserAccount>();
            userAccount.PasswordHash = hasher.HashPassword(userAccount, generatedPassword); 
            
            _context.UserAccounts.Add(userAccount);
            
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTechnician), new { id = technician.Id }, new { 
                technician.Id,
                technician.Name,
                technician.Email,
                technician.ContactInformation,
                technician.Skills,
                technician.Status,
                technician.WorkingHours,
                TemporaryPassword = generatedPassword
            });
        }

        // PUT: api/technicians/5
                        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTechnician(int id, [FromBody] Technician technician)
        {
            if (id != technician.Id) return BadRequest();

            // Auto-generate passcode if it's missing
            if (string.IsNullOrWhiteSpace(technician.AccessPassCode))
            {
                technician.AccessPassCode = $"TECH-{technician.Id:D3}";
            }

            _context.Entry(technician).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();

                // Sync with UserAccounts
                var targetEmail = !string.IsNullOrWhiteSpace(technician.Email) 
                    ? technician.Email.Trim().ToLower() 
                    : $"tech{technician.Id}@apartment.lk";

                // Ensure no OTHER user has this email
                var duplicate = await _context.UserAccounts.FirstOrDefaultAsync(u => u.Email == targetEmail && u.Phone != technician.ContactInformation);
                if (duplicate != null)
                {
                    return BadRequest(new { message = "This email is already in use by another account." });
                }

                var existingUser = await _context.UserAccounts.FirstOrDefaultAsync(u => u.Role == "Technician" && (u.Phone == technician.ContactInformation || u.Email == targetEmail));
                
                if (existingUser != null)
                {
                    existingUser.Email = targetEmail;
                    existingUser.Name = technician.Name;
                    existingUser.Phone = technician.ContactInformation;
                }
                else
                {
                    var newUser = new UserAccount
                    {
                        Name = technician.Name,
                        Email = targetEmail,
                        Phone = technician.ContactInformation,
                        Role = "Technician",
                        Status = "Active",
                        AssignedAt = DateTime.UtcNow.ToString("O")
                    };
                    var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<UserAccount>();
                    newUser.PasswordHash = hasher.HashPassword(newUser, "tech12345");
                    _context.UserAccounts.Add(newUser);
                }
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TechnicianExists(id)) return NotFound();
                else throw;
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Failed to update technician: " + ex.Message });
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
