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

        // Payment Models
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

            // Payment Module Relationships

            // Invoice -> InvoiceItems
            // One invoice can contain many invoice items.
            modelBuilder.Entity<Invoice>()
                .HasMany(i => i.InvoiceItems)
                .WithOne(ii => ii.Invoice)
                .HasForeignKey(ii => ii.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            // Invoice -> Payments
            // One invoice can have payment transactions.
            modelBuilder.Entity<Invoice>()
                .HasMany(i => i.Payments)
                .WithOne(p => p.Invoice)
                .HasForeignKey(p => p.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            // Payment -> Receipt
            // One payment can have one receipt.
            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Receipt)
                .WithOne(r => r.Payment)
                .HasForeignKey<Receipt>(r => r.PaymentId)
                .OnDelete(DeleteBehavior.Cascade);

            // Payment reference must be unique.
            modelBuilder.Entity<Payment>()
                .HasIndex(p => p.PaymentReference)
                .IsUnique();

            // Receipt number must be unique.
            modelBuilder.Entity<Receipt>()
                .HasIndex(r => r.ReceiptNumber)
                .IsUnique();

            // Invoice number must be unique.
            modelBuilder.Entity<Invoice>()
                .HasIndex(i => i.InvoiceNumber)
                .IsUnique();

       
            // Facility and Visitor Module Configurations

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