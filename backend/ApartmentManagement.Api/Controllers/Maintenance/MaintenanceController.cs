using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Models;
using ApartmentManagement.Api.DTOs.Maintenance;
using ApartmentManagement.Api.Services;

namespace ApartmentManagement.Api.Controllers.Maintenance
{
    [Route("api/[controller]")]
    [ApiController]
    public class MaintenanceController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IMaintenanceTriageService _aiService;

        public MaintenanceController(AppDbContext context, IMaintenanceTriageService aiService)
        {
            _context = context;
            _aiService = aiService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MaintenanceDto>>> GetMaintenances()
        {
            var maintenances = await _context.Maintenances
                .Include(m => m.Category)
                .Include(m => m.Technician)
                .Include(m => m.History)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();

            return Ok(maintenances.Select(MapToDto));
        }

        [HttpGet("technicians")]
        public async Task<IActionResult> GetTechnicians()
        {
            var techs = await _context.Technicians.ToListAsync();
            return Ok(techs);
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.MaintenanceCategories.ToListAsync();
            return Ok(categories);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MaintenanceDto>> GetMaintenance(int id)
        {
            var maintenance = await _context.Maintenances
                .Include(m => m.Category)
                .Include(m => m.Technician)
                .Include(m => m.History)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (maintenance == null)
                return NotFound();

            return Ok(MapToDto(maintenance));
        }

        [HttpPost]
        public async Task<ActionResult<MaintenanceDto>> CreateComplaint([FromBody] CreateComplaintRequest request)
        {
            var category = await _context.MaintenanceCategories.FindAsync(request.CategoryId);
            if (category == null) return BadRequest("Invalid category.");

            var maintenance = new Models.Maintenance
            {
                ResidentId = request.ResidentId,
                CategoryId = request.CategoryId,
                Title = request.Title,
                Description = request.Description,
                Priority = request.Priority,
                Status = "Pending",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            // Calculate initial SLA based on priority (dummy logic)
            maintenance.SlaDueDate = maintenance.Priority switch
            {
                "Urgent" => maintenance.CreatedAt.AddHours(4),
                "High" => maintenance.CreatedAt.AddHours(24),
                "Medium" => maintenance.CreatedAt.AddDays(3),
                _ => maintenance.CreatedAt.AddDays(7)
            };

            maintenance.History.Add(new MaintenanceHistory
            {
                Status = "Complaint Created",
                Note = "Complaint submitted by resident.",
                ChangedBy = "Resident"
            });

            _context.Maintenances.Add(maintenance);
            await _context.SaveChangesAsync();

            // AI Triage (Advisory only)
            var availableTechs = await _context.Technicians.Where(t => t.Status == "Available").ToListAsync();
            var recommendation = await _context.Maintenances
                .Where(m => m.Id == maintenance.Id)
                .Select(m => new { m.Title, m.Description })
                .FirstOrDefaultAsync();

            if (recommendation != null)
            {
                var activeWorkloads = await _context.Maintenances
                    .Where(m => m.Status == "Assigned" || m.Status == "In Progress")
                    .Where(m => m.TechnicianId != null)
                    .GroupBy(m => m.TechnicianId.Value)
                    .Select(g => new { TechId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(g => g.TechId, g => g.Count);

                var triageResult = await _aiService.TriageComplaintAsync(
                    recommendation.Title, 
                    recommendation.Description, 
                    availableTechs, 
                    activeWorkloads
                );

                maintenance.History.Add(new MaintenanceHistory
                {
                    Status = "AI Triage Completed",
                    Note = $"AI recommends Category: {triageResult.Category}, Priority: {triageResult.Priority}, Technician: {triageResult.RecommendedTechnicianId}. Reason: {triageResult.Reason}",
                    ChangedBy = "System"
                });
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetMaintenance), new { id = maintenance.Id }, MapToDto(maintenance));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMaintenance(int id, [FromBody] UpdateComplaintRequest request)
        {
            var maintenance = await _context.Maintenances.FindAsync(id);
            if (maintenance == null) return NotFound();

            var category = await _context.MaintenanceCategories.FindAsync(request.CategoryId);
            if (category == null) return BadRequest("Invalid category.");

            maintenance.CategoryId = request.CategoryId;
            maintenance.Title = request.Title;
            maintenance.Description = request.Description;
            if (!string.IsNullOrEmpty(request.Priority))
                maintenance.Priority = request.Priority;
                
            maintenance.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMaintenance(int id)
        {
            var maintenance = await _context.Maintenances.FindAsync(id);
            if (maintenance == null) return NotFound();

            _context.Maintenances.Remove(maintenance);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("{id}/assign")]
        public async Task<ActionResult<MaintenanceDto>> AssignTechnician(int id, [FromBody] AssignTechnicianRequest request)
        {
            var maintenance = await _context.Maintenances.Include(m => m.History).FirstOrDefaultAsync(m => m.Id == id);
            if (maintenance == null) return NotFound();

            if (maintenance.Status == "Closed" || maintenance.Status == "Resolved")
                return BadRequest("Cannot assign technician to a resolved or closed ticket.");

            var tech = await _context.Technicians.FindAsync(request.TechnicianId);
            if (tech == null) return BadRequest("Invalid technician.");

            maintenance.TechnicianId = request.TechnicianId;
            maintenance.Status = "Assigned";
            maintenance.UpdatedAt = DateTimeOffset.UtcNow;
            
            maintenance.History.Add(new MaintenanceHistory
            {
                Status = "Technician Assigned",
                Note = $"Assigned to {tech.Name}.",
                ChangedBy = "Manager"
            });

            await _context.SaveChangesAsync();
            return Ok(MapToDto(maintenance));
        }

        [HttpPost("{id}/start")]
        public async Task<ActionResult<MaintenanceDto>> StartWork(int id)
        {
            var maintenance = await _context.Maintenances.Include(m => m.History).FirstOrDefaultAsync(m => m.Id == id);
            if (maintenance == null) return NotFound();

            if (maintenance.Status != "Assigned")
                return BadRequest("Work can only be started on an assigned ticket.");

            maintenance.Status = "In Progress";
            maintenance.UpdatedAt = DateTimeOffset.UtcNow;
            
            maintenance.History.Add(new MaintenanceHistory
            {
                Status = "Work Started",
                Note = "Technician has started work.",
                ChangedBy = "Technician"
            });

            await _context.SaveChangesAsync();
            return Ok(MapToDto(maintenance));
        }

        [HttpPost("{id}/resolve")]
        public async Task<ActionResult<MaintenanceDto>> ResolveMaintenance(int id, [FromBody] ResolveMaintenanceRequest request)
        {
            var maintenance = await _context.Maintenances.Include(m => m.History).FirstOrDefaultAsync(m => m.Id == id);
            if (maintenance == null) return NotFound();

            if (maintenance.Status != "In Progress" && maintenance.Status != "Assigned")
                return BadRequest("Invalid status transition.");

            maintenance.Status = "Resolved";
            maintenance.RepairCost = request.RepairCost;
            maintenance.UpdatedAt = DateTimeOffset.UtcNow;

            maintenance.History.Add(new MaintenanceHistory
            {
                Status = "Resolved",
                Note = request.Note,
                ChangedBy = "Technician"
            });

            await _context.SaveChangesAsync();
            return Ok(MapToDto(maintenance));
        }

        [HttpPost("{id}/close")]
        public async Task<ActionResult<MaintenanceDto>> CloseMaintenance(int id)
        {
            var maintenance = await _context.Maintenances.Include(m => m.History).FirstOrDefaultAsync(m => m.Id == id);
            if (maintenance == null) return NotFound();

            if (maintenance.Status != "Resolved")
                return BadRequest("Only resolved tickets can be closed.");

            maintenance.Status = "Closed";
            maintenance.ResidentVerified = true;
            maintenance.UpdatedAt = DateTimeOffset.UtcNow;

            maintenance.History.Add(new MaintenanceHistory
            {
                Status = "Closed",
                Note = "Ticket closed and verified by resident.",
                ChangedBy = "Resident"
            });

            await _context.SaveChangesAsync();
            return Ok(MapToDto(maintenance));
        }

        [HttpGet("sla-risk")]
        public async Task<ActionResult<IEnumerable<SlaRiskDto>>> GetSlaRisks()
        {
            var now = DateTimeOffset.UtcNow;
            var risks = await _context.Maintenances
                .Include(m => m.Technician)
                .Where(m => m.Status != "Resolved" && m.Status != "Closed" && m.SlaDueDate != null)
                .ToListAsync();

            var riskDtos = risks.Select(m =>
            {
                var timeDiff = m.SlaDueDate.Value - now;
                string risk = "Low";
                string reason = "SLA is healthy.";

                if (timeDiff.TotalHours < 0)
                {
                    risk = "Urgent";
                    reason = "SLA deadline exceeded.";
                }
                else if (timeDiff.TotalHours < 24)
                {
                    risk = "High";
                    reason = "SLA deadline is approaching within 24 hours.";
                }

                return new SlaRiskDto
                {
                    Id = m.Id,
                    Title = m.Title,
                    Priority = m.Priority,
                    Status = m.Status,
                    Technician = m.Technician?.Name ?? "Unassigned",
                    SlaDueDate = m.SlaDueDate,
                    Risk = risk,
                    Reason = reason
                };
            }).Where(r => r.Risk == "Urgent" || r.Risk == "High")
              .OrderByDescending(r => r.Risk == "Urgent")
              .ThenBy(r => r.SlaDueDate)
              .ToList();

            return Ok(riskDtos);
        }
        
        [HttpPost("{id}/triage")]
        public async Task<ActionResult<AiTriageRecommendationDto>> GetAiTriageRecommendation(int id)
        {
            var maintenance = await _context.Maintenances.FindAsync(id);
            if (maintenance == null) return NotFound();

            var availableTechs = await _context.Technicians.Where(t => t.Status == "Available").ToListAsync();
            // Calculate workload (active tickets)
            var activeTickets = await _context.Maintenances
                .Where(m => m.Status == "Assigned" || m.Status == "In Progress")
                .GroupBy(m => m.TechnicianId)
                .Where(g => g.Key.HasValue)
                .Select(g => new { TechId = g.Key.Value, Count = g.Count() })
                .ToDictionaryAsync(k => k.TechId, v => v.Count);

            var slaContext = $"Ticket was created at {maintenance.CreatedAt}. Deadline is {maintenance.SlaDueDate}. Current time is {DateTimeOffset.UtcNow}.";

            var result = await _aiService.TriageComplaintAsync(maintenance.Title, maintenance.Description, availableTechs, activeTickets, slaContext);
            return Ok(result);
        }

        [HttpPost("{id}/photo")]
        public async Task<IActionResult> UploadPhoto(int id, Microsoft.AspNetCore.Http.IFormFile file)
        {
            var maintenance = await _context.Maintenances.FindAsync(id);
            if (maintenance == null) return NotFound();
            if (file == null || file.Length == 0) return BadRequest("No file uploaded.");

            var uploadsPath = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "wwwroot", "uploads", "maintenance");
            if (!System.IO.Directory.Exists(uploadsPath))
                System.IO.Directory.CreateDirectory(uploadsPath);

            var fileName = $"{id}_{System.Guid.NewGuid()}{System.IO.Path.GetExtension(file.FileName)}";
            var filePath = System.IO.Path.Combine(uploadsPath, fileName);

            using (var stream = new System.IO.FileStream(filePath, System.IO.FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            maintenance.PhotoPath = $"/uploads/maintenance/{fileName}";
            await _context.SaveChangesAsync();
            return Ok(new { PhotoPath = maintenance.PhotoPath });
        }

        [HttpPost("{id}/comments")]
        public async Task<IActionResult> AddComment(int id, [FromBody] AddCommentRequest request)
        {
            var maintenance = await _context.Maintenances.Include(m => m.History).FirstOrDefaultAsync(m => m.Id == id);
            if (maintenance == null) return NotFound();

            maintenance.History.Add(new MaintenanceHistory
            {
                Status = "Comment",
                Note = request.Note,
                ChangedBy = request.Role // "Resident" or "Technician"
            });
            await _context.SaveChangesAsync();
            return Ok(MapToDto(maintenance));
        }

        [HttpPost("{id}/verify")]
        public async Task<IActionResult> VerifyResolution(int id, [FromBody] VerifyResolutionRequest request)
        {
            var maintenance = await _context.Maintenances.Include(m => m.History).FirstOrDefaultAsync(m => m.Id == id);
            if (maintenance == null) return NotFound();
            if (maintenance.Status != "Resolved") return BadRequest("Only resolved tickets can be verified.");

            if (request.IsApproved)
            {
                maintenance.Status = "Closed";
                maintenance.ResidentVerified = true;
                maintenance.History.Add(new MaintenanceHistory { Status = "Verified & Closed", Note = request.Note ?? "Resident verified repair.", ChangedBy = "Resident" });
            }
            else
            {
                maintenance.Status = "In Progress";
                maintenance.History.Add(new MaintenanceHistory { Status = "Verification Rejected", Note = request.Note ?? "Resident requested further work.", ChangedBy = "Resident" });
            }
            
            maintenance.UpdatedAt = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(MapToDto(maintenance));
        }

        [HttpPost("seed")]
        public async Task<IActionResult> SeedData()
        {
            if (!await _context.MaintenanceCategories.AnyAsync())
            {
                _context.MaintenanceCategories.AddRange(
                    new MaintenanceCategory { Name = "Plumbing" },
                    new MaintenanceCategory { Name = "Electrical" },
                    new MaintenanceCategory { Name = "HVAC" },
                    new MaintenanceCategory { Name = "General" }
                );
                await _context.SaveChangesAsync();
            }

            if (!await _context.Technicians.AnyAsync())
            {
                _context.Technicians.AddRange(
                    new Technician { Name = "Saman Kumara", ContactInformation = "0771234567", Skills = "Plumbing, General", Status = "Available" },
                    new Technician { Name = "Nimal Perera", ContactInformation = "0712345678", Skills = "Electrical, HVAC", Status = "Available" }
                );
                await _context.SaveChangesAsync();
            }

            var cats = await _context.MaintenanceCategories.ToListAsync();
            
            var complaints = new List<Models.Maintenance>
            {
                new Models.Maintenance { ResidentId = 1, CategoryId = cats.FirstOrDefault(c => c.Name == "Plumbing")?.Id ?? 1, Title = "Leaking Kitchen Sink", Description = "Water is dripping continuously from the pipe under the kitchen sink.", Priority = "High", Status = "Pending", CreatedAt = DateTimeOffset.UtcNow.AddDays(-2), UpdatedAt = DateTimeOffset.UtcNow.AddDays(-2) },
                new Models.Maintenance { ResidentId = 2, CategoryId = cats.FirstOrDefault(c => c.Name == "Electrical")?.Id ?? 1, Title = "Master Bedroom Power Outage", Description = "The lights and fan in the master bedroom are not working.", Priority = "Urgent", Status = "Pending", CreatedAt = DateTimeOffset.UtcNow.AddHours(-1), UpdatedAt = DateTimeOffset.UtcNow.AddHours(-1) },
                new Models.Maintenance { ResidentId = 1, CategoryId = cats.FirstOrDefault(c => c.Name == "HVAC")?.Id ?? 1, Title = "AC Not Cooling", Description = "The living room AC is blowing warm air instead of cold.", Priority = "Medium", Status = "Pending", CreatedAt = DateTimeOffset.UtcNow.AddDays(-1), UpdatedAt = DateTimeOffset.UtcNow.AddDays(-1) },
                new Models.Maintenance { ResidentId = 3, CategoryId = cats.FirstOrDefault(c => c.Name == "General")?.Id ?? 1, Title = "Broken Window Handle", Description = "The handle on the balcony window is jammed.", Priority = "Low", Status = "Pending", CreatedAt = DateTimeOffset.UtcNow.AddDays(-3), UpdatedAt = DateTimeOffset.UtcNow.AddDays(-3) },
                new Models.Maintenance { ResidentId = 4, CategoryId = cats.FirstOrDefault(c => c.Name == "Electrical")?.Id ?? 1, Title = "Sparks from Wall Socket", Description = "Sparks fly when I plug something into the kitchen socket.", Priority = "Urgent", Status = "Pending", CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-30), UpdatedAt = DateTimeOffset.UtcNow.AddMinutes(-30) }
            };

            foreach (var c in complaints)
            {
                c.History.Add(new MaintenanceHistory { Status = "Complaint Created", Note = "Seeded by system.", ChangedBy = "System" });
            }

            _context.Maintenances.AddRange(complaints);
            await _context.SaveChangesAsync();

            return Ok("Sample data seeded successfully.");
        }

        [HttpPost("setup-db")]
        public async Task<IActionResult> SetupDb()
        {
            try
            {
                await _context.Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE ""Technicians"" ADD COLUMN IF NOT EXISTS ""NicNumber"" text;
                    ALTER TABLE ""Technicians"" ADD COLUMN IF NOT EXISTS ""AccessPassCode"" text;
                    ALTER TABLE ""Technicians"" ADD COLUMN IF NOT EXISTS ""WorkingHours"" text;
                    ALTER TABLE ""Technicians"" ADD COLUMN IF NOT EXISTS ""IsAccessGranted"" boolean NOT NULL DEFAULT true;
                ");
                return Ok("Columns added successfully");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        private static MaintenanceDto MapToDto(Models.Maintenance m)
        {
            return new MaintenanceDto
            {
                Id = m.Id,
                ResidentId = m.ResidentId,
                Category = m.Category != null ? new MaintenanceCategoryDto { Id = m.Category.Id, Name = m.Category.Name } : null,
                Title = m.Title,
                Description = m.Description,
                Priority = m.Priority,
                Status = m.Status,
                Technician = m.Technician != null ? new TechnicianDto { Id = m.Technician.Id, Name = m.Technician.Name, Skills = m.Technician.Skills, Status = m.Technician.Status } : null,
                RepairCost = m.RepairCost,
                SlaDueDate = m.SlaDueDate,
                SlaStatus = m.SlaStatus,
                ResidentVerified = m.ResidentVerified,
                PhotoPath = m.PhotoPath,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt,
                History = m.History.Select(h => new MaintenanceHistoryDto
                {
                    Id = h.Id,
                    Status = h.Status,
                    Note = h.Note,
                    ChangedBy = h.ChangedBy,
                    CreatedAt = h.CreatedAt
                }).OrderByDescending(h => h.CreatedAt).ToList()
            };
        }
    }
}
