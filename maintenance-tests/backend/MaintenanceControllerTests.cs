using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using ApartmentManagement.Api.Controllers.Maintenance;
using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.DTOs.Maintenance;
using ApartmentManagement.Api.DTOs.Safety;
using ApartmentManagement.Api.Models;
using ApartmentManagement.Api.Models.Safety;
using ApartmentManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MaintenanceTicket = ApartmentManagement.Api.Models.Maintenance;

namespace ApartmentManagement.Maintenance.Tests;

public sealed class MaintenanceControllerTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly MaintenanceController _controller;
    private readonly StaticSafetyHandler _safetyHandler = new();
    private readonly ServiceProvider _serviceProvider = new ServiceCollection().BuildServiceProvider();

    public MaintenanceControllerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"maintenance-tests-{Guid.NewGuid()}")
            .Options;
        _context = new AppDbContext(options);

        var safetyClient = new SafetyValidationClient(
            new HttpClient(_safetyHandler) { BaseAddress = new Uri("http://safety.test") },
            _context,
            new ConfigurationBuilder().Build());

        _controller = new MaintenanceController(
            _context,
            new UnusedTriageService(),
            new NoOpNotificationService(),
            safetyClient);
        SetUser("ApartmentAdmin", new Claim("tenantId", "7"));
    }

    [Fact]
    public async Task GetMaintenances_ResidentSeesOnlyTheirOwnTickets()
    {
        await AddMaintenanceAsync(id: 1, residentId: 21, status: "Pending");
        await AddMaintenanceAsync(id: 2, residentId: 22, status: "Assigned");
        SetUser("Resident", new Claim("residentId", "21"));

        var result = await _controller.GetMaintenances();

        var response = Assert.IsType<OkObjectResult>(result.Result);
        var tickets = Assert.IsAssignableFrom<IEnumerable<MaintenanceDto>>(response.Value);
        Assert.Equal(new[] { 1 }, tickets.Select(ticket => ticket.Id));
    }

    [Fact]
    public async Task GetMaintenance_ResidentCannotReadAnotherResidentsTicket()
    {
        await AddMaintenanceAsync(id: 3, residentId: 22, status: "Assigned");
        SetUser("Resident", new Claim("residentId", "21"));

        var result = await _controller.GetMaintenance(3);

        var response = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status403Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task StartWork_AssignedTechnicianCanStartTheirOwnTicket()
    {
        var ticket = await AddMaintenanceAsync(
            id: 4,
            residentId: 21,
            technicianId: 31,
            technicianEmail: "tech@example.com",
            status: "Assigned");
        SetUser("Technician", new Claim(ClaimTypes.Email, "tech@example.com"));

        var result = await _controller.StartWork(ticket.Id);

        Assert.IsType<OkObjectResult>(result.Result);
        var savedTicket = await _context.Maintenances.FindAsync(ticket.Id);
        Assert.Equal("In Progress", savedTicket!.Status);
        Assert.Contains(savedTicket.History, history => history.Status == "Work Started");
    }

    [Fact]
    public async Task StartWork_TechnicianCannotModifyAnotherTechniciansTicket()
    {
        var ticket = await AddMaintenanceAsync(
            id: 5,
            residentId: 21,
            technicianId: 31,
            technicianEmail: "assigned@example.com",
            status: "Assigned");
        SetUser("Technician", new Claim(ClaimTypes.Email, "other@example.com"));

        var result = await _controller.StartWork(ticket.Id);

        var response = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status403Forbidden, response.StatusCode);
        Assert.Equal("Assigned", (await _context.Maintenances.FindAsync(ticket.Id))!.Status);
    }

    [Fact]
    public async Task ResolveMaintenance_RecordsResolutionCostHistoryAndResidentNotification()
    {
        var ticket = await AddMaintenanceAsync(
            id: 6,
            residentId: 21,
            technicianId: 31,
            technicianEmail: "tech@example.com",
            status: "In Progress");
        SetUser("Technician", new Claim(ClaimTypes.Email, "tech@example.com"));

        var result = await _controller.ResolveMaintenance(
            ticket.Id,
            new ResolveMaintenanceRequest { RepairCost = 3500m, Note = "Replaced the faulty component." });

        Assert.IsType<OkObjectResult>(result.Result);
        var savedTicket = await _context.Maintenances.FindAsync(ticket.Id);
        Assert.Equal("Resolved", savedTicket!.Status);
        Assert.Equal(3500m, savedTicket.RepairCost);
        Assert.Contains(savedTicket.History, history => history.Status == "Resolved");
        Assert.Contains(await _context.Invoices.ToListAsync(), invoice => invoice.TotalAmount == 3500m);
        Assert.Contains(await _context.Notifications.ToListAsync(), notification =>
            notification.ResidentId == 21 && notification.Title == "Maintenance Resolved");
    }

    [Fact]
    public async Task AssignTechnician_WaitsForSafetyApprovalThenAssignsAfterHumanApproval()
    {
        var ticket = await AddMaintenanceAsync(id: 7, residentId: 21, tenantId: 7, status: "Pending");
        await AddTechnicianAsync(41, "new-tech@example.com");
        var workflow = new AgentWorkflow
        {
            MaintenanceId = ticket.Id,
            Objective = "Triage maintenance complaint",
            ApprovalStatus = "Pending",
            Status = "PendingApproval",
        };
        _context.AgentWorkflows.Add(workflow);
        await _context.SaveChangesAsync();
        _safetyHandler.Verdict = "needs_human";
        _safetyHandler.ApprovalRequired = true;

        var firstAttempt = await _controller.AssignTechnician(
            ticket.Id,
            new AssignTechnicianRequest { TechnicianId = 41 });

        var pendingResponse = Assert.IsType<ObjectResult>(firstAttempt.Result);
        Assert.Equal(StatusCodes.Status409Conflict, pendingResponse.StatusCode);
        Assert.Equal("Pending", (await _context.Maintenances.FindAsync(ticket.Id))!.Status);

        var verdict = await _context.SafetyVerdictLogs.SingleAsync();
        verdict.HumanDecision = "approved";
        verdict.DecidedBy = "Manager";
        verdict.DecidedAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync();

        var approvedAttempt = await _controller.AssignTechnician(
            ticket.Id,
            new AssignTechnicianRequest { TechnicianId = 41 });

        Assert.IsType<OkObjectResult>(approvedAttempt.Result);
        var assignedTicket = await _context.Maintenances.FindAsync(ticket.Id);
        Assert.Equal("Assigned", assignedTicket!.Status);
        Assert.Equal(41, assignedTicket.TechnicianId);
        Assert.Equal("Overridden", workflow.ApprovalStatus);
        Assert.Equal("Manually Assigned", workflow.Status);
    }

    [Fact]
    public void ControllerRequiresAuthenticationAndRestrictsTechnicianActionsByRole()
    {
        var controllerAuthorization = typeof(MaintenanceController)
            .GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
            .Cast<AuthorizeAttribute>()
            .Single();
        var startAuthorization = typeof(MaintenanceController)
            .GetMethod(nameof(MaintenanceController.StartWork))!
            .GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
            .Cast<AuthorizeAttribute>()
            .Single();

        Assert.Null(controllerAuthorization.Roles);
        Assert.Equal("Technician,ApartmentAdmin,SuperAdmin", startAuthorization.Roles);
    }

    private async Task<MaintenanceTicket> AddMaintenanceAsync(
        int id,
        int residentId,
        string status,
        int tenantId = 7,
        int? technicianId = null,
        string technicianEmail = "tech@example.com")
    {
        var category = await _context.MaintenanceCategories.FindAsync(1);
        if (category is null)
        {
            category = new MaintenanceCategory { Id = 1, Name = "Plumbing" };
            _context.MaintenanceCategories.Add(category);
        }

        var resident = await _context.Residents.FindAsync(residentId);
        if (resident is null)
        {
            resident = new Resident
            {
                Id = residentId,
                TenantId = tenantId,
                FullName = $"Resident {residentId}",
                Email = $"resident{residentId}@example.com",
                UnitNumber = "A-101",
            };
            _context.Residents.Add(resident);
        }

        Technician? technician = null;
        if (technicianId.HasValue)
        {
            technician = await _context.Technicians.FindAsync(technicianId.Value);
            if (technician is null)
            {
                technician = new Technician
                {
                    Id = technicianId.Value,
                    Name = $"Technician {technicianId.Value}",
                    Email = technicianEmail,
                    ContactInformation = technicianEmail,
                    Skills = "Plumbing",
                    Status = "Available",
                };
                _context.Technicians.Add(technician);
            }
        }

        var ticket = new MaintenanceTicket
        {
            Id = id,
            ResidentId = residentId,
            Resident = resident,
            CategoryId = category.Id,
            Category = category,
            TechnicianId = technicianId,
            Technician = technician,
            Title = $"Maintenance request {id}",
            Description = "Test maintenance request description",
            Priority = "High",
            Status = status,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        _context.Maintenances.Add(ticket);
        await _context.SaveChangesAsync();
        return ticket;
    }

    private async Task AddTechnicianAsync(int id, string email)
    {
        _context.Technicians.Add(new Technician
        {
            Id = id,
            Name = $"Technician {id}",
            Email = email,
            ContactInformation = email,
            Skills = "Plumbing",
            Status = "Available",
        });
        await _context.SaveChangesAsync();
    }

    private void SetUser(string role, params Claim[] additionalClaims)
    {
        var claims = new[] { new Claim(ClaimTypes.Role, role) }.Concat(additionalClaims);
        var identity = new ClaimsIdentity(claims, authenticationType: "Test");
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(identity),
                RequestServices = _serviceProvider,
            },
        };
    }

    public void Dispose()
    {
        _context.Dispose();
        _serviceProvider.Dispose();
        _safetyHandler.Dispose();
    }

    private sealed class StaticSafetyHandler : HttpMessageHandler
    {
        public string Verdict { get; set; } = "approve";
        public bool ApprovalRequired { get; set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            var verdict = new SafetyVerdictDto
            {
                Verdict = Verdict,
                ApprovalRequired = ApprovalRequired,
                Reason = "Test safety verdict",
                TraceId = "test-trace",
            };
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = JsonContent.Create(verdict),
            });
        }
    }

    private sealed class NoOpNotificationService : INotificationService
    {
        public Task SendEmailAsync(string toEmail, string subject, string body) => Task.CompletedTask;

        public Task SendPushNotificationAsync(string? fcmToken, string title, string body) => Task.CompletedTask;
    }

    private sealed class UnusedTriageService : IMaintenanceTriageService
    {
        public Task<AiTriageRecommendationDto> TriageComplaintAsync(
            string title,
            string description,
            List<Technician> technicians,
            Dictionary<int, int> technicianWorkloads,
            string currentSlaDeadlineInfo = "",
            string slaRisk = "Low",
            string managerFeedback = "") => throw new NotSupportedException();

        public Task<ResidentChatResponseDto> ChatWithResidentAgentAsync(ResidentChatRequestDto request) =>
            throw new NotSupportedException();
    }
}
