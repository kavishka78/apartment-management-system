using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Models;

namespace ApartmentManagement.Api.Services
{
    public class SlaEscalationService : BackgroundService
    {
        private readonly IServiceProvider _services;

        public SlaEscalationService(IServiceProvider services)
        {
            _services = services;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _services.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                        var activeTickets = await context.Maintenances
                            .Include(m => m.History)
                            .Where(m => m.Status != "Resolved" && m.Status != "Closed" && m.SlaDueDate != null)
                            .ToListAsync(stoppingToken);

                        var now = DateTimeOffset.UtcNow;
                        bool changed = false;

                        foreach (var ticket in activeTickets)
                        {
                            var timeDiff = ticket.SlaDueDate!.Value - now;
                            string newSlaStatus = "Normal";

                            if (timeDiff.TotalHours < 0)
                            {
                                newSlaStatus = "Overdue";
                            }
                            else if (timeDiff.TotalHours < 24)
                            {
                                newSlaStatus = "At Risk";
                            }

                            if (ticket.SlaStatus != newSlaStatus)
                            {
                                ticket.SlaStatus = newSlaStatus;
                                ticket.History.Add(new MaintenanceHistory
                                {
                                    Status = "SLA Escalation",
                                    Note = $"SLA status updated to {newSlaStatus}.",
                                    ChangedBy = "System"
                                });
                                changed = true;
                            }
                        }

                        if (changed)
                        {
                            await context.SaveChangesAsync(stoppingToken);
                        }
                    }
                }
                catch (Exception ex)
                {
                    // Ignore DB errors (e.g. table not exists yet)
                    Console.WriteLine($"SLA Escalation Service Error: {ex.Message}");
                }

                // Wait 10 minutes before checking again
                await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
            }
        }
    }
}
