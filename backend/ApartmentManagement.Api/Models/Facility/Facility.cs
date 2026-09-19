using System.ComponentModel.DataAnnotations;

namespace ApartmentManagement.Api.Models
{
    public class Facility {

        [Key]
        public int FacilityId {get; set;}

        [Required]
        [MaxLength(100)]
        public string FacilityName {get;set;} = string.Empty;

        [Required]
        [MaxLength(100)]
        public string FacilityDescription {get;set;} = string.Empty;

        [Required]
        public int Capacity {get;set;}

        [Required]
        public TimeSpan OpenTime {get;set;}

        [Required]
        public TimeSpan CloseTime {get;set;}

        public bool IsActive {get;set;} = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<FacilityBooking> Bookings { get; set; } = new List<FacilityBooking>();

    }
}
