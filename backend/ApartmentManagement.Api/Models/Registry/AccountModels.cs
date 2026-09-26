using System.ComponentModel.DataAnnotations;

namespace ApartmentManagement.Api.Models
{
    public class Complex
    {
        public int Id { get; set; }
        [Required, MaxLength(150)] public string Name { get; set; } = string.Empty;
        [MaxLength(30)] public string Code { get; set; } = string.Empty;
        [MaxLength(250)] public string Address { get; set; } = string.Empty;
        [MaxLength(150)] public string ContactEmail { get; set; } = string.Empty;
        [MaxLength(40)] public string ContactPhone { get; set; } = string.Empty;
        [MaxLength(60)] public string SubscriptionPlan { get; set; } = string.Empty;
        public int TotalUnits { get; set; }
        public int OccupiedUnits { get; set; }
        [MaxLength(30)] public string Status { get; set; } = "Active";
        public string CreatedAt { get; set; } = string.Empty;
        public string SubscriptionStart { get; set; } = string.Empty;
        public string SubscriptionEnd { get; set; } = string.Empty;
        public List<string> EnabledModules { get; set; } = new();
    }

    public class UserAccount
    {
        public int Id { get; set; }
        [Required, MaxLength(150)] public string Name { get; set; } = string.Empty;
        [Required, MaxLength(150)] public string Email { get; set; } = string.Empty;
        [MaxLength(40)] public string Phone { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        [MaxLength(100)] public string? GoogleSubject { get; set; }
        [MaxLength(30)] public string Role { get; set; } = "ApartmentAdmin";
        public int? TenantId { get; set; }
        [MaxLength(30)] public string Status { get; set; } = "Active";
        public string AssignedAt { get; set; } = string.Empty;
    }

    public class SubscriptionHistory
    {
        public int Id { get; set; }
        public int ComplexId { get; set; }
        [MaxLength(150)] public string ComplexName { get; set; } = string.Empty;
        [MaxLength(40)] public string Action { get; set; } = string.Empty;
        [MaxLength(250)] public string Detail { get; set; } = string.Empty;
        [MaxLength(150)] public string By { get; set; } = string.Empty;
        public DateTime At { get; set; } = DateTime.UtcNow;
    }
}
