using System.ComponentModel.DataAnnotations;

namespace ApartmentManagement.Api.Models
{
    // TenantId identifies the apartment complex that owns the record.

    public class Unit
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        [Required, MaxLength(30)] public string UnitNumber { get; set; } = string.Empty;
        public int FloorNumber { get; set; }
        [MaxLength(100)] public string BlockName { get; set; } = string.Empty;
        public int NumberOfBedrooms { get; set; }
        public int NumberOfBathrooms { get; set; }
        public int SquareFeet { get; set; }
        public decimal MonthlyRent { get; set; }
        [MaxLength(30)] public string Status { get; set; } = "Available";
        [MaxLength(150)] public string? CurrentResidentName { get; set; }
        [MaxLength(40)] public string? CurrentResidentPhone { get; set; }
        [MaxLength(40)] public string? ParkingSlot { get; set; }
    }

    public class Resident
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        [Required, MaxLength(150)] public string FullName { get; set; } = string.Empty;
        [MaxLength(150)] public string Email { get; set; } = string.Empty;
        [MaxLength(40)] public string PhoneNumber { get; set; } = string.Empty;
        [MaxLength(40)] public string NationalId { get; set; } = string.Empty;
        public int? UnitId { get; set; }
        [MaxLength(30)] public string? UnitNumber { get; set; }
        [MaxLength(30)] public string Role { get; set; } = "Resident";
        [MaxLength(30)] public string Status { get; set; } = "Active";
        public decimal MonthlyIncome { get; set; }
        [MaxLength(250)] public string? EmergencyContact { get; set; }
        public string? MoveInDate { get; set; }
        public int VehiclesCount { get; set; }
        public int StaffCount { get; set; }
        public List<HouseholdMember> HouseholdMembers { get; set; } = new();
    }

    public class HouseholdMember
    {
        public int Id { get; set; }
        public int ResidentId { get; set; }
        [MaxLength(150)] public string Name { get; set; } = string.Empty;
        [MaxLength(60)] public string Relation { get; set; } = string.Empty;
        [MaxLength(20)] public string Age { get; set; } = string.Empty;
    }

    public class Vehicle
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public int? ResidentId { get; set; }
        [MaxLength(150)] public string ResidentName { get; set; } = string.Empty;
        [MaxLength(30)] public string? UnitNumber { get; set; }
        [Required, MaxLength(30)] public string PlateNumber { get; set; } = string.Empty;
        [MaxLength(30)] public string VehicleType { get; set; } = "Car";
        [MaxLength(150)] public string MakeModel { get; set; } = string.Empty;
        [MaxLength(40)] public string? ParkingSlot { get; set; }
        public string RegisteredAt { get; set; } = string.Empty;
        [MaxLength(30)] public string Status { get; set; } = "Approved";
    }

    public class DomesticStaff
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public int? ResidentId { get; set; }
        [MaxLength(150)] public string ResidentName { get; set; } = string.Empty;
        [MaxLength(30)] public string? UnitNumber { get; set; }
        [Required, MaxLength(150)] public string FullName { get; set; } = string.Empty;
        [MaxLength(60)] public string StaffType { get; set; } = string.Empty;
        [MaxLength(40)] public string NicNumber { get; set; } = string.Empty;
        [MaxLength(40)] public string ContactPhone { get; set; } = string.Empty;
        [MaxLength(60)] public string AccessPassCode { get; set; } = string.Empty;
        [MaxLength(100)] public string WorkingHours { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
    }
}
