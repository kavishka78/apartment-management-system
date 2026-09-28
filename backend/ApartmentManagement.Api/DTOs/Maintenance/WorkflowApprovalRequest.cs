using System.ComponentModel.DataAnnotations;

namespace ApartmentManagement.Api.DTOs.Maintenance
{
    public class WorkflowApprovalRequest
    {
        [Required]
        [RegularExpression("Approve|Reject|RequestRevision")]
        public string Decision { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Note { get; set; }

        // This is an audit label until application-wide JWT role enforcement is added.
        [Required, StringLength(100)]
        public string ApprovedBy { get; set; } = string.Empty;
    }
}
