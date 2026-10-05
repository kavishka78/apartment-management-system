using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Models;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace ApartmentManagement.Tests.Database
{
    public class DatabaseConstraintsTests : IDisposable
    {
        private readonly SqliteConnection _connection;

        public DatabaseConstraintsTests()
        {
            // Create and open an in-memory SQLite relational database connection
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();
        }

        private AppDbContext CreateDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(_connection)
                .Options;

            var context = new AppDbContext(options);
            context.Database.EnsureCreated(); // Build true SQL tables with keys & unique indexes
            return context;
        }

        [Fact]
        public async Task UniqueConstraint_DuplicateInvoiceNumber_ThrowsDbUpdateException()
        {
            // Arrange
            using var context = CreateDbContext();
            var invoice1 = new Invoice
            {
                InvoiceNumber = "INV-2026-001",
                ApartmentId = 101,
                TotalAmount = 5000,
                BillingMonth = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(30)
            };

            var invoice2 = new Invoice
            {
                InvoiceNumber = "INV-2026-001", // Duplicate Invoice Number!
                ApartmentId = 102,
                TotalAmount = 7500,
                BillingMonth = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(30)
            };

            context.Invoices.Add(invoice1);
            await context.SaveChangesAsync();

            // Act
            context.Invoices.Add(invoice2);
            Func<Task> act = async () => await context.SaveChangesAsync();

            // Assert
            await act.Should().ThrowAsync<DbUpdateException>("Unique constraint on InvoiceNumber must prevent duplicates");
        }

        [Fact]
        public async Task UniqueConstraint_DuplicatePaymentReference_ThrowsDbUpdateException()
        {
            // Arrange
            using var context = CreateDbContext();
            var invoice = new Invoice
            {
                InvoiceNumber = "INV-999",
                ApartmentId = 1,
                TotalAmount = 1000,
                BillingMonth = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(10)
            };
            context.Invoices.Add(invoice);
            await context.SaveChangesAsync();

            var payment1 = new Payment
            {
                InvoiceId = invoice.Id,
                Amount = 500,
                PaymentReference = "PAY-REF-100",
                PaidAt = DateTime.UtcNow
            };

            var payment2 = new Payment
            {
                InvoiceId = invoice.Id,
                Amount = 500,
                PaymentReference = "PAY-REF-100", // Duplicate Payment Reference!
                PaidAt = DateTime.UtcNow
            };

            context.Payments.Add(payment1);
            await context.SaveChangesAsync();

            // Act
            context.Payments.Add(payment2);
            Func<Task> act = async () => await context.SaveChangesAsync();

            // Assert
            await act.Should().ThrowAsync<DbUpdateException>("Unique constraint on PaymentReference must prevent duplicates");
        }

        [Fact]
        public async Task CascadeDelete_DeletingInvoice_DeletesAssociatedItemsAndPayments()
        {
            // Arrange
            using var context = CreateDbContext();
            var invoice = new Invoice
            {
                InvoiceNumber = "INV-CASCADE-01",
                ApartmentId = 5,
                TotalAmount = 1500,
                BillingMonth = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(15),
                InvoiceItems = new List<InvoiceItem>
                {
                    new InvoiceItem { Description = "Water Fee", Amount = 500 },
                    new InvoiceItem { Description = "Maintenance", Amount = 1000 }
                },
                Payments = new List<Payment>
                {
                    new Payment { Amount = 1500, PaymentReference = "PAY-CAS-01", PaidAt = DateTime.UtcNow }
                }
            };

            context.Invoices.Add(invoice);
            await context.SaveChangesAsync();

            // Act
            context.Invoices.Remove(invoice);
            await context.SaveChangesAsync();

            // Assert
            (await context.Invoices.AnyAsync()).Should().BeFalse();
            (await context.InvoiceItems.AnyAsync()).Should().BeFalse("Cascade delete should remove invoice items");
            (await context.Payments.AnyAsync()).Should().BeFalse("Cascade delete should remove payments");
        }

        public void Dispose()
        {
            _connection.Close();
            _connection.Dispose();
        }
    }
}
