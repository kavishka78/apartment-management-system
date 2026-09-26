using System;
using System.Text.Json.Serialization;

namespace ApartmentManagement.Api.Models
{
    public class MaintenanceHistory
    {
        public int Id { get; set; }
        
        public int MaintenanceId { get; set; }
        [JsonIgnore]
        public Maintenance? Maintenance { get; set; }

        public string Status { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
        public string ChangedBy { get; set; } = string.Empty; // e.g. "Resident", "Manager", "System"

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
