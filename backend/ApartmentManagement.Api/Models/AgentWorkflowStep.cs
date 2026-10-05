using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApartmentManagement.Api.Models
{
    /// <summary>An auditable, non-sensitive record of one agent or allow-listed tool action.</summary>
    public class AgentWorkflowStep
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int AgentWorkflowId { get; set; }

        [ForeignKey(nameof(AgentWorkflowId))]
        public AgentWorkflow? Workflow { get; set; }

        public int Sequence { get; set; }
        public string AgentRole { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Status { get; set; } = "Completed";
        public string ToolName { get; set; } = string.Empty;
        public string InputSummary { get; set; } = string.Empty;
        public string OutputSummary { get; set; } = string.Empty;
        public string ValidationResult { get; set; } = string.Empty;
        public int DurationMilliseconds { get; set; }
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
