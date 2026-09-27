using System;
using System.Collections.Generic;

namespace ApartmentManagement.Api.DTOs.Maintenance
{
    public class MaintenanceDto
    {
        public int Id { get; set; }
        public int ResidentId { get; set; }
        
        public MaintenanceCategoryDto? Category { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        
        public TechnicianDto? Technician { get; set; }

        public decimal RepairCost { get; set; }
        public DateTimeOffset? SlaDueDate { get; set; }
        public string SlaStatus { get; set; } = string.Empty;
        public bool ResidentVerified { get; set; }
        
        public string? PhotoPath { get; set; }

        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
        
        public List<MaintenanceHistoryDto> History { get; set; } = new List<MaintenanceHistoryDto>();
    }

    public class MaintenanceCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class TechnicianDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Skills { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class MaintenanceHistoryDto
    {
        public int Id { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
        public string ChangedBy { get; set; } = string.Empty;
        public DateTimeOffset CreatedAt { get; set; }
    }
}
