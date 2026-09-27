using System;
using System.Collections.Generic;

namespace ApartmentManagement.Api.Models
{
    public class Maintenance
    {
        public int Id { get; set; }
        public int ResidentId { get; set; }
        
        public int CategoryId { get; set; }
        public MaintenanceCategory? Category { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        
        public string Priority { get; set; } = "Low"; // Low, Medium, High, Critical
        public string Status { get; set; } = "Pending"; // Pending, Assigned, In Progress, Resolved, Closed
        
        public int? TechnicianId { get; set; }
        public Technician? Technician { get; set; }

        public decimal RepairCost { get; set; } = 0;
        public DateTimeOffset? SlaDueDate { get; set; }
        public string SlaStatus { get; set; } = "Normal"; // Normal, At Risk, Overdue
        public bool ResidentVerified { get; set; } = false;
        
        public string? PhotoPath { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
        
        public List<MaintenanceHistory> History { get; set; } = new List<MaintenanceHistory>();
    }
}
