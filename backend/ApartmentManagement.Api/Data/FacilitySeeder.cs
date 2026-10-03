using System;
using System.Linq;
using ApartmentManagement.Api.Models;

namespace ApartmentManagement.Api.Data
{
    public static class FacilitySeeder
    {
        public static void Seed(AppDbContext db)
        {
            var firstResident = db.Residents.FirstOrDefault();
            int? residentId = firstResident?.Id;

            // Seed Facilities
            if (!db.Facilities.Any())
            {
                var pool = new Facility 
                { 
                    FacilityName = "Rooftop Swimming Pool", 
                    FacilityDescription = "Infinity pool with panoramic city views and sun loungers.", 
                    Capacity = 20, 
                    HourlyCost = 500,
                    OpenTime = new TimeSpan(6, 0, 0), 
                    CloseTime = new TimeSpan(22, 0, 0), 
                    IsActive = true 
                };
                var gym = new Facility 
                { 
                    FacilityName = "Fitness Center & Gym", 
                    FacilityDescription = "State-of-the-art cardio equipment, free weights, and personal trainers.", 
                    Capacity = 15, 
                    HourlyCost = 350,
                    OpenTime = new TimeSpan(5, 30, 0), 
                    CloseTime = new TimeSpan(23, 0, 0), 
                    IsActive = true 
                };
                var hall = new Facility 
                { 
                    FacilityName = "Grand Banquet & Party Hall", 
                    FacilityDescription = "Air-conditioned multi-purpose event hall with sound system and kitchen facility.", 
                    Capacity = 100, 
                    HourlyCost = 2500,
                    OpenTime = new TimeSpan(8, 0, 0), 
                    CloseTime = new TimeSpan(23, 0, 0), 
                    IsActive = true 
                };
                var tennis = new Facility 
                { 
                    FacilityName = "Tennis & Squash Court", 
                    FacilityDescription = "Professional outdoor floodlit tennis court.", 
                    Capacity = 4, 
                    HourlyCost = 800,
                    OpenTime = new TimeSpan(6, 0, 0), 
                    CloseTime = new TimeSpan(21, 0, 0), 
                    IsActive = true 
                };

                db.Facilities.AddRange(pool, gym, hall, tennis);
                db.SaveChanges();

                if (residentId.HasValue)
                {
                    db.FacilityBookings.AddRange(
                        new FacilityBooking { FacilityId = pool.FacilityId, ResidentId = residentId.Value, BookingDate = DateTime.UtcNow.Date.AddDays(1), StartTime = new TimeSpan(7, 0, 0), EndTime = new TimeSpan(9, 0, 0), Status = BookingStatus.Approved },
                        new FacilityBooking { FacilityId = gym.FacilityId, ResidentId = residentId.Value, BookingDate = DateTime.UtcNow.Date.AddDays(1), StartTime = new TimeSpan(6, 30, 0), EndTime = new TimeSpan(8, 0, 0), Status = BookingStatus.Approved },
                        new FacilityBooking { FacilityId = hall.FacilityId, ResidentId = residentId.Value, BookingDate = DateTime.UtcNow.Date.AddDays(3), StartTime = new TimeSpan(18, 0, 0), EndTime = new TimeSpan(22, 0, 0), Status = BookingStatus.Pending }
                    );
                    db.SaveChanges();
                }
            }

            // Seed Parking Slots
            if (!db.ParkingSlots.Any())
            {
                var p1 = new ParkingSlot { SlotNumber = "V-01", SlotType = ParkingSlotType.Visitor, IsAvailable = false, ResidentId = residentId };
                var p2 = new ParkingSlot { SlotNumber = "V-02", SlotType = ParkingSlotType.Visitor, IsAvailable = true };
                var p3 = new ParkingSlot { SlotNumber = "V-03", SlotType = ParkingSlotType.Visitor, IsAvailable = true };
                var p4 = new ParkingSlot { SlotNumber = "R-101", SlotType = ParkingSlotType.Resident, IsAvailable = false, ResidentId = residentId };
                var p5 = new ParkingSlot { SlotNumber = "R-201", SlotType = ParkingSlotType.Resident, IsAvailable = false, ResidentId = residentId };

                db.ParkingSlots.AddRange(p1, p2, p3, p4, p5);
                db.SaveChanges();
            }

            // Seed Visitor Passes
            if (!db.VisitorPasses.Any() && residentId.HasValue)
            {
                db.VisitorPasses.AddRange(
                    new VisitorPass { ResidentId = residentId.Value, VisitorName = "Sunil Shantha", PhoneNumber = "0773341122", VehicleNumber = "WP CAR-5544", AccessCode = "VP-98231", Status = PassStatus.CheckedIn, ExpectedArrival = DateTime.UtcNow.AddHours(-1), CheckInTime = DateTime.UtcNow.AddMinutes(-45) },
                    new VisitorPass { ResidentId = residentId.Value, VisitorName = "Dr. Priyantha Silva", PhoneNumber = "0712238899", VehicleNumber = "WP CAD-1200", AccessCode = "VP-44129", Status = PassStatus.Active, ExpectedArrival = DateTime.UtcNow.AddHours(2) },
                    new VisitorPass { ResidentId = residentId.Value, VisitorName = "Kavinda De Silva", PhoneNumber = "0765549900", VehicleNumber = "WP CBH-8901", AccessCode = "VP-77182", Status = PassStatus.Pending, ExpectedArrival = DateTime.UtcNow.AddDays(1) }
                );
                db.SaveChanges();
            }
        }
    }
}
