using System.ComponentModel.DataAnnotations;
using ApartmentManagement.Api.DTOs;
using ApartmentManagement.Api.Models;
using FluentAssertions;
using Xunit;

namespace ApartmentManagement.Tests.FacilityAndParking
{
    public class FacilityValidationTests
    {
        private IList<ValidationResult> ValidateModel(object model)
        {
            var results = new List<ValidationResult>();
            var context = new ValidationContext(model, null, null);
            Validator.TryValidateObject(model, context, results, validateAllProperties: true);
            return results;
        }

        [Fact]
        public void CreateFacilityDto_MissingRequiredFields_ShouldFailValidation()
        {
            // Arrange
            var dto = new CreateFacilityDto
            {
                Name = "", // Invalid: Required
                Capacity = 0 // Invalid: Range 1..500
            };

            // Act
            var validationErrors = ValidateModel(dto);

            // Assert
            validationErrors.Should().NotBeEmpty();
            validationErrors.Should().Contain(e => e.MemberNames.Contains("Name"));
        }

        [Fact]
        public void CreateFacilityDto_ValidInputs_ShouldPassValidation()
        {
            // Arrange
            var dto = new CreateFacilityDto
            {
                Name = "Community Hall",
                Description = "Spacious hall for resident events",
                Capacity = 100,
                OpenTime = TimeSpan.FromHours(8),
                CloseTime = TimeSpan.FromHours(22),
                IsActive = true
            };

            // Act
            var validationErrors = ValidateModel(dto);

            // Assert
            validationErrors.Should().BeEmpty();
        }

        [Fact]
        public void ParkingSlot_Model_Defaults_ShouldBeValid()
        {
            // Arrange & Act
            var slot = new ParkingSlot
            {
                SlotNumber = "P-301",
                SlotType = ParkingSlotType.Resident
            };

            // Assert
            slot.IsAvailable.Should().BeTrue("New parking slots default to available");
            slot.ResidentId.Should().BeNull();
            slot.CurrentVisitorPassId.Should().BeNull();
        }
    }
}
