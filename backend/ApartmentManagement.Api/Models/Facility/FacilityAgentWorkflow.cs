using System;
using System.ComponentModel.DataAnnotations;

namespace ApartmentManagement.Api.Models
{
    public class FacilityAgentWorkflow
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string WorkflowId { get; set; } = string.Empty;

        public int ResidentId { get; set; } = 1;

        public string ResidentName { get; set; } = "Resident";

        [Required]
        public string Objective { get; set; } = string.Empty;

        public string AgentType { get; set; } = "FacilityAndParkingAgent";

        // JSON serialized blobs for full auditable observability
        public string PlanJson { get; set; } = "[]";
        public string ExtractedDataJson { get; set; } = "{}";
        public string ToolResultsJson { get; set; } = "{}";
        public string ProposalJson { get; set; } = "{}";

        public string ValidationStatus { get; set; } = "Pending";

        public bool RequiresApproval { get; set; } = true;

        // Workflow Status: PendingApproval, Approved, Rejected, Revised
        public string Status { get; set; } = "PendingApproval";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ActionedAt { get; set; }

        public string? ActionedBy { get; set; }

        public string? ManagerNotes { get; set; }
    }
}
