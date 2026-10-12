using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
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

        public class LocalPlanRequestDto : PlanRequestDto
        {
            public JsonElement AgentResult { get; set; }
        }

        // The mobile client calls its local agent and uploads the resulting draft.
        // No AI service is contacted by Railway on this path.
        [Authorize]
        [HttpPost("save-local-plan")]
        public async Task<IActionResult> SaveLocalPlan([FromBody] LocalPlanRequestDto dto)
        {
            if (!int.TryParse(User.FindFirst("residentId")?.Value, out var residentId)
                || residentId != dto.ResidentId)
                return Forbid();
            if (string.IsNullOrWhiteSpace(dto.Objective))
                return BadRequest(new { Message = "Objective is required." });
            var result = dto.AgentResult;
            if (result.ValueKind != JsonValueKind.Object
                || !result.TryGetProperty("proposal", out var proposal)
                || proposal.ValueKind != JsonValueKind.Object
                || !proposal.TryGetProperty("facilityId", out var facilityId)
                || !facilityId.TryGetInt32(out var id)
                || !result.TryGetProperty("plan", out var plan) || plan.ValueKind != JsonValueKind.Array
                || !result.TryGetProperty("extracted_data", out var extracted)
                || !result.TryGetProperty("tool_results", out var tools))
                return BadRequest(new { Message = "Invalid Facility proposal." });
            var resident = await _context.Residents.FindAsync(residentId);
            var facility = await _context.Facilities.FindAsync(id);
            if (resident == null || facility == null
                || User.FindFirst("tenantId")?.Value != resident.TenantId.ToString())
                return Forbid();
            if (!proposal.TryGetProperty("guests", out var guestCount) || !guestCount.TryGetInt32(out var guests)
                || guests < 1 || guests > facility.Capacity
                || !proposal.TryGetProperty("visitorVehicles", out var vehicleCount) || !vehicleCount.TryGetInt32(out var vehicles)
                || vehicles < 0 || vehicles > 100
                || !proposal.TryGetProperty("date", out var date) || date.ValueKind != JsonValueKind.String
                || !DateTime.TryParse(date.GetString(), out _)
                || !proposal.TryGetProperty("startTime", out var start) || start.ValueKind != JsonValueKind.String
                || !TimeSpan.TryParse(start.GetString(), out _)
                || !proposal.TryGetProperty("endTime", out var end) || end.ValueKind != JsonValueKind.String
                || !TimeSpan.TryParse(end.GetString(), out _))
                return BadRequest(new { Message = "Invalid booking date, time, guest count or parking count." });
            var workflow = new FacilityAgentWorkflow
            {
                WorkflowId = Guid.NewGuid().ToString(),
                ResidentId = residentId,
                ResidentName = dto.ResidentName,
                Objective = dto.Objective,
                AgentType = "LocalFacilityAndParkingAgent",
                PlanJson = plan.GetRawText(),
                ExtractedDataJson = extracted.GetRawText(),
                ToolResultsJson = tools.GetRawText(),
                ProposalJson = proposal.GetRawText(),
                ValidationStatus = "Proposal ready. Confirm to submit the booking.",
                RequiresApproval = true,
                Status = "PendingApproval",
                CreatedAt = DateTime.UtcNow
            };
            _context.FacilityAgentWorkflows.Add(workflow);
            await _context.SaveChangesAsync();
            return StatusCode(201, new { Workflow = workflow });
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

                bool isInquiry = proposalElement.ValueKind != JsonValueKind.Null && 
                                 proposalElement.TryGetProperty("isInquiry", out var inqProp) && 
                                 inqProp.GetBoolean();

                bool isFailed = validationStatus.StartsWith("Failed", StringComparison.OrdinalIgnoreCase) || 
                                validationStatus.StartsWith("Rejected", StringComparison.OrdinalIgnoreCase) ||
                                validationStatus.Contains("Rejected", StringComparison.OrdinalIgnoreCase) ||
                                validationStatus.Contains("Failed", StringComparison.OrdinalIgnoreCase) ||
                                validationStatus.Contains("outside operating hours", StringComparison.OrdinalIgnoreCase);

                // 2. Persist Workflow State into PostgreSQL Database for Auditability & Execution
                var workflow = new FacilityAgentWorkflow
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
                    RequiresApproval = isInquiry ? false : requiresApproval,
                    Status = isInquiry ? "InquiryAnswered" : ((!requiresApproval && !isFailed) ? "AutoApproved" : (isFailed ? "Failed" : "PendingApproval")),
                    CreatedAt = DateTime.UtcNow
                };

                _context.FacilityAgentWorkflows.Add(workflow);

                // 3. If Standard Reservation (Auto-Approved & NOT an Inquiry) -> Execute DB Booking!
                if (!isInquiry && !requiresApproval && !isFailed)
                {
                    await ExecuteWorkflowBookingInternal(workflow);
                    workflow.ActionedAt = DateTime.UtcNow;
                    workflow.ActionedBy = "AI Agent (Auto-Confirmed)";
                }

                await _context.SaveChangesAsync();

                return StatusCode(201, new
                {
                    Message = isInquiry
                        ? "Inquiry Answered by AI Agent."
                        : ((!requiresApproval && !isFailed) 
                            ? "Standard Request Auto-Approved and Booked in Database."
                            : "High-Impact Workflow Paused for Approval."),
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
                var query = _context.FacilityAgentWorkflows.AsQueryable();

                if (!string.IsNullOrWhiteSpace(status))
                {
                    if (status.Equals("pending", StringComparison.OrdinalIgnoreCase))
                    {
                        query = query.Where(w => w.Status == "PendingApproval" || w.Status == "Pending");
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
            var workflow = await _context.FacilityAgentWorkflows.FindAsync(id);
            if (workflow == null) return NotFound("Workflow not found.");
            return Ok(workflow);
        }

        // PUT: /api/workflows/{id}/approve
        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveWorkflow(int id)
        {
            try
            {
                var workflow = await _context.FacilityAgentWorkflows.FindAsync(id);
                if (workflow == null) return NotFound("Workflow not found.");

                if (workflow.AgentType == "LocalFacilityAndParkingAgent"
                    && (!int.TryParse(User.FindFirst("residentId")?.Value, out var residentId)
                        || residentId != workflow.ResidentId))
                    return Forbid();

                if (workflow.Status == "Approved" || workflow.Status == "AutoApproved")
                    return BadRequest("Workflow is already approved.");

                await ExecuteWorkflowBookingInternal(workflow);

                workflow.Status = "Approved";
                workflow.ActionedAt = DateTime.UtcNow;
                workflow.ActionedBy = "Resident / Manager";

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

        // Helper Method to Execute Facility Booking & Visitor Parking Slot Update in PostgreSQL DB
        private async Task ExecuteWorkflowBookingInternal(FacilityAgentWorkflow workflow)
        {
            if (string.IsNullOrWhiteSpace(workflow.ProposalJson) || workflow.ProposalJson == "{}")
                return;

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

            int guests = root.TryGetProperty("guests", out var gProp) ? gProp.GetInt32() : 1;
            int requestedCapacity = guests > 0 ? guests : 1;

            var facility = await _context.Facilities.FindAsync(facilityId);
            if (facility == null || !facility.IsActive)
            {
                string reason = !string.IsNullOrWhiteSpace(facility?.DeactivationReason) ? facility.DeactivationReason : "Facility is currently closed for maintenance.";
                throw new InvalidOperationException($"Booking failed: Facility '{facility?.FacilityName ?? "Requested Facility"}' is inactive or closed. Reason: {reason}");
            }

            if (endTime <= startTime || startTime < facility.OpenTime || endTime > facility.CloseTime)
            {
                throw new InvalidOperationException($"Booking failed: Requested time ({startTime:hh\\:mm} - {endTime:hh\\:mm}) is outside facility operating hours ({facility.OpenTime:hh\\:mm} - {facility.CloseTime:hh\\:mm}).");
            }

            if (bookingDate.Date.Add(startTime) < DateTime.UtcNow.AddMinutes(-5))
            {
                throw new InvalidOperationException($"Booking failed: Cannot book for a past date or time.");
            }

            var overlappingBookings = await _context.FacilityBookings
                .Where(b => b.FacilityId == facilityId &&
                            b.BookingDate.Date == bookingDate.Date &&
                            b.Status != BookingStatus.Rejected &&
                            ((startTime < b.EndTime) && (endTime > b.StartTime)))
                .ToListAsync();

            int alreadyBookedCapacity = overlappingBookings.Sum(b => b.BookedCapacity > 0 ? b.BookedCapacity : 1);
            int remainingCapacity = Math.Max(0, facility.Capacity - alreadyBookedCapacity);

            if (alreadyBookedCapacity + requestedCapacity > facility.Capacity)
            {
                throw new InvalidOperationException($"Booking failed: Exceeds facility capacity. Facility '{facility.FacilityName}' has {remainingCapacity} spots remaining for this time slot (Requested: {requestedCapacity} spots).");
            }

            double durationHours = (endTime - startTime).TotalHours;
            decimal calculatedTotalCost = Math.Round((decimal)durationHours * facility.HourlyCost * requestedCapacity, 2);

            // 1. Create Facility Booking
            var booking = new FacilityBooking
            {
                FacilityId = facilityId,
                ResidentId = workflow.ResidentId,
                BookingDate = bookingDate,
                StartTime = startTime,
                EndTime = endTime,
                BookedCapacity = requestedCapacity,
                TotalCost = calculatedTotalCost,
                Status = BookingStatus.Approved
            };
            _context.FacilityBookings.Add(booking);

            // 2. Allocate Visitor Parking & UPDATE PARKING SLOT STATUS to Unavailable (IsAvailable = false, IsOccupied = true)
            if (visitorVehicles > 0)
            {
                var availableSlots = await _context.ParkingSlots
                    .Where(s => s.SlotType == ParkingSlotType.Visitor && s.IsAvailable)
                    .Take(visitorVehicles)
                    .ToListAsync();

                int slotIndex = 0;
                for (int i = 0; i < visitorVehicles; i++)
                {
                    ParkingSlot? assignedSlot = null;
                    if (slotIndex < availableSlots.Count)
                    {
                        assignedSlot = availableSlots[slotIndex++];
                        assignedSlot.IsAvailable = false;
                        _context.ParkingSlots.Update(assignedSlot);
                    }

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
        }

        // PUT: /api/workflows/{id}/reject
        [HttpPut("{id}/reject")]
        public async Task<IActionResult> RejectWorkflow(int id)
        {
            var workflow = await _context.FacilityAgentWorkflows.FindAsync(id);
            if (workflow == null) return NotFound("Workflow not found.");

            workflow.Status = "Rejected";
            workflow.ActionedAt = DateTime.UtcNow;
            workflow.ActionedBy = "Resident / Manager";

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Workflow rejected successfully.", Workflow = workflow });
        }

        // PUT: /api/workflows/{id}/revise
        [HttpPut("{id}/revise")]
        public async Task<IActionResult> ReviseWorkflow(int id, [FromBody] Dictionary<string, string> body)
        {
            var workflow = await _context.FacilityAgentWorkflows.FindAsync(id);
            if (workflow == null) return NotFound("Workflow not found.");

            workflow.Status = "RequiresRevision";
            workflow.ActionedAt = DateTime.UtcNow;
            workflow.ActionedBy = "Resident / Manager";
            if (body != null && body.ContainsKey("notes"))
            {
                workflow.ManagerNotes = body["notes"];
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Workflow marked for revision.", Workflow = workflow });
        }
    }
}
