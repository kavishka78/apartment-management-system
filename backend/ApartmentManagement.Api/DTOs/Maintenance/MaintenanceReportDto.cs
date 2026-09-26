namespace ApartmentManagement.Api.DTOs.Maintenance
{
    public class MaintenanceReportDto
    {
        public int Total { get; set; }
        public int Pending { get; set; }
        public int Assigned { get; set; }
        public int InProgress { get; set; }
        public int Resolved { get; set; }
        public int Closed { get; set; }
        public int SlaRiskCount { get; set; }
        public decimal TotalRepairCost { get; set; }
    }
}
