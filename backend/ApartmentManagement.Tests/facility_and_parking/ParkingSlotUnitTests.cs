using Xunit;
using FluentAssertions;
using ApartmentManagement.Api.Models;

namespace ApartmentManagement.Tests.Unit
{
    public class ParkingSlotUnitTests
    {
        [Fact]
        public void ParkingSlot_Should_Initialize_As_Available_By_Default()
        {
            // Arrange & Act
            var slot = new ParkingSlot { SlotNumber = "P-101" };

            // Assert
            slot.IsAvailable.Should().BeTrue();
            slot.SlotNumber.Should().Be("P-101");
        }
    }
}
