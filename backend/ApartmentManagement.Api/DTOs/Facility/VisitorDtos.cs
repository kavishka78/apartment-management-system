using System.ComponentModel.DataAnnotations;

namespace ApartmentManagement.Api.DTOs
{
    public class CreateVisitorPassDto
    {
        [Required]
        public int ResidentId { get; set; }

        [Required, MaxLength(100)]
        public string VisitorName { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^0\d{9}$", ErrorMessage = "Phone number must be a valid 10-digit number starting with 0 (e.g., 0771234567).")]
        public string PhoneNumber { get; set; } = string.Empty;

        [RegularExpression(@"^(?:[A-Za-z]{2}\s+)?(?:[A-Za-z]{1,3}|\d{1,3})[\s\-]?\d{4}$", ErrorMessage = "Invalid Sri Lankan vehicle number format (e.g. CAD-1234, WP BBD-5678, 300-1234).")]
        public string? VehicleNumber { get; set; }

        [Required]
        public DateTime ExpectedArrival { get; set; }
    }

    public class VisitorPassResponseDto
    {
        public int Id { get; set; }
        public string VisitorName { get; set; } = string.Empty;
        public string? VehicleNumber { get; set; }
        public DateTime ExpectedArrival { get; set; }
        public string AccessCode { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? AssignedParkingSlot { get; set; }
        public int? AssignedParkingSlotId { get; set; }
        public DateTime? CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
    }

    public class UpdateVisitorPassDto
    {
        public string? VisitorName { get; set; }
        public string? VehicleNumber { get; set; }
        public DateTime? CheckInTime { get; set; }
        public string? Status { get; set; }
        public int? AssignedParkingSlotId { get; set; }
        public bool AutoAssignParking { get; set; } = false;
    }
}