using System.Security.Claims;
using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApartmentManagement.Api.Controllers
{
    public class OnboardResidentRequest
    {
        public int TenantId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string NationalId { get; set; } = string.Empty;
        public int? UnitId { get; set; }
        public string? UnitNumber { get; set; }
        public decimal MonthlyIncome { get; set; }
        public string? EmergencyContact { get; set; }
        public string? MoveInDate { get; set; }
        public string? PlateNumber { get; set; }
        public string? VehicleType { get; set; }
        public string? MakeModel { get; set; }
        public string? ParkingSlot { get; set; }
        public List<HouseholdMember> HouseholdMembers { get; set; } = new();
    }

    [ApiController]
    [Authorize(Roles = "ApartmentAdmin,SuperAdmin")]
    [Route("api/v1")]
    public class RegistryController : ControllerBase
    {
        private readonly AppDbContext _db;

        public RegistryController(AppDbContext db) => _db = db;

        // An apartment admin may only touch their own complex, and only while its
        // subscription is active and the package includes the module.
        private async Task<ActionResult?> Guard(int tenantId, string module)
        {
            if (User.IsInRole("SuperAdmin")) return null;
            if (User.FindFirstValue("tenantId") != tenantId.ToString()) return Forbid();

            var complex = await _db.Complexes.FindAsync(tenantId);
            var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
            if (complex == null || complex.Status != "Active" || string.CompareOrdinal(complex.SubscriptionEnd, today) < 0)
                return StatusCode(403, "This complex's subscription is inactive.");
            if (!complex.EnabledModules.Contains(module))
                return StatusCode(403, $"The '{module}' module is not included in this package.");
            return null;
        }

        // ── Units ────────────────────────────────────────────────
        [HttpGet("tenants/{tenantId:int}/units")]
        public async Task<ActionResult<IEnumerable<Unit>>> GetUnits(int tenantId)
        {
            var denied = await Guard(tenantId, "units");
            if (denied != null) return denied;
            return await _db.Units.Where(u => u.TenantId == tenantId).OrderBy(u => u.UnitNumber).ToListAsync();
        }

        [HttpPost("units")]
        public async Task<ActionResult<Unit>> CreateUnit([FromBody] Unit unit)
        {
            if (unit.TenantId <= 0) return BadRequest("TenantId is required.");
            var denied = await Guard(unit.TenantId, "units");
            if (denied != null) return denied;
            if (string.IsNullOrWhiteSpace(unit.UnitNumber)) return BadRequest("Unit number is required.");

            var number = unit.UnitNumber.Trim();
            if (await _db.Units.AnyAsync(u => u.TenantId == unit.TenantId && u.UnitNumber.ToLower() == number.ToLower()))
                return Conflict($"Unit '{number}' already exists in this complex.");

            unit.Id = 0;
            unit.UnitNumber = number;
            _db.Units.Add(unit);
            await _db.SaveChangesAsync();
            return Ok(unit);
        }

        [HttpPut("units/{id:int}")]
        public async Task<ActionResult<Unit>> UpdateUnit(int id, [FromBody] Unit input)
        {
            var unit = await _db.Units.FindAsync(id);
            if (unit == null) return NotFound("Unit not found.");
            var denied = await Guard(unit.TenantId, "units");
            if (denied != null) return denied;

            // TenantId is never changed by an update
            unit.UnitNumber = input.UnitNumber;
            unit.FloorNumber = input.FloorNumber;
            unit.BlockName = input.BlockName;
            unit.NumberOfBedrooms = input.NumberOfBedrooms;
            unit.NumberOfBathrooms = input.NumberOfBathrooms;
            unit.SquareFeet = input.SquareFeet;
            unit.MonthlyRent = input.MonthlyRent;
            unit.ParkingSlot = input.ParkingSlot;
            unit.Status = input.Status;
            await _db.SaveChangesAsync();
            return Ok(unit);
        }

        // ── Residents ────────────────────────────────────────────
        [HttpGet("residents")]
        public async Task<ActionResult<IEnumerable<Resident>>> GetResidents([FromQuery] int tenantId)
        {
            var denied = await Guard(tenantId, "residents");
            if (denied != null) return denied;
            return await _db.Residents.Include(r => r.HouseholdMembers)
                .Where(r => r.TenantId == tenantId)
                .OrderByDescending(r => r.Id)
                .ToListAsync();
        }

        [HttpPost("residents/onboard")]
        public async Task<ActionResult<Resident>> OnboardResident([FromBody] OnboardResidentRequest req)
        {
            if (req.TenantId <= 0) return BadRequest("TenantId is required.");
            var denied = await Guard(req.TenantId, "residents");
            if (denied != null) return denied;
            if (string.IsNullOrWhiteSpace(req.FullName)) return BadRequest("Full name is required.");

            Unit? unit = null;
            if (req.UnitId.HasValue)
            {
                unit = await _db.Units.FirstOrDefaultAsync(u => u.Id == req.UnitId && u.TenantId == req.TenantId);
                if (unit == null) return BadRequest("Selected unit does not belong to this complex.");
                if (unit.Status != "Available") return Conflict($"Unit {unit.UnitNumber} is not available.");
            }

            var resident = new Resident
            {
                TenantId = req.TenantId,
                FullName = req.FullName.Trim(),
                Email = req.Email,
                PhoneNumber = req.PhoneNumber,
                NationalId = req.NationalId,
                UnitId = unit?.Id,
                UnitNumber = unit?.UnitNumber ?? req.UnitNumber,
                MonthlyIncome = req.MonthlyIncome,
                EmergencyContact = req.EmergencyContact,
                MoveInDate = req.MoveInDate ?? DateTime.UtcNow.ToString("yyyy-MM-dd"),
                Status = "Active",
                VehiclesCount = string.IsNullOrWhiteSpace(req.PlateNumber) ? 0 : 1,
                HouseholdMembers = req.HouseholdMembers
                    .Select(m => new HouseholdMember { Name = m.Name, Relation = m.Relation, Age = m.Age })
                    .ToList(),
            };
            _db.Residents.Add(resident);

            if (unit != null)
            {
                unit.Status = "Occupied";
                unit.CurrentResidentName = resident.FullName;
                unit.CurrentResidentPhone = resident.PhoneNumber;
            }

            await _db.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(req.PlateNumber))
            {
                _db.Vehicles.Add(new Vehicle
                {
                    TenantId = req.TenantId,
                    ResidentId = resident.Id,
                    ResidentName = resident.FullName,
                    UnitNumber = resident.UnitNumber,
                    PlateNumber = req.PlateNumber.Trim().ToUpper(),
                    VehicleType = req.VehicleType ?? "Car",
                    MakeModel = req.MakeModel ?? string.Empty,
                    ParkingSlot = req.ParkingSlot,
                    RegisteredAt = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                });
                await _db.SaveChangesAsync();
            }

            return Ok(resident);
        }

        // ── Vehicles ─────────────────────────────────────────────
        [HttpGet("vehicles")]
        public async Task<ActionResult<IEnumerable<Vehicle>>> GetVehicles([FromQuery] int tenantId)
        {
            var denied = await Guard(tenantId, "vehicles");
            if (denied != null) return denied;
            return await _db.Vehicles.Where(v => v.TenantId == tenantId).OrderByDescending(v => v.Id).ToListAsync();
        }

        [HttpPost("vehicles")]
        public async Task<ActionResult<Vehicle>> CreateVehicle([FromBody] Vehicle vehicle)
        {
            if (vehicle.TenantId <= 0) return BadRequest("TenantId is required.");
            var denied = await Guard(vehicle.TenantId, "vehicles");
            if (denied != null) return denied;
            if (string.IsNullOrWhiteSpace(vehicle.PlateNumber)) return BadRequest("Plate number is required.");

            if (vehicle.ResidentId.HasValue &&
                !await _db.Residents.AnyAsync(r => r.Id == vehicle.ResidentId && r.TenantId == vehicle.TenantId))
                return BadRequest("Resident does not belong to this complex.");

            vehicle.Id = 0;
            vehicle.PlateNumber = vehicle.PlateNumber.Trim().ToUpper();
            vehicle.RegisteredAt = DateTime.UtcNow.ToString("yyyy-MM-dd");
            vehicle.Status = "Approved";
            _db.Vehicles.Add(vehicle);

            if (vehicle.ResidentId.HasValue)
            {
                var resident = await _db.Residents.FindAsync(vehicle.ResidentId.Value);
                if (resident != null) resident.VehiclesCount += 1;
            }

            await _db.SaveChangesAsync();
            return Ok(vehicle);
        }

        // ── Domestic Staff ───────────────────────────────────────
        [HttpGet("staff")]
        public async Task<ActionResult<IEnumerable<DomesticStaff>>> GetStaff([FromQuery] int tenantId)
        {
            var denied = await Guard(tenantId, "staff");
            if (denied != null) return denied;
            return await _db.DomesticStaff.Where(s => s.TenantId == tenantId).OrderByDescending(s => s.Id).ToListAsync();
        }

        [HttpPost("staff")]
        public async Task<ActionResult<DomesticStaff>> CreateStaff([FromBody] DomesticStaff staff)
        {
            if (staff.TenantId <= 0) return BadRequest("TenantId is required.");
            var denied = await Guard(staff.TenantId, "staff");
            if (denied != null) return denied;
            if (string.IsNullOrWhiteSpace(staff.FullName)) return BadRequest("Full name is required.");

            if (staff.ResidentId.HasValue &&
                !await _db.Residents.AnyAsync(r => r.Id == staff.ResidentId && r.TenantId == staff.TenantId))
                return BadRequest("Resident does not belong to this complex.");

            staff.Id = 0;
            staff.IsActive = true;
            staff.AccessPassCode = $"PASS-{Guid.NewGuid().ToString("N")[..4].ToUpper()}-{staff.UnitNumber ?? "100"}";
            _db.DomesticStaff.Add(staff);

            if (staff.ResidentId.HasValue)
            {
                var resident = await _db.Residents.FindAsync(staff.ResidentId.Value);
                if (resident != null) resident.StaffCount += 1;
            }

            await _db.SaveChangesAsync();
            return Ok(staff);
        }

        [HttpPatch("staff/{id:int}/toggle")]
        public async Task<ActionResult<DomesticStaff>> ToggleStaff(int id)
        {
            var staff = await _db.DomesticStaff.FindAsync(id);
            if (staff == null) return NotFound("Staff member not found.");
            var denied = await Guard(staff.TenantId, "staff");
            if (denied != null) return denied;

            staff.IsActive = !staff.IsActive;
            await _db.SaveChangesAsync();
            return Ok(staff);
        }
    }
}
