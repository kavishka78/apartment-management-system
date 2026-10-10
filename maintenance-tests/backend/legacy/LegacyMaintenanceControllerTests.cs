using ApartmentManagement.Api.Controllers.Maintenance;
using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Models;
using ApartmentManagement.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace ApartmentManagement.Tests.Controllers.Maintenance
{
    public class MaintenanceControllerTests
    {
        private readonly AppDbContext _context;
        private readonly Mock<IMaintenanceTriageService> _mockAiService;
        private readonly MaintenanceController _controller;

        public MaintenanceControllerTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: System.Guid.NewGuid().ToString())
                .Options;
            
            _context = new AppDbContext(options);
            _mockAiService = new Mock<IMaintenanceTriageService>();
            
            _controller = new MaintenanceController(_context, _mockAiService.Object);
        }

        [Fact]
        public async Task AssignTechnician_ReturnsNotFound_WhenTicketDoesNotExist()
        {
            // Act
            var request = new ApartmentManagement.Api.DTOs.Maintenance.AssignTechnicianRequest { TechnicianId = 1 };
            var result = await _controller.AssignTechnician(999, request);

            // Assert
            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task AssignTechnician_ApprovesWorkflowAndAssigns_WhenValid()
        {
            // Arrange
            var ticket = new ApartmentManagement.Api.Models.Maintenance
            {
                Id = 1,
                Title = "Test",
                Description = "Test desc",
                Status = "Pending",
                History = new List<MaintenanceHistory>()
            };
            var tech = new Technician { Id = 1, Name = "John", Status = "Available" };
            var workflow = new AgentWorkflow { MaintenanceId = 1, ApprovalStatus = "Pending" };
            
            _context.Maintenances.Add(ticket);
            _context.Technicians.Add(tech);
            _context.AgentWorkflows.Add(workflow);
            await _context.SaveChangesAsync();

            var request = new ApartmentManagement.Api.DTOs.Maintenance.AssignTechnicianRequest { TechnicianId = 1 };

            // Act
            var result = await _controller.AssignTechnician(1, request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            
            var updatedTicket = await _context.Maintenances.FindAsync(1);
            Assert.Equal("Assigned", updatedTicket.Status);
            Assert.Equal(1, updatedTicket.TechnicianId);

            var updatedWorkflow = await _context.AgentWorkflows.FirstOrDefaultAsync();
            Assert.Equal("Approved", updatedWorkflow.ApprovalStatus);
        }
    }
}
