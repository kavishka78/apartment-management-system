using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Models;
using ApartmentManagement.Api.Services;

namespace ApartmentManagement.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WorkflowsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly FacilityAgentClient _agentClient;
        private readonly ILogger<WorkflowsController> _logger;

        public WorkflowsController(AppDbContext context, FacilityAgentClient agentClient, ILogger<WorkflowsController> logger)
        {
            _context = context;
            _agentClient = agentClient;
            _logger = logger;
        }

        public class PlanRequestDto
        {
            public string Objective { get; set; } = string.Empty;
            public int ResidentId { get; set; } = 1;
            public string ResidentName { get; set; } = "Resident";
        }

        // POST: /api/workflows/plan-facility-parking
        [HttpPost("plan-facility-parking")]
        public async Task<IActionResult> PlanFacilityAndParking([FromBody] PlanRequestDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Objective))
                    return BadRequest("Objective cannot be empty.");

                // 1. Delegate request to Python LangGraph Multi-Agent System
                var agentResult = await _agentClient.PlanFacilityAndParkingAsync(dto.Objective, dto.ResidentId, dto.ResidentName);

                string workflowId = agentResult.GetProperty("workflow_id").GetString() ?? Guid.NewGuid().ToString();
                string validationStatus = agentResult.GetProperty("validation_status").GetString() ?? "Pending";
                bool requiresApproval = agentResult.TryGetProperty("requires_approval", out var raProp) ? raProp.GetBoolean() : true;

                var planElement = agentResult.GetProperty("plan");
                var extractedElement = agentResult.GetProperty("extracted_data");
                var toolResultsElement = agentResult.GetProperty("tool_results");
                var proposalElement = agentResult.GetProperty("proposal");

                // 2. Persist Workflow State into PostgreSQL Database for Auditability & Approval
                var workflow = new AgentWorkflow
                {
                    WorkflowId = workflowId,
                    ResidentId = dto.ResidentId,
                    ResidentName = dto.ResidentName,
                    Objective = dto.Objective,
                    AgentType = "IntegratedFacilityAndParkingAgent",
                    PlanJson = planElement.GetRawText(),
                    ExtractedDataJson = extractedElement.GetRawText(),
                    ToolResultsJson = toolResultsElement.GetRawText(),
                    ProposalJson = proposalElement.ValueKind != JsonValueKind.Null ? proposalElement.GetRawText() : "{}",
                    ValidationStatus = validationStatus,
                    RequiresApproval = true,
                    Status = "PendingApproval",
                    CreatedAt = DateTime.UtcNow
                };

                _context.AgentWorkflows.Add(workflow);
                await _context.SaveChangesAsync();

                return StatusCode(201, new
                {
                    Message = "Workflow paused for Human Manager Approval.",
                    Workflow = workflow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing AI workflow plan request.");
                return StatusCode(500, new { Message = "An error occurred while generating agentic AI workflow plan.", Details = ex.Message });
            }
        }

        // GET: /api/workflows
        [HttpGet]
        public async Task<IActionResult> GetWorkflows([FromQuery] string? status = null)
        {
            try
            {
                var query = _context.AgentWorkflows.AsQueryable();

                if (!string.IsNullOrWhiteSpace(status))
                {
                    if (status.Equals("pending", StringComparison.OrdinalIgnoreCase))
                    {
                        query = query.Where(w => w.Status == "PendingApproval" || w.Status == "Pending" || w.Status == "AutoApproved");
                    }
                    else
                    {
                        query = query.Where(w => w.Status.ToLower() == status.ToLower());
                    }
                }

                var workflows = await query.OrderByDescending(w => w.CreatedAt).ToListAsync();
                return Ok(workflows);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving agent workflows.");
                return StatusCode(500, new { Message = "An error occurred retrieving workflows." });
            }
        }

        // GET: /api/workflows/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetWorkflowById(int id)
        {
            var workflow = await _context.AgentWorkflows.FindAsync(id);
            if (workflow == null) return NotFound("Workflow not found.");
            return Ok(workflow);
        }

        // PUT: /api/workflows/{id}/approve
        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveWorkflow(int id)
        {
            try
            {
                var workflow = await _context.AgentWorkflows.FindAsync(id);
                if (workflow == null) return NotFound("Workflow not found.");

                if (workflow.Status == "Approved")
                    return BadRequest("Workflow is already approved.");

                // Parse the AI Proposal JSON to execute the actual database insertion
                using var doc = JsonDocument.Parse(workflow.ProposalJson);
                var root = doc.RootElement;

                int facilityId = root.TryGetProperty("facilityId", out var fidProp) ? fidProp.GetInt32() : 3;
                string dateStr = root.TryGetProperty("date", out var dProp) && dProp.GetString() != null ? dProp.GetString()! : DateTime.UtcNow.ToString("yyyy-MM-dd");
                string startTimeStr = root.TryGetProperty("startTime", out var stProp) && stProp.GetString() != null ? stProp.GetString()! : "16:00:00";
                string endTimeStr = root.TryGetProperty("endTime", out var etProp) && etProp.GetString() != null ? etProp.GetString()! : "20:00:00";
                int visitorVehicles = root.TryGetProperty("visitorVehicles", out var vvProp) ? vvProp.GetInt32() : 0;

                DateTime bookingDate = DateTime.SpecifyKind(DateTime.Parse(dateStr), DateTimeKind.Utc);
                TimeSpan startTime = TimeSpan.Parse(startTimeStr);
                TimeSpan endTime = TimeSpan.Parse(endTimeStr);

                // 1. Execute High-Impact Action A: Create Facility Booking
                var booking = new FacilityBooking
                {
                    FacilityId = facilityId,
                    ResidentId = workflow.ResidentId,
                    BookingDate = bookingDate,
                    StartTime = startTime,
                    EndTime = endTime,
                    Status = BookingStatus.Approved
                };
                _context.FacilityBookings.Add(booking);

                // 2. Execute High-Impact Action B: Allocate Visitor Parking & Issue Passes
                if (visitorVehicles > 0)
                {
                    var availableSlots = await _context.ParkingSlots
                        .Where(s => s.SlotType == ParkingSlotType.Visitor || s.IsAvailable)
                        .Take(visitorVehicles)
                        .ToListAsync();

                    int slotIndex = 0;
                    for (int i = 0; i < visitorVehicles; i++)
                    {
                        var assignedSlot = slotIndex < availableSlots.Count ? availableSlots[slotIndex++] : null;
                        var pass = new VisitorPass
                        {
                            ResidentId = workflow.ResidentId,
                            VisitorName = $"Event Guest #{i + 1} ({workflow.ResidentName})",
                            PhoneNumber = "0770000000",
                            VehicleNumber = $"WP V-PASS-{Random.Shared.Next(1000, 9999)}",
                            ExpectedArrival = bookingDate.Add(startTime),
                            AccessCode = $"AC-{Random.Shared.Next(100000, 999999)}",
                            AssignedParkingSlot = assignedSlot,
                            Status = PassStatus.Active
                        };
                        _context.VisitorPasses.Add(pass);
                    }
                }

                // 3. Mark Workflow as Approved
                workflow.Status = "Approved";
                workflow.ActionedAt = DateTime.UtcNow;
                workflow.ActionedBy = "Admin Manager";

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Message = "Workflow approved successfully. Facility booking and visitor parking passes created in database.",
                    Workflow = workflow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving workflow {WorkflowId}", id);
                return StatusCode(500, new { Message = "An error occurred while approving workflow.", Details = ex.Message });
            }
        }

        // PUT: /api/workflows/{id}/reject
        [HttpPut("{id}/reject")]
        public async Task<IActionResult> RejectWorkflow(int id)
        {
            var workflow = await _context.AgentWorkflows.FindAsync(id);
            if (workflow == null) return NotFound("Workflow not found.");

            workflow.Status = "Rejected";
            workflow.ActionedAt = DateTime.UtcNow;
            workflow.ActionedBy = "Admin Manager";

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Workflow rejected successfully.", Workflow = workflow });
        }

        // PUT: /api/workflows/{id}/revise
        [HttpPut("{id}/revise")]
        public async Task<IActionResult> ReviseWorkflow(int id, [FromBody] Dictionary<string, string> body)
        {
            var workflow = await _context.AgentWorkflows.FindAsync(id);
            if (workflow == null) return NotFound("Workflow not found.");

            workflow.Status = "RequiresRevision";
            workflow.ActionedAt = DateTime.UtcNow;
            workflow.ActionedBy = "Admin Manager";
            if (body != null && body.ContainsKey("notes"))
            {
                workflow.ManagerNotes = body["notes"];
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Workflow marked for revision.", Workflow = workflow });
        }
    }
}
