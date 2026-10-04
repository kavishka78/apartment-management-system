namespace ApartmentManagement.Api.DTOs.Maintenance
{
    public class AiTriageRecommendationDto
    {
        public string Category { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public int? RecommendedTechnicianId { get; set; }
        public string TechnicianReason { get; set; } = string.Empty;
        public string SlaRisk { get; set; } = string.Empty;
        public string SlaReason { get; set; } = string.Empty;

        // Workflow Audit Fields
        public List<string> Plan { get; set; } = new List<string>();
        public List<string> CompletedSteps { get; set; } = new List<string>();
        public string ToolResults { get; set; } = string.Empty;
        public string ValidationResults { get; set; } = string.Empty;
        public string? Errors { get; set; }
        public List<AgentStepDto> AgentSteps { get; set; } = new List<AgentStepDto>();
        public int? WorkflowId { get; set; }
    }

    public class AgentStepDto
    {
        public int Sequence { get; set; }
        public string AgentRole { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string ToolName { get; set; } = string.Empty;
        public string InputSummary { get; set; } = string.Empty;
        public string OutputSummary { get; set; } = string.Empty;
        public string ValidationResult { get; set; } = string.Empty;
        public int DurationMilliseconds { get; set; }
    }
}
