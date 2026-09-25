using System.ComponentModel.DataAnnotations;

namespace ApartmentManagement.Api.DTOs
{
    public class CreateVisitorPassDto
    {
        [Required]
        public int ResidentId { get; set; }

        [Required, MaxLength(100)]
        public string VisitorName { get; set; } = string.Empty;

        [Required, MaxLength(15)]
        public string PhoneNumber { get; set; } = string.Empty;

        [MaxLength(20)]
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