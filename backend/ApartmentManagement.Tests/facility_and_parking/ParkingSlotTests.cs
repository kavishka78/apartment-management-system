using ApartmentManagement.Api.Controllers;
using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace ApartmentManagement.Tests.FacilityAndParking
{
    public class ParkingSlotTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        private Mock<ILogger<ParkingSlotsController>> GetMockLogger()
        {
            return new Mock<ILogger<ParkingSlotsController>>();
        }

        [Fact]
        public async Task GetParkingSlots_ReturnsAllParkingSlots()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            db.ParkingSlots.AddRange(
                new ParkingSlot { SlotId = 1, SlotNumber = "P-101", SlotType = ParkingSlotType.Resident, IsAvailable = true },
                new ParkingSlot { SlotId = 2, SlotNumber = "V-201", SlotType = ParkingSlotType.Visitor, IsAvailable = true }
            );
            await db.SaveChangesAsync();

            var controller = new ParkingSlotsController(db, GetMockLogger().Object);

            // Act
            var actionResult = await controller.GetParkingSlots();

            // Assert
            var okResult = actionResult.Result.Should().BeOfType<OkObjectResult>().Subject;
            var slots = okResult.Value.Should().BeAssignableTo<IEnumerable<ParkingSlot>>().Subject;
            slots.Should().HaveCount(2);
        }

        [Fact]
        public async Task GetVisitorParkingSlots_FiltersVisitorSlotsOnly()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            db.ParkingSlots.AddRange(
                new ParkingSlot { SlotId = 1, SlotNumber = "P-101", SlotType = ParkingSlotType.Resident, IsAvailable = true },
                new ParkingSlot { SlotId = 2, SlotNumber = "V-201", SlotType = ParkingSlotType.Visitor, IsAvailable = true }
            );
            await db.SaveChangesAsync();

            var controller = new ParkingSlotsController(db, GetMockLogger().Object);

            // Act
            var actionResult = await controller.GetVisitorParkingSlots();

            // Assert
            var okResult = actionResult.Result.Should().BeOfType<OkObjectResult>().Subject;
            var slots = okResult.Value.Should().BeAssignableTo<IEnumerable<ParkingSlot>>().Subject;
            slots.Should().HaveCount(1);
            slots.First().SlotNumber.Should().Be("V-201");
        }

        [Fact]
        public async Task CreateParkingSlot_EmptySlotNumber_ReturnsBadRequest()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var controller = new ParkingSlotsController(db, GetMockLogger().Object);
            var newSlot = new ParkingSlot { SlotNumber = "" };

            // Act
            var actionResult = await controller.CreateParkingSlot(newSlot);

            // Assert
            var badRequest = actionResult.Result.Should().BeOfType<BadRequestObjectResult>().Subject;
            badRequest.Value.Should().Be("Slot number is required.");
        }

        [Fact]
        public async Task CreateParkingSlot_DuplicateSlotNumber_ReturnsConflict()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            db.ParkingSlots.Add(new ParkingSlot { SlotNumber = "P-101", SlotType = ParkingSlotType.Resident });
            await db.SaveChangesAsync();

            var controller = new ParkingSlotsController(db, GetMockLogger().Object);
            var duplicateSlot = new ParkingSlot { SlotNumber = "p-101", SlotType = ParkingSlotType.Resident };

            // Act
            var actionResult = await controller.CreateParkingSlot(duplicateSlot);

            // Assert
            var conflict = actionResult.Result.Should().BeOfType<ConflictObjectResult>().Subject;
            conflict.Value.Should().Be("Parking slot number 'p-101' already exists.");
        }

        [Fact]
        public async Task DeleteParkingSlot_OccupiedSlot_ReturnsBadRequest()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            db.ParkingSlots.Add(new ParkingSlot { SlotId = 10, SlotNumber = "P-500", IsAvailable = false });
            await db.SaveChangesAsync();

            var controller = new ParkingSlotsController(db, GetMockLogger().Object);

            // Act
            var result = await controller.DeleteParkingSlot(10);

            // Assert
            var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
            badRequest.Value.Should().Be("Cannot delete an occupied parking slot. Please free the slot first.");
        }

        [Fact]
        public async Task DeleteParkingSlot_AvailableSlot_DeletesSuccessfully()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            db.ParkingSlots.Add(new ParkingSlot { SlotId = 11, SlotNumber = "P-501", IsAvailable = true });
            await db.SaveChangesAsync();

            var controller = new ParkingSlotsController(db, GetMockLogger().Object);

            // Act
            var result = await controller.DeleteParkingSlot(11);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            (await db.ParkingSlots.FindAsync(11)).Should().BeNull();
        }
    }
}
