using System.ComponentModel.DataAnnotations;

namespace ApartmentManagement.Api.DTOs
{
    public class FacilityResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public TimeSpan OpenTime { get; set; }
        public TimeSpan CloseTime { get; set; }
        public bool IsActive { get; set; }
        public string? DeactivationReason { get; set; }
    }

    public class CreateFacilityDto
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(100)]
        public string Description { get; set; } = string.Empty;
        
        [Required]
        public int Capacity { get; set; }
        
        [Required]
        public TimeSpan OpenTime { get; set; }
        
        [Required]
        public TimeSpan CloseTime { get; set; }

        public bool IsActive { get; set; } = true;

        [MaxLength(255)]
        public string? DeactivationReason { get; set; }
    }

    public class UpdateFacilityStatusDto
    {
        public bool IsActive { get; set; }
        public string? DeactivationReason { get; set; }
    }
}