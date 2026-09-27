using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApartmentManagement.Api.Models
{
    public class AgentWorkflow
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int MaintenanceId { get; set; }
        
        [ForeignKey("MaintenanceId")]
        public Maintenance Maintenance { get; set; }

        public string Objective { get; set; }
        public string? Plan { get; set; } // JSON array or string
        public string? CurrentStep { get; set; }
        public string? CompletedSteps { get; set; } // JSON array or string
        public string? ToolResults { get; set; } // JSON string
        public string? ValidationResults { get; set; }
        public string? Errors { get; set; }
        
        public string ApprovalStatus { get; set; } = "Pending"; // Pending, Approved, Rejected, Revised
        public string? ApprovalUser { get; set; }
        public DateTimeOffset? ApprovalTime { get; set; }
        
        public string? FinalOutcome { get; set; } // JSON string representing the recommendation

        // Store auditable operational state only: never persist model chain-of-thought,
        // credentials, or raw prompts that could contain sensitive data.
        public string Status { get; set; } = "Running"; // Running, PendingApproval, Approved, Rejected, RevisionRequested, SafeFailure
        public string? ApprovalNote { get; set; } = string.Empty;
        public bool IsSafeFailure { get; set; }

        public List<AgentWorkflowStep> Steps { get; set; } = new();

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}



