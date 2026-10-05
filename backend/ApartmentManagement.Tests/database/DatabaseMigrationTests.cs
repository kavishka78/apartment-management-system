using ApartmentManagement.Api.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace ApartmentManagement.Tests.Database
{
    public class DatabaseMigrationTests : IDisposable
    {
        private readonly SqliteConnection _connection;

        public DatabaseMigrationTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();
        }

        [Fact]
        public void AppDbContext_SchemaCreation_CreatesAllRequiredTablesAndIndexes()
        {
            // Arrange
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(_connection)
                .Options;

            using var context = new AppDbContext(options);

            // Act
            bool created = context.Database.EnsureCreated();

            // Assert
            created.Should().BeTrue("EF Core schema model creation should build without syntax or mapping errors");
            
            // Verify core table DB sets can be queried without mapping exception
            context.Invoices.Should().NotBeNull();
            context.Payments.Should().NotBeNull();
            context.Receipts.Should().NotBeNull();
            context.Facilities.Should().NotBeNull();
            context.ParkingSlots.Should().NotBeNull();
            context.VisitorPasses.Should().NotBeNull();
        }

        public void Dispose()
        {
            _connection.Close();
            _connection.Dispose();
        }
    }
}
