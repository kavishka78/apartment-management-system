using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Models;
using ApartmentManagement.Api.DTOs.Maintenance;
using ApartmentManagement.Api.DTOs.Safety;
using ApartmentManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ApartmentManagement.Api.Controllers.Maintenance
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MaintenanceController : ControllerBase
    {
        private DateTimeOffset ToColomboTime(DateTimeOffset utcTime)
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Colombo");
            return TimeZoneInfo.ConvertTime(utcTime, tz);
        }

        private DateTimeOffset CalculateDeadline(Models.Maintenance m)
        {
            if (m.SlaDueDate.HasValue) return m.SlaDueDate.Value;
            return m.Priority switch
            {
                "Urgent" => m.CreatedAt.AddHours(4),
                "High" => m.CreatedAt.AddHours(24),
                "Medium" => m.CreatedAt.AddDays(3),
                _ => m.CreatedAt.AddDays(7)
            };
        }
        private readonly AppDbContext _context;
        private readonly IMaintenanceTriageService _aiService;
        private readonly INotificationService _notificationService;
        private readonly SafetyValidationClient _safety;

        public MaintenanceController(AppDbContext context, IMaintenanceTriageService aiService, INotificationService notificationService, SafetyValidationClient safety)
        {
            _context = context;
            _aiService = aiService;
            _notificationService = notificationService;
            _safety = safety;
        }

        // Validation & Safety gate for committing a repair. Returns an error result to stop the action,
        // or null when the action may proceed.
        private async Task<ActionResult?> SafetyGateAsync(Models.Maintenance maintenance, int tenantId)
        {
            var key = $"maintenance:{maintenance.Id}";
            var latest = await _context.SafetyVerdictLogs
                .Where(v => v.WorkflowId == key)
                .OrderByDescending(v => v.CreatedAt)
                .FirstOrDefaultAsync();

            if (latest?.Verdict == "needs_human")
            {
                if (latest.HumanDecision == "approved") return null;
                if (latest.HumanDecision == "rejected") return StatusCode(403, "A manager rejected this repair in the safety audit.");
                return StatusCode(409, $"Awaiting manager approval in the safety audit (verdict {latest.Id}).");
            }

            int.TryParse(User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier), out var userId);
            var isSuperAdmin = User.IsInRole("SuperAdmin");

            var verdict = await _safety.ValidateAsync(new ProposedActionDto
            {
                WorkflowId = key,
                TenantId = tenantId,
                ProposedBy = "maintenance_assign",
                Requester = new RequesterDto
                {
                    UserId = userId,
                    Role = isSuperAdmin ? "SuperAdmin" : "ApartmentAdmin",
                    TenantId = tenantId,
                },
                Action = new ActionTargetDto
                {
                    Type = "approve_repair",
                    TargetTenantId = tenantId,
                    TargetResourceId = key,
                    AmountLkr = maintenance.RepairCost,
                },
            });

            return verdict.Verdict switch
            {
                "block" => StatusCode(403, verdict.Reason),
                "needs_human" => StatusCode(409, $"Awaiting manager approval in the safety audit (verdict {verdict.TraceId})."),
                _ => null,
            };
        }

        private async Task<AgentWorkflow> RecordTriageServiceFailureAsync(int maintenanceId, string objective, Exception exception)
        {
            var workflow = new AgentWorkflow
            {
                ApprovalUser = "",
                ApprovalNote = "",
                MaintenanceId = maintenanceId,
                Objective = objective,
                ApprovalStatus = "Failed",
                Status = "SafeFailure",
                IsSafeFailure = true,
                CurrentStep = "Safe Failure: triage service unavailable",
                Errors = $"Triage service failure: {exception.GetType().Name}"
            };
            _context.AgentWorkflows.Add(workflow);
            await _context.SaveChangesAsync();
            return workflow;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MaintenanceDto>>> GetMaintenances()
        {
            var query = _context.Maintenances
                .Include(m => m.Category)
                .Include(m => m.Resident)
                .Include(m => m.Technician)
                .Include(m => m.History)
                .AsQueryable();

            if (User.IsInRole("Resident"))
            {
                var resStr = User.FindFirst("residentId")?.Value;
                if (int.TryParse(resStr, out int rId))
                {
                    query = query.Where(m => m.ResidentId == rId);
                }
            }
            else if (User.IsInRole("Technician"))
            {
                var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
                var technician = await _context.Technicians.FirstOrDefaultAsync(t => t.Email != null && t.Email.ToLower() == email.ToLower());
                if (technician != null)
                {
                    query = query.Where(m => m.TechnicianId == technician.Id);
                }
            }

            var maintenances = await query.OrderByDescending(m => m.CreatedAt).ToListAsync();
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
                .Include(m => m.Resident)
                .Include(m => m.History)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (maintenance == null)
                return NotFound();

            // Data Privacy Check
            if (User.IsInRole("Resident"))
            {
                var resStr = User.FindFirst("residentId")?.Value;
                if (int.TryParse(resStr, out int rId) && maintenance.ResidentId != rId)
                    return StatusCode(403, "You cannot view other residents' tickets.");
            }
            else if (User.IsInRole("Technician"))
            {
                var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
                var technician = await _context.Technicians.FirstOrDefaultAsync(t => t.Email != null && t.Email.ToLower() == email.ToLower());
                if (technician == null || maintenance.TechnicianId != technician.Id)
                    return StatusCode(403, "You cannot view tickets assigned to other technicians.");
            }

            return Ok(MapToDto(maintenance));
        }

        [HttpPost]
        public async Task<ActionResult<MaintenanceDto>> CreateComplaint([FromBody] CreateComplaintRequest request)
        {
            var category = await _context.MaintenanceCategories.FindAsync(request.CategoryId);
            if (category == null) return BadRequest("Invalid category.");

            int resId = request.ResidentId;
            if (User.IsInRole("Resident"))
            {
                var resStr = User.FindFirst("residentId")?.Value;
                if (int.TryParse(resStr, out int rId))
                {
                    resId = rId;
                }
                else return Unauthorized("Invalid resident token.");
            }

            var maintenance = new Models.Maintenance
            {
                ResidentId = resId,
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

            // Start exactly one advisory triage workflow. Assignment remains blocked for manager approval.
            var scopeFactory = HttpContext.RequestServices.GetRequiredService<IServiceScopeFactory>();
            int newId = maintenance.Id;
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var ai = scope.ServiceProvider.GetRequiredService<IMaintenanceTriageService>();
                    
                    var m = await db.Maintenances.FindAsync(newId);
                    if (m == null) return;

                    var availableTechs = await db.Technicians.Where(t => t.Status == "Available").ToListAsync();
                    var activeTickets = await db.Maintenances
                        .Where(t => t.Status == "Assigned" || t.Status == "In Progress")
                        .GroupBy(t => t.TechnicianId)
                        .Where(g => g.Key.HasValue)
                        .Select(g => new { TechId = g.Key.Value, Count = g.Count() })
                        .ToDictionaryAsync(x => x.TechId, x => x.Count);

                    var result = await ai.TriageComplaintAsync(m.Title, m.Description, availableTechs, activeTickets, "Not yet assigned", "High");
                    
                    var allowedCats = new[] { "Plumbing", "Electrical", "HVAC", "Cleaning", "Security", "Elevator", "Building", "General", "Carpentry", "Appliance", "Pest Control", "Landscaping" };
                    var allowedPris = new[] { "Low", "Medium", "High", "Urgent" };
                    bool isValid = allowedCats.Contains(result.Category) && allowedPris.Contains(result.Priority);

                    var workflow = new AgentWorkflow
            {
                ApprovalUser = "",
                ApprovalNote = "",
                        MaintenanceId = newId,
                        Objective = "Auto-Triage Complaint and Assign Technician",
                        Plan = System.Text.Json.JsonSerializer.Serialize(result.Plan),
                        CompletedSteps = System.Text.Json.JsonSerializer.Serialize(result.CompletedSteps),
                        ToolResults = result.ToolResults ?? "",
                        ValidationResults = result.ValidationResults ?? "",
                        Errors = result.Errors ?? "" ?? "",
                        ApprovalStatus = (result.RecommendedTechnicianId == null || !isValid) ? "Failed" : "Pending",
                        Status = (result.RecommendedTechnicianId == null || !isValid) ? "SafeFailure" : "PendingApproval",
                        IsSafeFailure = result.RecommendedTechnicianId == null || !isValid,
                        CurrentStep = (result.RecommendedTechnicianId == null || !isValid) ? "Safe Failure: recommendation was not actioned" : "Pending Approval",
                        FinalOutcome = System.Text.Json.JsonSerializer.Serialize(new { result.RecommendedTechnicianId, result.Category, result.Priority, result.SlaRisk, Reason = result.TechnicianReason }),
                        Steps = result.AgentSteps.Select(step => new AgentWorkflowStep
                        {
                            Sequence = step.Sequence,
                            AgentRole = step.AgentRole,
                            Action = step.Action,
                            Status = step.Status,
                            ToolName = step.ToolName,
                            InputSummary = step.InputSummary,
                            OutputSummary = step.OutputSummary,
                            ValidationResult = step.ValidationResult,
                            DurationMilliseconds = step.DurationMilliseconds
                        }).ToList()
                    };

                    db.AgentWorkflows.Add(workflow);
                    await db.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    // A failed background call must still be observable and durable.
                    try
                    {
                        using var failureScope = scopeFactory.CreateScope();
                        var failureDb = failureScope.ServiceProvider.GetRequiredService<AppDbContext>();
                        failureDb.AgentWorkflows.Add(new AgentWorkflow
                        {
                            MaintenanceId = newId,
                            Objective = "Auto-Triage Complaint and Assign Technician",
                            ApprovalStatus = "Failed",
                            Status = "SafeFailure",
                            IsSafeFailure = true,
                            CurrentStep = "Safe Failure: triage service unavailable",
                            Errors = $"Triage service failure: {ex.GetType().Name}"
                        });
                        await failureDb.SaveChangesAsync();
                    }
                    catch { /* Preserve the original request even if audit persistence is unavailable. */ }
                }
            });

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

        [HttpPost("{id}/priority")]
        [Authorize(Roles = "ApartmentAdmin,SuperAdmin")]
        public async Task<ActionResult<MaintenanceDto>> UpdatePriority(int id, [FromBody] UpdatePriorityRequest request)
        {
            var maintenance = await _context.Maintenances.Include(m => m.History).Include(m => m.Resident).Include(m => m.Category).Include(m => m.Technician).FirstOrDefaultAsync(m => m.Id == id);
            if (maintenance == null) return NotFound();

            if (maintenance.Status == "Closed" || maintenance.Status == "Resolved")
                return BadRequest("Cannot change priority on a resolved or closed ticket.");

            var oldPriority = maintenance.Priority;
            maintenance.Priority = request.Priority;
            maintenance.UpdatedAt = DateTimeOffset.UtcNow;
            
            // Remove previous manual priority updates to prevent timeline spam
            var previousUpdates = maintenance.History.Where(h => h.Status == "Priority Updated").ToList();
            foreach (var update in previousUpdates)
            {
                _context.Remove(update);
            }

            maintenance.History.Add(new MaintenanceHistory
            {
                Status = "Priority Updated",
                Note = $"Priority changed to {maintenance.Priority} by Admin.",
                ChangedBy = "Manager"
            });

            await _context.SaveChangesAsync();
            return Ok(MapToDto(maintenance));
        }

        [HttpPost("{id}/assign")]
        [Authorize(Roles = "ApartmentAdmin,SuperAdmin")]
        public async Task<ActionResult<MaintenanceDto>> AssignTechnician(int id, [FromBody] AssignTechnicianRequest request)
        {
            var maintenance = await _context.Maintenances.Include(m => m.History).Include(m => m.Resident).Include(m => m.Category).Include(m => m.Technician).FirstOrDefaultAsync(m => m.Id == id);
            if (maintenance == null) return NotFound();

            if (maintenance.Status == "Closed" || maintenance.Status == "Resolved")
                return BadRequest("Cannot assign technician to a resolved or closed ticket.");

            var tech = await _context.Technicians.FindAsync(request.TechnicianId);
            if (tech == null) return BadRequest("Invalid technician.");

            var complexId = maintenance.Resident?.TenantId;
            if (complexId == null) return BadRequest("This ticket is not linked to a complex.");
            if (!User.IsInRole("SuperAdmin") && User.FindFirstValue("tenantId") != complexId.ToString()) return Forbid();

            var safetyDenied = await SafetyGateAsync(maintenance, complexId.Value);
            if (safetyDenied != null) return safetyDenied;

            maintenance.TechnicianId = request.TechnicianId;
            maintenance.Status = "Assigned";
            maintenance.UpdatedAt = DateTimeOffset.UtcNow;
            
            maintenance.History.Add(new MaintenanceHistory
            {
                Status = "Technician Assigned",
                Note = $"Assigned to {tech.Name}.",
                ChangedBy = "Manager"
            });

            var pendingWorkflow = await _context.AgentWorkflows
                .Where(w => w.MaintenanceId == id && (w.ApprovalStatus == "Pending" || w.Status == "SafeFailure" || w.ApprovalStatus == "Failed"))
                .OrderByDescending(w => w.CreatedAt)
                .FirstOrDefaultAsync();
            if (pendingWorkflow != null)
            {
                pendingWorkflow.ApprovalStatus = "Overridden";
                pendingWorkflow.Status = "Manually Assigned";
            }

            await _context.SaveChangesAsync();
            return Ok(MapToDto(maintenance));
        }

        [HttpPost("{id}/start")]
        [Authorize(Roles = "Technician,ApartmentAdmin,SuperAdmin")]
        public async Task<ActionResult<MaintenanceDto>> StartWork(int id)
        {
            var maintenance = await _context.Maintenances.Include(m => m.History).Include(m => m.Resident).Include(m => m.Category).Include(m => m.Technician).FirstOrDefaultAsync(m => m.Id == id);
            if (maintenance == null) return NotFound();

            // Resource-Based Authorization Check: Technicians can only modify their own assigned jobs
            if (User.IsInRole("Technician"))
            {
                var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
                var technician = await _context.Technicians.FirstOrDefaultAsync(t => t.Email != null && t.Email.ToLower() == email.ToLower());
                if (technician == null || maintenance.TechnicianId != technician.Id)
                {
                    return StatusCode(403, "You are not authorized to modify a job assigned to another technician.");
                }
            }

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
        [Authorize(Roles = "Technician,ApartmentAdmin,SuperAdmin")]
        public async Task<ActionResult<MaintenanceDto>> ResolveMaintenance(int id, [FromBody] ResolveMaintenanceRequest request)
        {
            var maintenance = await _context.Maintenances.Include(m => m.History).Include(m => m.Resident).Include(m => m.Category).Include(m => m.Technician).FirstOrDefaultAsync(m => m.Id == id);
            if (maintenance == null) return NotFound();

            // Resource-Based Authorization Check: Technicians can only modify their own assigned jobs
            if (User.IsInRole("Technician"))
            {
                var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
                var technician = await _context.Technicians.FirstOrDefaultAsync(t => t.Email != null && t.Email.ToLower() == email.ToLower());
                if (technician == null || maintenance.TechnicianId != technician.Id)
                {
                    return StatusCode(403, "You are not authorized to modify a job assigned to another technician.");
                }
            }

            if (maintenance.Status != "In Progress" && maintenance.Status != "Assigned")
                return BadRequest("Invalid status transition.");

            maintenance.Status = "Resolved";
            maintenance.RepairCost = request.RepairCost;
            maintenance.UpdatedAt = DateTimeOffset.UtcNow;

            // Generate Invoice if RepairCost > 0
            if (request.RepairCost > 0)
            {
                var invoice = new Invoice
                {
                    ResidentId = maintenance.ResidentId,
                    ApartmentId = 1, // Defaulting to 1 as ApartmentId is required but not directly on maintenance ticket
                    InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
                    BillingMonth = DateTime.UtcNow,
                    TotalAmount = request.RepairCost,
                    DueDate = DateTime.UtcNow.AddDays(7),
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow
                };

                var invoiceItem = new InvoiceItem
                {
                    Description = $"Repair Cost for Maintenance Ticket #{maintenance.Id} ({maintenance.Title})",
                    ChargeType = "Repair Cost",
                    Amount = request.RepairCost
                };
                
                invoice.InvoiceItems.Add(invoiceItem);
                _context.Invoices.Add(invoice);
            }

maintenance.History.Add(new MaintenanceHistory
            {
                Status = "Resolved",
                Note = request.Note,
                ChangedBy = "Technician"
            });

            _context.Notifications.Add(new Notification
            {
                ResidentId = maintenance.ResidentId,
                Title = "Maintenance Resolved",
                Message = $"Your request '{maintenance.Title}' has been resolved by the technician. Please verify the resolution.",
                CreatedAt = DateTimeOffset.UtcNow
            });

            if (!string.IsNullOrEmpty(maintenance.Resident?.FcmToken))
            {
                await _notificationService.SendPushNotificationAsync(
                    maintenance.Resident.FcmToken,
                    "Maintenance Resolved",
                    $"Your request '{maintenance.Title}' has been resolved by the technician."
                );
            }

            await _context.SaveChangesAsync();
            return Ok(MapToDto(maintenance));
        }

        [HttpPost("{id}/close")]
        [Authorize(Roles = "ApartmentAdmin,SuperAdmin")]
        public async Task<ActionResult<MaintenanceDto>> CloseMaintenance(int id)
        {
            var maintenance = await _context.Maintenances.Include(m => m.History).Include(m => m.Resident).Include(m => m.Category).Include(m => m.Technician).FirstOrDefaultAsync(m => m.Id == id);
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
        [Authorize(Roles = "ApartmentAdmin,SuperAdmin")]
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

                        var deadline = CalculateDeadline(maintenance);
            if (!maintenance.SlaDueDate.HasValue) 
            {
                maintenance.SlaDueDate = deadline;
                await _context.SaveChangesAsync();
            }

            var colomboCreated = ToColomboTime(maintenance.CreatedAt).ToString("MMM dd, yyyy hh:mm tt");
            var colomboDeadline = ToColomboTime(deadline).ToString("MMM dd, yyyy hh:mm tt");
            var colomboNow = ToColomboTime(DateTimeOffset.UtcNow).ToString("MMM dd, yyyy hh:mm tt");

            var slaContext = $"Created: {colomboCreated} | Deadline: {colomboDeadline} | Now: {colomboNow}";

                        var timeDiff = deadline - DateTimeOffset.UtcNow;
            string risk = "Low";
            if (timeDiff.TotalHours < 0) risk = "Urgent";
            else if (timeDiff.TotalHours < 24) risk = "High";
            else if (timeDiff.TotalHours < 72) risk = "Medium";

            AiTriageRecommendationDto result;
            try
            {
                result = await _aiService.TriageComplaintAsync(maintenance.Title, maintenance.Description, availableTechs, activeTickets, slaContext, risk);
            }
            catch (Exception ex)
            {
                var failed = await RecordTriageServiceFailureAsync(id, "Triage Complaint and Assign Technician", ex);
                return StatusCode(503, new { workflowId = failed.Id, status = failed.Status, message = "AI triage is unavailable; a safe-failure workflow was recorded." });
            }
            
            // [Requirement 2 & 4] Deterministic Validation in C#
            var allowedCats = new[] { "Plumbing", "Electrical", "HVAC", "Cleaning", "Security", "Elevator", "Building", "General", "Carpentry", "Appliance", "Pest Control", "Landscaping" };
            var allowedPris = new[] { "Low", "Medium", "High", "Urgent" };
            bool isValid = allowedCats.Contains(result.Category) && allowedPris.Contains(result.Priority);

            // [Requirement 9] Safe Failure mapping
            string workflowStatus = (result.RecommendedTechnicianId == null || !isValid) ? "SafeFailure" : "PendingApproval";
            string approvalStatus = (result.RecommendedTechnicianId == null || !isValid) ? "Failed" : "Pending";
            string currentStep = workflowStatus == "SafeFailure" ? (isValid ? "Safe Failure: No technician available" : "Safe Failure: Validation Rejected AI Output") : "Pending Approval";

            // Persist Agent Workflow State
            var workflow = new AgentWorkflow
            {
                ApprovalUser = "",
                ApprovalNote = "",
                MaintenanceId = id,
                Objective = "Triage Complaint and Assign Technician",
                Plan = System.Text.Json.JsonSerializer.Serialize(result.Plan),
                CompletedSteps = System.Text.Json.JsonSerializer.Serialize(result.CompletedSteps),
                ToolResults = result.ToolResults ?? "",
                ValidationResults = result.ValidationResults ?? "",
                Errors = result.Errors ?? "" ?? "",
                ApprovalStatus = approvalStatus,
                Status = workflowStatus,
                IsSafeFailure = workflowStatus == "SafeFailure",
                CurrentStep = currentStep,
                FinalOutcome = System.Text.Json.JsonSerializer.Serialize(new { result.RecommendedTechnicianId, result.Category, result.Priority, result.SlaRisk, Reason = result.TechnicianReason }),
                Steps = result.AgentSteps.Select(step => new AgentWorkflowStep
                {
                    Sequence = step.Sequence,
                    AgentRole = step.AgentRole,
                    Action = step.Action,
                    Status = step.Status,
                    ToolName = step.ToolName,
                    InputSummary = step.InputSummary,
                    OutputSummary = step.OutputSummary,
                    ValidationResult = step.ValidationResult,
                    DurationMilliseconds = step.DurationMilliseconds
                }).ToList()
            };
            
            _context.AgentWorkflows.Add(workflow);
            

            
            await _context.SaveChangesAsync();
            
            result.WorkflowId = workflow.Id;

            return Ok(result);
        }

        [HttpGet("{id}/workflows/latest")]
        public async Task<IActionResult> GetLatestWorkflow(int id)
        {
            var workflow = await _context.AgentWorkflows
                .Include(w => w.Steps)
                .Include(w => w.Maintenance)
                .Where(w => w.MaintenanceId == id)
                .OrderByDescending(w => w.CreatedAt)
                .FirstOrDefaultAsync();
            if (workflow != null && User.IsInRole("Resident"))
            {
                var residentId = User.FindFirst("residentId")?.Value;
                if (!int.TryParse(residentId, out var parsedResidentId) || workflow.Maintenance.ResidentId != parsedResidentId)
                    return Forbid();
            }
            return workflow == null ? NotFound() : Ok(ToWorkflowSummary(workflow));
        }

        [HttpGet("workflows/{workflowId}")]
        [Authorize(Roles = "ApartmentAdmin,SuperAdmin")]
        public async Task<IActionResult> GetWorkflow(int workflowId)
        {
            var workflow = await _context.AgentWorkflows
                .Include(w => w.Steps)
                .FirstOrDefaultAsync(w => w.Id == workflowId);
            return workflow == null ? NotFound() : Ok(ToWorkflowSummary(workflow));
        }

        [HttpPost("workflows/{workflowId}/approval")]
        [Authorize(Roles = "ApartmentAdmin,SuperAdmin")]
        public async Task<IActionResult> DecideWorkflow(int workflowId, [FromBody] WorkflowApprovalRequest request)
        {
            var workflow = await _context.AgentWorkflows.FirstOrDefaultAsync(w => w.Id == workflowId);
            if (workflow == null) return NotFound();
            if (workflow.ApprovalStatus != "Pending") return BadRequest("This workflow has already been decided.");

            var approvedBy = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                ?? User.Identity?.Name
                ?? "AuthorizedAdministrator";
            workflow.ApprovalUser = approvedBy;
            workflow.ApprovalTime = DateTimeOffset.UtcNow;
            workflow.ApprovalNote = request.Note ?? string.Empty;
            workflow.UpdatedAt = DateTimeOffset.UtcNow;

            if (request.Decision == "Reject")
            {
                workflow.ApprovalStatus = "Rejected";
                workflow.Status = "Rejected";
                workflow.CurrentStep = "Recommendation rejected by manager";
            }
            else if (request.Decision == "RequestRevision")
            {
                workflow.ApprovalStatus = "Revised";
                workflow.Status = "RevisionRequested";
                workflow.CurrentStep = "Revision requested by manager";
            }
            else if (request.Decision == "Approve")
            {
                var recommendation = System.Text.Json.JsonSerializer.Deserialize<AiTriageRecommendationDto>(workflow.FinalOutcome);
                if (recommendation?.RecommendedTechnicianId == null)
                    return BadRequest("There is no validated technician recommendation to approve.");

                var maintenance = await _context.Maintenances.Include(m => m.History)
                    .FirstOrDefaultAsync(m => m.Id == workflow.MaintenanceId);
                var technician = await _context.Technicians.FindAsync(recommendation.RecommendedTechnicianId.Value);
                if (maintenance == null || technician == null || technician.Status != "Available")
                    return BadRequest("The recommended technician is no longer eligible; request a revision.");

                maintenance.TechnicianId = technician.Id;
                maintenance.Status = "Assigned";
                
                // Update Priority and Category from AI Recommendation
                if (!string.IsNullOrEmpty(recommendation.Priority))
                {
                    maintenance.Priority = recommendation.Priority;
                }
                
                var newCat = await _context.MaintenanceCategories.FirstOrDefaultAsync(c => c.Name == recommendation.Category);
                if (newCat != null)
                {
                    maintenance.CategoryId = newCat.Id;
                }

                maintenance.UpdatedAt = DateTimeOffset.UtcNow;
                maintenance.History.Add(new MaintenanceHistory
                {
                    Status = "AI Recommendation Approved & Technician Assigned",
                    Note = $"Approved by {approvedBy}. Priority set to {maintenance.Priority}. {request.Note}".Trim(),
                    ChangedBy = approvedBy
                });
                workflow.ApprovalStatus = "Approved";
                workflow.Status = "Approved";
                workflow.CurrentStep = "Assignment approved and executed";
            }
            else return BadRequest("Unsupported workflow decision.");

            await _context.SaveChangesAsync();
            return Ok(ToWorkflowSummary(workflow));
        }

                public class ReviseTriageRequest { public string ManagerFeedback { get; set; } = string.Empty; }

        [HttpPost("{id}/revise")]
        [Authorize(Roles = "ApartmentAdmin,SuperAdmin")]
        public async Task<ActionResult<AiTriageRecommendationDto>> ReviseAiTriageRecommendation(int id, [FromBody] ReviseTriageRequest request)
        {
            var maintenance = await _context.Maintenances.FindAsync(id);
            if (maintenance == null) return NotFound();

            var availableTechs = await _context.Technicians.Where(t => t.Status == "Available").ToListAsync();
            var activeTickets = await _context.Maintenances
                .Where(m => m.Status == "Assigned" || m.Status == "In Progress")
                .GroupBy(m => m.TechnicianId)
                .Where(g => g.Key.HasValue)
                .Select(g => new { TechId = g.Key.Value, Count = g.Count() })
                .ToDictionaryAsync(k => k.TechId, v => v.Count);

                        var deadline = CalculateDeadline(maintenance);
            if (!maintenance.SlaDueDate.HasValue) 
            {
                maintenance.SlaDueDate = deadline;
                await _context.SaveChangesAsync();
            }

            var colomboCreated = ToColomboTime(maintenance.CreatedAt).ToString("MMM dd, yyyy hh:mm tt");
            var colomboDeadline = ToColomboTime(deadline).ToString("MMM dd, yyyy hh:mm tt");
            var colomboNow = ToColomboTime(DateTimeOffset.UtcNow).ToString("MMM dd, yyyy hh:mm tt");

            var slaContext = $"Created: {colomboCreated} | Deadline: {colomboDeadline} | Now: {colomboNow}";

                        var timeDiff = deadline - DateTimeOffset.UtcNow;
            string risk = "Low";
            if (timeDiff.TotalHours < 0) risk = "Urgent";
            else if (timeDiff.TotalHours < 24) risk = "High";
            else if (timeDiff.TotalHours < 72) risk = "Medium";

            AiTriageRecommendationDto result;
            try
            {
                result = await _aiService.TriageComplaintAsync(maintenance.Title, maintenance.Description, availableTechs, activeTickets, slaContext, risk, request.ManagerFeedback);
            }
            catch (Exception ex)
            {
                var failed = await RecordTriageServiceFailureAsync(id, "Revise Triage Complaint", ex);
                return StatusCode(503, new { workflowId = failed.Id, status = failed.Status, message = "AI triage is unavailable; a safe-failure workflow was recorded." });
            }
            
            // Mark older pending workflows for this ticket as revised
            var oldWorkflows = await _context.AgentWorkflows.Where(w => w.MaintenanceId == id && w.ApprovalStatus == "Pending").ToListAsync();
            foreach(var ow in oldWorkflows) { ow.ApprovalStatus = "Revised"; }

            var allowedCats = new[] { "Plumbing", "Electrical", "HVAC", "Cleaning", "Security", "Elevator", "Building", "General", "Carpentry", "Appliance", "Pest Control", "Landscaping" };
            var allowedPris = new[] { "Low", "Medium", "High", "Urgent" };
            bool isValid = allowedCats.Contains(result.Category) && allowedPris.Contains(result.Priority);

            string workflowStatus = (result.RecommendedTechnicianId == null || !isValid) ? "SafeFailure" : "PendingApproval";
            string approvalStatus = (result.RecommendedTechnicianId == null || !isValid) ? "Failed" : "Pending";
            string currentStep = workflowStatus == "SafeFailure" ? (isValid ? "Safe Failure: No technician available" : "Safe Failure: Validation Rejected AI Output") : "Pending Approval";

            var workflow = new AgentWorkflow
            {
                ApprovalUser = "",
                ApprovalNote = "",
                MaintenanceId = id,
                Objective = "Revise Triage Complaint",
                Plan = System.Text.Json.JsonSerializer.Serialize(result.Plan),
                CompletedSteps = System.Text.Json.JsonSerializer.Serialize(result.CompletedSteps),
                ToolResults = result.ToolResults ?? "",
                ValidationResults = result.ValidationResults ?? "",
                Errors = result.Errors ?? "" ?? "",
                ApprovalStatus = approvalStatus,
                Status = workflowStatus,
                IsSafeFailure = workflowStatus == "SafeFailure",
                CurrentStep = currentStep,
                FinalOutcome = System.Text.Json.JsonSerializer.Serialize(new { result.RecommendedTechnicianId, result.Category, result.Priority, result.SlaRisk, Reason = result.TechnicianReason }),
                Steps = result.AgentSteps.Select(step => new AgentWorkflowStep
                {
                    Sequence = step.Sequence,
                    AgentRole = step.AgentRole,
                    Action = step.Action,
                    Status = step.Status,
                    ToolName = step.ToolName,
                    InputSummary = step.InputSummary,
                    OutputSummary = step.OutputSummary,
                    ValidationResult = step.ValidationResult,
                    DurationMilliseconds = step.DurationMilliseconds
                }).ToList()
            };
            
            _context.AgentWorkflows.Add(workflow);
            
            maintenance.History.Add(new MaintenanceHistory
            {
                Status = "AI Triage Revised",
                Note = $"Manager requested revision: {request.ManagerFeedback}",
                ChangedBy = "Manager"
            });
            
            await _context.SaveChangesAsync();
            result.WorkflowId = workflow.Id;
            return Ok(result);
        }

        [HttpPost("{id}/reject")]
        [Authorize(Roles = "ApartmentAdmin,SuperAdmin")]
        public async Task<IActionResult> RejectAiTriageRecommendation(int id)
        {
            var pendingWorkflow = await _context.AgentWorkflows
                .Where(w => w.MaintenanceId == id && w.ApprovalStatus == "Pending")
                .OrderByDescending(w => w.CreatedAt)
                .FirstOrDefaultAsync();
                
            if (pendingWorkflow != null)
            {
                pendingWorkflow.ApprovalStatus = "Rejected";
                pendingWorkflow.ApprovalUser = "Manager";
                pendingWorkflow.ApprovalTime = DateTimeOffset.UtcNow;
                pendingWorkflow.CurrentStep = "Rejected by Manager";
            }

            var maintenance = await _context.Maintenances.FindAsync(id);
            if (maintenance != null)
            {
                maintenance.History.Add(new MaintenanceHistory
                {
                    Status = "AI Triage Rejected",
                    Note = "Manager rejected the AI recommendation.",
                    ChangedBy = "Manager"
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Rejected successfully" });
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
            var maintenance = await _context.Maintenances.Include(m => m.History).Include(m => m.Resident).Include(m => m.Category).Include(m => m.Technician).FirstOrDefaultAsync(m => m.Id == id);
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
            var maintenance = await _context.Maintenances.Include(m => m.History).Include(m => m.Resident).Include(m => m.Category).Include(m => m.Technician).FirstOrDefaultAsync(m => m.Id == id);
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

        
        [HttpPost("sync-categories")]
        public async Task<IActionResult> SyncCategories()
        {
            var existing = await _context.MaintenanceCategories.Select(c => c.Name).ToListAsync();
            var required = new[] { "Cleaning", "Security", "Elevator", "Building" };
            
            foreach (var req in required)
            {
                if (!existing.Contains(req))
                {
                    _context.MaintenanceCategories.Add(new MaintenanceCategory { Name = req });
                }
            }
            await _context.SaveChangesAsync();
            return Ok("Categories synced.");
        }

        [AllowAnonymous]
        [HttpPost("seed")]
        public async Task<IActionResult> SeedData()
        {
            if (!await _context.MaintenanceCategories.AnyAsync())
            {
                _context.MaintenanceCategories.AddRange(
                    new MaintenanceCategory { Name = "Plumbing" },
                    new MaintenanceCategory { Name = "Electrical" },
                    new MaintenanceCategory { Name = "HVAC" },
                    new MaintenanceCategory { Name = "General" }, new MaintenanceCategory { Name = "Cleaning" }, new MaintenanceCategory { Name = "Security" }, new MaintenanceCategory { Name = "Elevator" }, new MaintenanceCategory { Name = "Building" }, new MaintenanceCategory { Name = "Carpentry" }, new MaintenanceCategory { Name = "Appliance" }, new MaintenanceCategory { Name = "Pest Control" }, new MaintenanceCategory { Name = "Landscaping" }
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

        [AllowAnonymous]
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
                    
                    CREATE TABLE IF NOT EXISTS ""AgentWorkflows"" (
                        ""Id"" integer GENERATED BY DEFAULT AS IDENTITY,
                        ""MaintenanceId"" integer NOT NULL,
                        ""Objective"" text,
                        ""Plan"" text,
                        ""CurrentStep"" text,
                        ""CompletedSteps"" text,
                        ""ToolResults"" text,
                        ""ValidationResults"" text,
                        ""Errors"" text,
                        ""ApprovalStatus"" text,
                        ""ApprovalUser"" text,
                        ""ApprovalTime"" timestamp with time zone,
                        ""FinalOutcome"" text,
                        ""CreatedAt"" timestamp with time zone NOT NULL,
                        ""UpdatedAt"" timestamp with time zone NOT NULL,
                        CONSTRAINT ""PK_AgentWorkflows"" PRIMARY KEY (""Id""),
                        CONSTRAINT ""FK_AgentWorkflows_Maintenances_MaintenanceId"" FOREIGN KEY (""MaintenanceId"") REFERENCES ""Maintenances"" (""Id"") ON DELETE CASCADE
                    );
                ");
                await _context.Database.ExecuteSqlRawAsync(@"
    ALTER TABLE ""AgentWorkflows"" ADD COLUMN IF NOT EXISTS ""Status"" text DEFAULT 'Running';
    ALTER TABLE ""AgentWorkflows"" ADD COLUMN IF NOT EXISTS ""ApprovalNote"" text DEFAULT '';
    ALTER TABLE ""AgentWorkflows"" ADD COLUMN IF NOT EXISTS ""IsSafeFailure"" boolean NOT NULL DEFAULT false;

    CREATE TABLE IF NOT EXISTS ""AgentWorkflowSteps"" (
        ""Id"" integer GENERATED BY DEFAULT AS IDENTITY,
        ""AgentWorkflowId"" integer NOT NULL,
        ""Sequence"" integer NOT NULL,
        ""AgentRole"" text,
        ""Action"" text,
        ""Status"" text,
        ""ToolName"" text,
        ""InputSummary"" text,
        ""OutputSummary"" text,
        ""ValidationResult"" text,
        ""DurationMilliseconds"" integer NOT NULL,
        ""CreatedAt"" timestamp with time zone NOT NULL,
        CONSTRAINT ""PK_AgentWorkflowSteps"" PRIMARY KEY (""Id""),
        CONSTRAINT ""FK_AgentWorkflowSteps_AgentWorkflows_AgentWorkflowId"" FOREIGN KEY (""AgentWorkflowId"") REFERENCES ""AgentWorkflows"" (""Id"") ON DELETE CASCADE
    );
");
return Ok("Database setup successfully");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        private static object ToWorkflowSummary(AgentWorkflow workflow)
        {
            return new
            {
                workflow.Id,
                workflow.MaintenanceId,
                workflow.Objective,
                workflow.Plan,
                workflow.CurrentStep,
                workflow.Status,
                workflow.CompletedSteps,
                workflow.ToolResults,
                workflow.ValidationResults,
                workflow.Errors,
                workflow.ApprovalStatus,
                workflow.ApprovalUser,
                workflow.ApprovalTime,
                workflow.ApprovalNote,
                workflow.FinalOutcome,
                workflow.IsSafeFailure,
                workflow.CreatedAt,
                workflow.UpdatedAt,
                Steps = workflow.Steps.OrderBy(step => step.Sequence).Select(step => new
                {
                    step.Sequence,
                    step.AgentRole,
                    step.Action,
                    step.Status,
                    step.ToolName,
                    step.InputSummary,
                    step.OutputSummary,
                    step.ValidationResult,
                    step.DurationMilliseconds,
                    step.CreatedAt
                })
            };
        }

        private static MaintenanceDto MapToDto(Models.Maintenance m)
        {
            return new MaintenanceDto
            {
                Id = m.Id,
                ResidentId = m.ResidentId,
                ResidentName = m.Resident?.FullName ?? "Unknown Resident",
                ResidentPhone = m.Resident?.PhoneNumber ?? "No Phone",
                UnitNumber = m.Resident?.UnitNumber ?? "Unknown Unit",
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

        [HttpPost("chat")]
        [Authorize(Roles = "Resident")]
        public async Task<IActionResult> ChatWithAssistant([FromBody] ResidentChatRequestDto request)
        {
            try
            {
                var response = await _aiService.ChatWithResidentAgentAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error communicating with Resident AI: {ex}");
                return StatusCode(500, new { success = false, error = "Failed to communicate with AI Assistant." });
            }
        }

    }
}








