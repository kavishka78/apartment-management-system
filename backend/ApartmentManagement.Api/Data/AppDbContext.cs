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


        // Facility and Visitor Models
        public DbSet<Facility> Facilities { get; set; }
        public DbSet<FacilityBooking> FacilityBookings { get; set; }
        public DbSet<VisitorPass> VisitorPasses { get; set; }
        public DbSet<ParkingSlot> ParkingSlots { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Enum to String conversions for the DB
            modelBuilder.Entity<FacilityBooking>()
                .Property(b => b.Status)
                .HasConversion<string>();

            modelBuilder.Entity<VisitorPass>()
                .Property(p => p.Status)
                .HasConversion<string>();

            modelBuilder.Entity<ParkingSlot>()
                .Property(p => p.SlotType)
                .HasConversion<string>();
        }
    }
}