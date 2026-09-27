using System;

namespace ApartmentManagement.Api.Models
{
    public class Technician
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ContactInformation { get; set; } = string.Empty;
        public string Skills { get; set; } = string.Empty; // e.g. "Plumbing, Electrical"
        public string Status { get; set; } = "Available"; // Available, Busy, Offline
        public string? PhotoBase64 { get; set; } // Base64 encoded profile photo
        public string? NicNumber { get; set; }
        public string? AccessPassCode { get; set; }
        public string? WorkingHours { get; set; }
        public bool IsAccessGranted { get; set; } = true;
    }
}
