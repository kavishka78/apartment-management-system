using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ApartmentManagement.Api.DTOs.Safety
{
    // Shapes must match the Python safety agent's models.py (camelCase on the wire).

    public class ProposedActionDto
    {
        [JsonPropertyName("workflowId")] [Required, MaxLength(100)] public string WorkflowId { get; set; } = string.Empty;
        [JsonPropertyName("tenantId")] public int TenantId { get; set; }
        [JsonPropertyName("proposedBy")] [Required, MaxLength(60)] public string ProposedBy { get; set; } = string.Empty;
        [JsonPropertyName("requester")] [Required] public RequesterDto Requester { get; set; } = new();
        [JsonPropertyName("action")] [Required] public ActionTargetDto Action { get; set; } = new();
        [JsonPropertyName("freeText")] [MaxLength(4000)] public string? FreeText { get; set; }
    }

    public class RequesterDto
    {
        [JsonPropertyName("userId")] public int UserId { get; set; }
        [JsonPropertyName("role")] [Required] public string Role { get; set; } = string.Empty;
        [JsonPropertyName("tenantId")] public int TenantId { get; set; }
        [JsonPropertyName("residentId")] public int? ResidentId { get; set; }
    }

    public class ActionTargetDto
    {
        [JsonPropertyName("type")] [Required] public string Type { get; set; } = string.Empty;
        [JsonPropertyName("targetTenantId")] public int TargetTenantId { get; set; }
        [JsonPropertyName("targetResourceId")] public string TargetResourceId { get; set; } = string.Empty;
        [JsonPropertyName("amountLkr")] public decimal? AmountLkr { get; set; }
    }

    public class SafetyVerdictDto
    {
        [JsonPropertyName("verdict")] public string Verdict { get; set; } = string.Empty;
        [JsonPropertyName("approvalRequired")] public bool ApprovalRequired { get; set; }
        [JsonPropertyName("reason")] public string Reason { get; set; } = string.Empty;
        [JsonPropertyName("checks")] public List<SafetyCheckDto> Checks { get; set; } = new();
        [JsonPropertyName("traceId")] public string TraceId { get; set; } = string.Empty;
        public string WorkflowId { get; set; } = string.Empty;
    }

    public class SafetyCheckDto
    {
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("passed")] public bool Passed { get; set; }
        [JsonPropertyName("detail")] public string Detail { get; set; } = string.Empty;
    }

    public class HumanDecisionDto
    {
        [Required, RegularExpression("approved|rejected")] public string Decision { get; set; } = string.Empty;
    }
}
