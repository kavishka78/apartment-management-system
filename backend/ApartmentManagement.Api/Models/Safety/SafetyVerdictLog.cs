using System;
using System.ComponentModel.DataAnnotations;

namespace ApartmentManagement.Api.Models.Safety
{
    // One row per proposed action checked by the Validation & Safety Agent.
    // Stores the verdict and the individual checks as JSON so the audit trail is complete.
    public class SafetyVerdictLog
    {
        public int Id { get; set; }

        public int TenantId { get; set; }

        [Required, MaxLength(100)] public string WorkflowId { get; set; } = string.Empty;
        [MaxLength(60)] public string ProposedBy { get; set; } = string.Empty;
        [MaxLength(60)] public string ActionType { get; set; } = string.Empty;
        public int RequesterUserId { get; set; }
        [MaxLength(40)] public string RequesterRole { get; set; } = string.Empty;

        [Required, MaxLength(20)] public string Verdict { get; set; } = string.Empty; // approve | needs_human | block
        public bool ApprovalRequired { get; set; }
        [MaxLength(1000)] public string Reason { get; set; } = string.Empty;
        public string ChecksJson { get; set; } = "[]";
        [MaxLength(60)] public string TraceId { get; set; } = string.Empty;

        // Set by a manager when a needs_human verdict is decided.
        [MaxLength(20)] public string? HumanDecision { get; set; } // approved | rejected
        [MaxLength(150)] public string? DecidedBy { get; set; }
        public DateTimeOffset? DecidedAt { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
