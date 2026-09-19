using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApartmentManagement.Api.Models
{
    public class ParkingSlot
    {
        [Key]
        public int SlotId { get; set; }

        [Required]
        [MaxLength(20)]
        public string SlotNumber { get; set; } = string.Empty;

        public bool IsAvailable { get; set; } = true;

        [Required]
        [Column(TypeName = "varchar(20)")]
        public ParkingSlotType SlotType { get; set; } = ParkingSlotType.Visitor;

        public int? ResidentId { get; set; }

        public int? CurrentVisitorPassId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }

    public enum ParkingSlotType
    {
        Resident,
        Visitor,
        Handicapped,
        Maintenance
    }
}
