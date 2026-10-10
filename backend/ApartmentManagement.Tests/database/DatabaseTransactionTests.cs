using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Models;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace ApartmentManagement.Tests.Database
{
    public class DatabaseTransactionTests : IDisposable
    {
        private readonly SqliteConnection _connection;

        public DatabaseTransactionTests()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();
        }

        private AppDbContext CreateDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(_connection)
                .Options;

            var context = new AppDbContext(options);
            context.Database.EnsureCreated();
            return context;
        }

        [Fact]
        public async Task Transaction_Rollback_RevertsAllDatabaseChanges()
        {
            // Arrange
            using var context = CreateDbContext();

            // Act
            using (var transaction = await context.Database.BeginTransactionAsync())
            {
                var facility = new Facility
                {
                    FacilityName = "Temp Gym",
                    Capacity = 10,
                    IsActive = true
                };

                context.Facilities.Add(facility);
                await context.SaveChangesAsync();

                // Rollback transaction explicitly
                await transaction.RollbackAsync();
            }

            // Assert
            var count = await context.Facilities.CountAsync();
            count.Should().Be(0, "Rolled back transaction should not save changes to the database");
        }

        [Fact]
        public async Task Transaction_Commit_PersistsAllDatabaseChanges()
        {
            // Arrange
            using var context = CreateDbContext();

            // Act
            using (var transaction = await context.Database.BeginTransactionAsync())
            {
                var facility = new Facility
                {
                    FacilityName = "Swimming Pool",
                    Capacity = 25,
                    IsActive = true
                };

                context.Facilities.Add(facility);
                await context.SaveChangesAsync();

                // Commit transaction explicitly
                await transaction.CommitAsync();
            }

            // Assert
            var savedFacility = await context.Facilities.FirstOrDefaultAsync(f => f.FacilityName == "Swimming Pool");
            savedFacility.Should().NotBeNull("Committed transaction must persist changes in the database");
            savedFacility!.Capacity.Should().Be(25);
        }

        public void Dispose()
        {
            _connection.Close();
            _connection.Dispose();
        }
    }
}
