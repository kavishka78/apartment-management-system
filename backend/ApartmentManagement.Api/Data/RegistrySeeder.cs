using ApartmentManagement.Api.Models;
using Microsoft.AspNetCore.Identity;

namespace ApartmentManagement.Api.Data
{
    // Demo data for complex 1 (Lotus Grand Residencies); only runs on an empty registry.
    public static class RegistrySeeder
    {
        public static void SeedPlatform(AppDbContext db)
        {
            if (db.Complexes.Any() || db.UserAccounts.Any()) return;

            var all = new List<string> { "units", "residents", "vehicles", "staff", "facilities", "maintenance", "visitors", "ai_safety", "payments" };
            var complexes = new[]
            {
                new Complex { Name = "Lotus Grand Residencies", Code = "LGR-01", Address = "No. 45, Alfred House Gardens, Colombo 03", ContactEmail = "management@lotusgrand.lk", ContactPhone = "+94 11 258 9630", SubscriptionPlan = "Enterprise Suite", TotalUnits = 48, OccupiedUnits = 38, CreatedAt = "2026-01-15", SubscriptionStart = "2026-09-01", SubscriptionEnd = "2027-09-01", EnabledModules = all },
                new Complex { Name = "Cinnamon Breeze Condominiums", Code = "CBC-02", Address = "No. 120, Marine Drive, Colombo 04", ContactEmail = "admin@cinnamonbreeze.lk", ContactPhone = "+94 11 472 1100", SubscriptionPlan = "Professional Growth", TotalUnits = 32, OccupiedUnits = 25, CreatedAt = "2026-02-10", SubscriptionStart = "2026-04-10", SubscriptionEnd = "2026-10-10", EnabledModules = new List<string> { "units", "residents", "vehicles", "staff", "facilities", "payments" } },
                new Complex { Name = "Pearl Oceanic Luxury Suites", Code = "POL-03", Address = "No. 88, Galle Road, Mount Lavinia", ContactEmail = "ops@pearloceanic.com", ContactPhone = "+94 11 271 4455", SubscriptionPlan = "Standard Starter", TotalUnits = 60, OccupiedUnits = 45, CreatedAt = "2026-03-01", SubscriptionStart = "2026-03-01", SubscriptionEnd = "2027-03-01", EnabledModules = new List<string> { "units", "residents", "payments" } },
            };
            db.Complexes.AddRange(complexes);
            db.SaveChanges();

            var hasher = new PasswordHasher<UserAccount>();
            UserAccount Make(string name, string email, string phone, string role, int? tenantId, string password, string assigned)
            {
                var u = new UserAccount { Name = name, Email = email, Phone = phone, Role = role, TenantId = tenantId, AssignedAt = assigned };
                u.PasswordHash = hasher.HashPassword(u, password);
                return u;
            }

            db.UserAccounts.AddRange(
                Make("Alexander Vance", "owner@apartmenthub.io", "", "SuperAdmin", null, "owner123", "2026-01-01"),
                Make("Nimal Fernando", "nimal.f@lotusgrand.lk", "+94 77 234 5678", "ApartmentAdmin", complexes[0].Id, "admin123", "2026-01-16"),
                Make("Saman Kumara", "saman.k@cinnamonbreeze.lk", "+94 71 888 4433", "ApartmentAdmin", complexes[1].Id, "admin123", "2026-02-12"),
                Make("Dilini Senanayake", "dilini.s@pearloceanic.com", "+94 77 665 1199", "ApartmentAdmin", complexes[2].Id, "admin123", "2026-03-02"));
            db.SaveChanges();
        }

