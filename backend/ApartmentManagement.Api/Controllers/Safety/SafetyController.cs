using System;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.DTOs.Safety;
using ApartmentManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApartmentManagement.Api.Controllers.Safety
{
    [ApiController]
    [Authorize(Roles = "ApartmentAdmin,SuperAdmin")]
    [Route("api/v1/safety")]
    public class SafetyController : ControllerBase
    {
        private readonly SafetyValidationClient _safety;
        private readonly AppDbContext _db;

        public SafetyController(SafetyValidationClient safety, AppDbContext db)
        {
            _safety = safety;
            _db = db;
        }

        // Other agents call this before executing a proposed action.
        // The caller's tenant is forced to match the JWT, so a request cannot target another complex.
        [HttpPost("validate")]
        public async Task<ActionResult<SafetyVerdictDto>> Validate([FromBody] ProposedActionDto proposal)
        {
            if (!User.IsInRole("SuperAdmin") && User.FindFirstValue("tenantId") != proposal.TenantId.ToString())
                return Forbid();

            var verdict = await _safety.ValidateAsync(proposal);
            return Ok(verdict);
        }

        // Verdict history for the React approval queue (AiSafetyAuditor page).
        [HttpGet("verdicts")]
        public async Task<ActionResult> GetVerdicts([FromQuery] int tenantId, [FromQuery] string? verdict = null)
        {
            if (!User.IsInRole("SuperAdmin") && User.FindFirstValue("tenantId") != tenantId.ToString())
                return Forbid();

            var query = _db.SafetyVerdictLogs.Where(v => v.TenantId == tenantId);
            if (!string.IsNullOrWhiteSpace(verdict))
                query = query.Where(v => v.Verdict == verdict);

            var rows = await query
                .OrderByDescending(v => v.CreatedAt)
                .Take(200)
                .Select(v => new
                {
                    v.Id,
                    v.WorkflowId,
                    v.ProposedBy,
                    v.ActionType,
                    v.RequesterUserId,
                    v.RequesterRole,
                    v.Verdict,
                    v.ApprovalRequired,
                    v.Reason,
                    v.ChecksJson,
                    v.TraceId,
                    v.HumanDecision,
                    v.DecidedBy,
                    v.DecidedAt,
                    v.CreatedAt,
                })
                .ToListAsync();

            return Ok(rows);
        }

        // A manager decides a needs_human verdict. Only one decision is allowed per row.
        [HttpPost("verdicts/{id:int}/decision")]
        public async Task<ActionResult> Decide(int id, [FromBody] HumanDecisionDto body)
        {
            var log = await _db.SafetyVerdictLogs.FindAsync(id);
            if (log == null) return NotFound();

            if (!User.IsInRole("SuperAdmin") && User.FindFirstValue("tenantId") != log.TenantId.ToString())
                return Forbid();
            if (log.Verdict != "needs_human")
                return BadRequest("Only needs_human verdicts can be decided.");
            if (log.HumanDecision != null)
                return Conflict("This verdict has already been decided.");

            log.HumanDecision = body.Decision;
            log.DecidedBy = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue(ClaimTypes.Name) ?? "unknown";
            log.DecidedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { log.Id, log.HumanDecision, log.DecidedBy, log.DecidedAt });
        }
    }
}
