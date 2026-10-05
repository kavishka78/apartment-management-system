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
    public class VisitorPassTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        private Mock<ILogger<VisitorsController>> GetMockLogger()
        {
            return new Mock<ILogger<VisitorsController>>();
        }

        [Fact]
        public async Task PreRegisterVisitor_WithVehicle_AutoAssignsVisitorParkingSlot()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var visitorSlot = new ParkingSlot
            {
                SlotId = 1,
                SlotNumber = "V-01",
                SlotType = ParkingSlotType.Visitor,
                IsAvailable = true
            };
            db.ParkingSlots.Add(visitorSlot);
            await db.SaveChangesAsync();

            var controller = new VisitorsController(db, GetMockLogger().Object);
            var dto = new CreateVisitorPassDto
            {
                ResidentId = 101,
                VisitorName = "David Miller",
                PhoneNumber = "0771234567",
                VehicleNumber = "WP CAB-9999",
                ExpectedArrival = DateTime.UtcNow.AddHours(2)
            };

            // Act
            var actionResult = await controller.PreRegisterVisitor(dto);

            // Assert
            var objectResult = actionResult.Result.Should().BeOfType<ObjectResult>().Subject;
            objectResult.StatusCode.Should().Be(201);

            // Verify in DB that slot is now unavailable and assigned
            var slotInDb = await db.ParkingSlots.FindAsync(1);
            slotInDb!.IsAvailable.Should().BeFalse("Parking slot should be marked unavailable when assigned to visitor");
        }

        [Fact]
        public async Task CheckOutVisitor_ReleasesAssignedParkingSlot()
        {
            // Arrange
            using var db = GetInMemoryDbContext();
            var slot = new ParkingSlot
            {
                SlotId = 5,
                SlotNumber = "V-05",
                SlotType = ParkingSlotType.Visitor,
                IsAvailable = false
            };
            db.ParkingSlots.Add(slot);

            var visitorPass = new VisitorPass
            {
                PassId = 20,
                VisitorName = "Sarah Jenkins",
                VehicleNumber = "WP CAD-1111",
                Status = PassStatus.CheckedIn,
                AssignedParkingSlot = slot
            };
            db.VisitorPasses.Add(visitorPass);
            await db.SaveChangesAsync();

            var controller = new VisitorsController(db, GetMockLogger().Object);

            // Act
            var result = await controller.CheckOutVisitor(20);

            // Assert
            result.Should().BeOfType<OkObjectResult>();

            var updatedVisitor = await db.VisitorPasses.FindAsync(20);
            updatedVisitor!.Status.Should().Be(PassStatus.CheckedOut);
            updatedVisitor.CheckOutTime.Should().NotBeNull();

            var updatedSlot = await db.ParkingSlots.FindAsync(5);
            updatedSlot!.IsAvailable.Should().BeTrue("Parking slot should be released upon check-out");
        }
    }
}