        public static void Seed(AppDbContext db)
        {
            if (db.Units.Any() || db.Residents.Any()) return;

            var units = new[]
            {
                new Unit { TenantId = 1, UnitNumber = "A-101", FloorNumber = 1, BlockName = "Block A - Lotus Wing", NumberOfBedrooms = 2, NumberOfBathrooms = 2, SquareFeet = 1150, MonthlyRent = 125000, Status = "Occupied", CurrentResidentName = "Kamal Perera", CurrentResidentPhone = "+94 77 123 4567", ParkingSlot = "P-A101" },
                new Unit { TenantId = 1, UnitNumber = "A-102", FloorNumber = 1, BlockName = "Block A - Lotus Wing", NumberOfBedrooms = 3, NumberOfBathrooms = 2, SquareFeet = 1450, MonthlyRent = 165000, Status = "Available", ParkingSlot = "P-A102" },
                new Unit { TenantId = 1, UnitNumber = "B-201", FloorNumber = 2, BlockName = "Block B - Jasmine Wing", NumberOfBedrooms = 3, NumberOfBathrooms = 3, SquareFeet = 1600, MonthlyRent = 190000, Status = "Occupied", CurrentResidentName = "Dr. Anoma Jayasinghe", CurrentResidentPhone = "+94 71 889 2341", ParkingSlot = "P-B201" },
                new Unit { TenantId = 1, UnitNumber = "B-202", FloorNumber = 2, BlockName = "Block B - Jasmine Wing", NumberOfBedrooms = 2, NumberOfBathrooms = 2, SquareFeet = 1200, MonthlyRent = 130000, Status = "UnderMaintenance", ParkingSlot = "P-B202" },
                new Unit { TenantId = 1, UnitNumber = "C-301", FloorNumber = 3, BlockName = "Block C - Royal Penthouse", NumberOfBedrooms = 4, NumberOfBathrooms = 4, SquareFeet = 2400, MonthlyRent = 320000, Status = "Occupied", CurrentResidentName = "Mahesh Gunasekara", CurrentResidentPhone = "+94 77 555 8901", ParkingSlot = "P-C301" },
                new Unit { TenantId = 1, UnitNumber = "C-302", FloorNumber = 3, BlockName = "Block C - Royal Penthouse", NumberOfBedrooms = 4, NumberOfBathrooms = 4, SquareFeet = 2400, MonthlyRent = 320000, Status = "Available", ParkingSlot = "P-C302" },
            };
            db.Units.AddRange(units);
            db.SaveChanges();

            int UnitId(string n) => units.First(u => u.UnitNumber == n).Id;

            var kamal = new Resident { TenantId = 1, FullName = "Kamal Perera", Email = "kamal.perera@gmail.com", PhoneNumber = "+94 77 123 4567", NationalId = "198812345678", UnitId = UnitId("A-101"), UnitNumber = "A-101", MonthlyIncome = 450000, EmergencyContact = "Sunethra Perera (Spouse) - +94 77 123 4568", MoveInDate = "2024-06-01", VehiclesCount = 1, StaffCount = 1, HouseholdMembers = { new HouseholdMember { Name = "Sunethra Perera", Relation = "Spouse", Age = "34" }, new HouseholdMember { Name = "Dineth Perera", Relation = "Son", Age = "7" } } };
            var anoma = new Resident { TenantId = 1, FullName = "Dr. Anoma Jayasinghe", Email = "anoma.j@asiri.lk", PhoneNumber = "+94 71 889 2341", NationalId = "197545678912", UnitId = UnitId("B-201"), UnitNumber = "B-201", MonthlyIncome = 650000, EmergencyContact = "Rohan Jayasinghe (Brother) - +94 71 223 9988", MoveInDate = "2023-11-15", VehiclesCount = 2, StaffCount = 1, HouseholdMembers = { new HouseholdMember { Name = "Niluka Jayasinghe", Relation = "Daughter", Age = "14" } } };
            var mahesh = new Resident { TenantId = 1, FullName = "Mahesh Gunasekara", Email = "mahesh@apextech.io", PhoneNumber = "+94 77 555 8901", NationalId = "199178901234", UnitId = UnitId("C-301"), UnitNumber = "C-301", MonthlyIncome = 950000, EmergencyContact = "Saman Gunasekara (Father) - +94 77 444 1122", MoveInDate = "2025-01-10", VehiclesCount = 2, StaffCount = 2, HouseholdMembers = { new HouseholdMember { Name = "Kavindi Gunasekara", Relation = "Spouse", Age = "31" }, new HouseholdMember { Name = "Aria Gunasekara", Relation = "Daughter", Age = "3" } } };
            var sanjaya = new Resident { TenantId = 1, FullName = "Sanjaya Wickramasinghe", Email = "sanjaya.w@outlook.com", PhoneNumber = "+94 76 901 3456", NationalId = "199432109876", UnitNumber = "Pending Allocation", Status = "PendingVerification", MonthlyIncome = 380000, EmergencyContact = "Chandana Wickramasinghe - +94 76 111 2222", MoveInDate = "2026-04-01", VehiclesCount = 1 };
            db.Residents.AddRange(kamal, anoma, mahesh, sanjaya);
            db.SaveChanges();

            db.Vehicles.AddRange(
                new Vehicle { TenantId = 1, ResidentId = kamal.Id, ResidentName = kamal.FullName, UnitNumber = "A-101", PlateNumber = "CAB-4521", VehicleType = "Car", MakeModel = "Toyota Prius 2018 (Silver)", ParkingSlot = "P-A101", RegisteredAt = "2024-06-02" },
                new Vehicle { TenantId = 1, ResidentId = anoma.Id, ResidentName = anoma.FullName, UnitNumber = "B-201", PlateNumber = "WP-KQ-8890", VehicleType = "SUV", MakeModel = "Honda CR-V (Black)", ParkingSlot = "P-B201", RegisteredAt = "2023-11-16" },
                new Vehicle { TenantId = 1, ResidentId = anoma.Id, ResidentName = anoma.FullName, UnitNumber = "B-201", PlateNumber = "BI-3320", VehicleType = "Motorcycle", MakeModel = "Yamaha FZ (Red)", ParkingSlot = "P-B201-B", RegisteredAt = "2024-01-20" },
                new Vehicle { TenantId = 1, ResidentId = mahesh.Id, ResidentName = mahesh.FullName, UnitNumber = "C-301", PlateNumber = "CBG-1100", VehicleType = "Car", MakeModel = "BMW 520d (Alpine White)", ParkingSlot = "P-C301", RegisteredAt = "2025-01-11" },
                new Vehicle { TenantId = 1, ResidentId = mahesh.Id, ResidentName = mahesh.FullName, UnitNumber = "C-301", PlateNumber = "CAA-9912", VehicleType = "Van", MakeModel = "Toyota Alphard (Pearl)", ParkingSlot = "P-C301-B", RegisteredAt = "2025-01-12" });

            db.DomesticStaff.AddRange(
                new DomesticStaff { TenantId = 1, ResidentId = kamal.Id, ResidentName = kamal.FullName, UnitNumber = "A-101", FullName = "Nalani Kumari", StaffType = "Housekeeper / Maid", NicNumber = "197855667788", ContactPhone = "+94 77 908 1122", AccessPassCode = "PASS-N78-101", WorkingHours = "08:00 AM - 05:00 PM (Mon-Fri)" },
                new DomesticStaff { TenantId = 1, ResidentId = anoma.Id, ResidentName = anoma.FullName, UnitNumber = "B-201", FullName = "Sarath Bandara", StaffType = "Chauffeur / Driver", NicNumber = "198211223344", ContactPhone = "+94 71 556 7788", AccessPassCode = "PASS-S82-201", WorkingHours = "07:00 AM - 07:00 PM (Daily)" },
                new DomesticStaff { TenantId = 1, ResidentId = mahesh.Id, ResidentName = mahesh.FullName, UnitNumber = "C-301", FullName = "Kusuma Silva", StaffType = "Chef / Cook", NicNumber = "198033445566", ContactPhone = "+94 77 332 9900", AccessPassCode = "PASS-K80-301", WorkingHours = "09:00 AM - 03:00 PM (Daily)" },
                new DomesticStaff { TenantId = 1, ResidentId = mahesh.Id, ResidentName = mahesh.FullName, UnitNumber = "C-301", FullName = "Priyantha Jayalath", StaffType = "Chauffeur / Driver", NicNumber = "198944556677", ContactPhone = "+94 77 665 4321", AccessPassCode = "PASS-P89-301", WorkingHours = "08:00 AM - 08:00 PM (Daily)" });
            db.SaveChanges();
        }
    }
}
