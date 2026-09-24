using ApartmentManagement.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ApartmentManagement.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InvoiceItem> InvoiceItems { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Receipt> Receipts { get; set; }

        public DbSet<Maintenance> Maintenances { get; set; }
        public DbSet<MaintenanceCategory> MaintenanceCategories { get; set; }
        public DbSet<Technician> Technicians { get; set; }
        public DbSet<MaintenanceHistory> MaintenanceHistories { get; set; }
    }
}