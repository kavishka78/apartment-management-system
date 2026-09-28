namespace ApartmentManagement.Api.DTOs.Maintenance
{
    public class AddCommentRequest
    {
        public string Note { get; set; } = string.Empty;
        public string Role { get; set; } = "Resident";
    }
}
