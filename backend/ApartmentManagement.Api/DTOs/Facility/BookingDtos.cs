using System.ComponentModel.DataAnnotations;

namespace ApartmentManagement.Api.DTOs
{
    public class BookingResponseDto
    {
        public int Id { get; set; }
        public int FacilityId { get; set; }
        public string FacilityName { get; set; } = string.Empty;
        public int ResidentId { get; set; }
        public DateTime BookingDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class CreateBookingDto
    {
        [Required]
        public int FacilityId { get; set; }

        [Required]
        public int ResidentId { get; set; }

        [Required]
        public DateTime BookingDate { get; set; }

        [Required]
        public TimeSpan StartTime { get; set; }

        [Required]
        public TimeSpan EndTime { get; set; }
    }
}