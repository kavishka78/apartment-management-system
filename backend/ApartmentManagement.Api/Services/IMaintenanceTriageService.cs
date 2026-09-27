using System.Collections.Generic;
using System.Threading.Tasks;
using ApartmentManagement.Api.DTOs.Maintenance;
using ApartmentManagement.Api.Models;

namespace ApartmentManagement.Api.Services
{
    public interface IMaintenanceTriageService
    {
        Task<AiTriageRecommendationDto> TriageComplaintAsync(
            string title, 
            string description, 
            List<Technician> technicians, 
            Dictionary<int, int> technicianWorkloads,
            string currentSlaDeadlineInfo = "");
    }
}
