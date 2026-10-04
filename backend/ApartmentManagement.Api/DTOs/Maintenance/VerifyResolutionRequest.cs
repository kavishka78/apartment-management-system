namespace ApartmentManagement.Api.DTOs.Maintenance
{
    public class VerifyResolutionRequest
    {
        public bool IsApproved { get; set; }
        public string? Note { get; set; }
    }
}
