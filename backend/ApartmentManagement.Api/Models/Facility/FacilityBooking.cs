using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApartmentManagement.Api.Models
{

    public class FacilityBooking{

        [Key]
        public int BookingId {get;set;}

        [Required]
        public int FacilityId { get; set; }

        [ForeignKey("FacilityId")]
        public Facility? Facility { get; set; }

        [Required]
        public int ResidentId {get;set;}

        [Required]
        public DateTime BookingDate {get;set;}

        [Required]
        public TimeSpan StartTime {get;set;}

        [Required]
        public DTimeSpan EndTime {get;set;}

        [Required]
        [Column(TypeName = "varchar(20)")]
        public BookingStatus Status {get;set;} = BookingStatus.Pending;


        public DateTime CreatedAt {get;set;} = DateTime.UtcNow;
        public DateTime? UpdatedAt {get;set;} 

    }

    public enum BookingStatus{
        Pending,
        Rejected,
        Approved,
        Completed
    }
}