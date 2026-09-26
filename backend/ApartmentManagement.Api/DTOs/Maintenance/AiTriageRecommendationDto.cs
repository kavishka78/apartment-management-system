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
    }
}
