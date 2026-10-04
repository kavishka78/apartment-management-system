using System;

namespace ApartmentManagement.Api.DTOs.Notification
{
    public class NotificationDto
    {
        public int Id { get; set; }
        public int ResidentId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}
