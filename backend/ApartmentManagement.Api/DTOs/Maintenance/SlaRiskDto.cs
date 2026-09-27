using System;

namespace ApartmentManagement.Api.DTOs.Maintenance
{
    public class SlaRiskDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Technician { get; set; } = string.Empty;
        public DateTimeOffset? SlaDueDate { get; set; }
        public string Risk { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
    }
}
