using System.ComponentModel.DataAnnotations;

namespace ApartmentManagement.Api.DTOs.Maintenance
{
    public class WorkflowApprovalRequest
    {
        [Required]
        [RegularExpression("^(Approve|Reject|RequestRevision)$")]
        public string Decision { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Note { get; set; }

        // The controller records the authenticated JWT user. This legacy field is ignored.
        [StringLength(100)]
        public string? ApprovedBy { get; set; }
    }
}
