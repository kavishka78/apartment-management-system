namespace ApartmentManagement.Api.DTOs.Maintenance
{
    public class ResolveMaintenanceRequest
    {
        public decimal RepairCost { get; set; }
        public string Note { get; set; } = string.Empty;
    }
}
