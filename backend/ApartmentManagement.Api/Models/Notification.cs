using System;

namespace ApartmentManagement.Api.Models
{
    public class Notification
    {
        public int Id { get; set; }
        public int ResidentId { get; set; } // Targets a specific resident
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; } = false;
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
