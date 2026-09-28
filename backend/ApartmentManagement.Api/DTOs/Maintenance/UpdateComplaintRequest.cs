namespace ApartmentManagement.Api.DTOs.Maintenance
{
    public class UpdateComplaintRequest
    {
        public int CategoryId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
    }
}
