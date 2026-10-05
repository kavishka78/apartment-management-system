using System;
using System.ComponentModel.DataAnnotations;

namespace ApartmentManagement.Api.Models
{
    public class ResidentOtp
    {
        public int Id { get; set; }
        [Required, MaxLength(150)]
        public string Email { get; set; } = string.Empty;
        [Required, MaxLength(10)]
        public string OtpCode { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
