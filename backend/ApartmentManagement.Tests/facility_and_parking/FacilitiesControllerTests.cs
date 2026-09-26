using ApartmentManagement.Api.Controllers;
using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.DTOs;
using ApartmentManagement.Api.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace ApartmentManagement.Tests.FacilityAndParking
{
    public class FacilitiesControllerTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        private Mock<ILogger<FacilitiesController>> GetMockLogger()
        {
            return new Mock<ILogger<FacilitiesController>>();
        }

        [Fact]
        public async Task GetFacilities_ReturnsActiveAndInactive_WhenIncludeInactiveIsTrue()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            db.Facilities.AddRange(
                new Facility { FacilityId = 1, FacilityName = "Gym", Capacity = 20, IsActive = true },
                new Facility { FacilityId = 2, FacilityName = "Pool", Capacity = 15, IsActive = false, DeactivationReason = "Maintenance" }
            );
            await db.SaveChangesAsync();

            var controller = new FacilitiesController(db, GetMockLogger().Object);

            // Act
            var actionResult = await controller.GetFacilities(includeInactive: true);

            // Assert
            var okResult = actionResult.Result.Should().BeOfType<OkObjectResult>().Subject;
            var facilities = okResult.Value.Should().BeAssignableTo<IEnumerable<FacilityResponseDto>>().Subject;
            facilities.Should().HaveCount(2);
        }

        [Fact]
        public async Task GetFacilities_FiltersInactive_WhenIncludeInactiveIsFalse()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            db.Facilities.AddRange(
                new Facility { FacilityId = 1, FacilityName = "Gym", Capacity = 20, IsActive = true },
                new Facility { FacilityId = 2, FacilityName = "Pool", Capacity = 15, IsActive = false }
            );
            await db.SaveChangesAsync();

            var controller = new FacilitiesController(db, GetMockLogger().Object);

            // Act
            var actionResult = await controller.GetFacilities(includeInactive: false);

            // Assert
            var okResult = actionResult.Result.Should().BeOfType<OkObjectResult>().Subject;
            var facilities = okResult.Value.Should().BeAssignableTo<IEnumerable<FacilityResponseDto>>().Subject;
            facilities.Should().HaveCount(1);
            facilities.First().Name.Should().Be("Gym");
        }

        [Fact]
        public async Task GetFacility_InvalidId_ReturnsNotFound()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var controller = new FacilitiesController(db, GetMockLogger().Object);

            // Act
            var actionResult = await controller.GetFacility(999);

            // Assert
            var notFound = actionResult.Result.Should().BeOfType<NotFoundObjectResult>().Subject;
            notFound.Value.Should().Be("Facility not found.");
        }

        [Fact]
        public async Task CreateFacility_ValidDto_CreatesAndReturnsCreatedAtAction()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var controller = new FacilitiesController(db, GetMockLogger().Object);
            var dto = new CreateFacilityDto
            {
                Name = "Tennis Court",
                Description = "Outdoor court",
                Capacity = 4,
                OpenTime = TimeSpan.FromHours(6),
                CloseTime = TimeSpan.FromHours(22),
                IsActive = true
            };

            // Act
            var actionResult = await controller.CreateFacility(dto);

            // Assert
            var createdAtAction = actionResult.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
            var createdFacility = createdAtAction.Value.Should().BeOfType<Facility>().Subject;
            createdFacility.FacilityName.Should().Be("Tennis Court");
            createdFacility.Capacity.Should().Be(4);
            
            (await db.Facilities.CountAsync()).Should().Be(1);
        }

        [Fact]
        public async Task ToggleFacilityStatus_TogglesActiveStateCorrectly()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var facility = new Facility { FacilityId = 10, FacilityName = "Sauna", IsActive = true };
            db.Facilities.Add(facility);
            await db.SaveChangesAsync();

            var controller = new FacilitiesController(db, GetMockLogger().Object);

            // Act 1: Toggle from active to inactive
            var result1 = await controller.ToggleFacilityStatus(10);
            result1.Should().BeOfType<OkObjectResult>();

            var updatedFacility1 = await db.Facilities.FindAsync(10);
            updatedFacility1!.IsActive.Should().BeFalse();

            // Act 2: Toggle from inactive back to active
            var result2 = await controller.ToggleFacilityStatus(10);
            result2.Should().BeOfType<OkObjectResult>();

            var updatedFacility2 = await db.Facilities.FindAsync(10);
            updatedFacility2!.IsActive.Should().BeTrue();
        }
    }
}
