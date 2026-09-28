namespace ApartmentManagement.Api.DTOs.Maintenance
{
    public class CreateComplaintRequest
    {
        public int ResidentId { get; set; }
        public int CategoryId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = "Low"; // Low, Medium, High, Critical
    }
}
