using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApartmentManagement.Api.Models
{
    public class VisitorPass{

        [Key]
        public int PassId {get;set;}

        [Required]
        public int ResidentId {get;set;}

        [Required]
        [MaxLength(100)]
        public string VisitorName {get;set;} = string.Empty;

        [Required]
        [MaxLength(15)]
        public string PhoneNumber {get;set;} = string.Empty;

        [MaxLength(20)]
        public string? VehicleNumber {get;set;}

        [Required]
        public DateTime ExpectedArrival {get;set;}

        [Required]
        [MaxLength(50)]
        public string AccessCode {get;set;} = string.Empty;

        [Required]
        [Column(TypeName = "varchar(20)")]
        public PassStatus Status {get;set;} = PassStatus.Pending;

        public DateTime CreatedAt {get;set;}= DateTime.UtcNow;
        public DateTime? UpdatedAt {get;set;} 
        public DateTime? CheckInTime {get;set;}
        public DateTime? CheckOutTime {get;set;}

        public ParkingSlot? AssignedParkingSlot { get; set; }
    }

    public enum PassStatus
    {
        Pending,
        Active,
        CheckedIn,
        CheckedOut,
        Expired,
        Cancelled
    }
}
