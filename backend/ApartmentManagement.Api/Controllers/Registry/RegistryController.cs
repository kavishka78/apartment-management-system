using System.Security.Claims;
using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Models;
using ApartmentManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ApartmentManagement.Api.Controllers
{
    public class OnboardDraftRequest
    {
        public int TenantId { get; set; }
        public string Text { get; set; } = string.Empty;
    }

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
        private readonly OnboardingAgentClient _onboardingAgent;

        public RegistryController(AppDbContext db, OnboardingAgentClient onboardingAgent)
        {
            _db = db;
            _onboardingAgent = onboardingAgent;
        }

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

        // AI draft: turns pasted resident details into a draft with issues. Read-only; the manager confirms via residents/onboard.
        [HttpPost("residents/onboard-draft")]
        public async Task<IActionResult> DraftResidentOnboarding([FromBody] OnboardDraftRequest req)
        {
            if (req.TenantId <= 0) return BadRequest("TenantId is required.");
            var denied = await Guard(req.TenantId, "residents");
            if (denied != null) return denied;
            if (string.IsNullOrWhiteSpace(req.Text)) return BadRequest("Paste the resident details first.");
            if (req.Text.Length > 4000) return BadRequest("Text is too long (max 4000 characters).");

            var units = await _db.Units
                .Where(u => u.TenantId == req.TenantId)
                .Select(u => new { id = u.Id, unitNumber = u.UnitNumber, status = u.Status })
                .ToListAsync();
            var emails = await _db.Residents
                .Where(r => r.TenantId == req.TenantId && r.Email != null && r.Email != "")
                .Select(r => r.Email!)
                .ToListAsync();
            var nationalIds = await _db.Residents
                .Where(r => r.TenantId == req.TenantId && r.NationalId != null && r.NationalId != "")
                .Select(r => r.NationalId!)
                .ToListAsync();

            var (status, body) = await _onboardingAgent.DraftAsync(req.TenantId, req.Text, units, emails, nationalIds);
            if (status != 200)
                return StatusCode(503, new { Message = "The onboarding assistant is unavailable. Enter the details manually." });
            return Ok(body);
        }

        [HttpPost("residents/onboard")]
        public async Task<ActionResult<Resident>> OnboardResident([FromBody] OnboardResidentRequest req)
        {
            if (req.TenantId <= 0) return BadRequest("TenantId is required.");
            var denied = await Guard(req.TenantId, "residents");
            if (denied != null) return denied;
            if (string.IsNullOrWhiteSpace(req.FullName)) return BadRequest("Full name is required.");

            Unit? unit = null;
            if (req.UnitId.HasValue && req.UnitId.Value > 0)
            {
                unit = await _db.Units.FirstOrDefaultAsync(u => u.Id == req.UnitId && u.TenantId == req.TenantId);
                if (unit == null) return BadRequest("Selected unit does not belong to this complex.");
                if (unit.Status != "Available") return Conflict($"Unit {unit.UnitNumber} is not available.");
            }
            else if (!string.IsNullOrWhiteSpace(req.UnitNumber))
            {
                var trimmed = req.UnitNumber.Trim();
                unit = await _db.Units.FirstOrDefaultAsync(u => u.TenantId == req.TenantId && u.UnitNumber.ToLower() == trimmed.ToLower());
                if (unit == null)
                {
                    unit = new Unit
                    {
                        TenantId = req.TenantId,
                        UnitNumber = trimmed.ToUpper(),
                        Status = "Available",
                        BlockName = "Main Block",
                        ParkingSlot = $"P-{trimmed.ToUpper()}",
                    };
                    _db.Units.Add(unit);
                    await _db.SaveChangesAsync();
                }
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
                var wasAvailable = unit.Status == "Available";
                unit.Status = "Occupied";
                unit.CurrentResidentName = resident.FullName;
                unit.CurrentResidentPhone = resident.PhoneNumber;

                // Update complex occupancy count
                if (wasAvailable)
                {
                    var complex = await _db.Complexes.FindAsync(req.TenantId);
                    if (complex != null)
                    {
                        complex.OccupiedUnits++;
                    }
                }
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
        // ── Resident Self-Service Profile & Household (Mobile App) ─────────────

        [HttpGet("resident/profile/{residentId:int}")]
        [AllowAnonymous] // Authenticated resident access
        public async Task<ActionResult<Resident>> GetResidentProfile(int residentId)
        {
            var res = await _db.Residents
                .Include(r => r.HouseholdMembers)
                .FirstOrDefaultAsync(r => r.Id == residentId);

            if (res == null) return NotFound("Resident not found.");
            return Ok(res);
        }

        [HttpPut("resident/profile/{residentId:int}")]
        [AllowAnonymous]
        public async Task<ActionResult<Resident>> UpdateResidentProfile(
            int residentId, [FromBody] Resident input)
        {
            var res = await _db.Residents.FindAsync(residentId);
            if (res == null) return NotFound("Resident not found.");

            res.FullName = input.FullName;
            res.PhoneNumber = input.PhoneNumber;
            res.EmergencyContact = input.EmergencyContact;

            await _db.SaveChangesAsync();
            return Ok(res);
        }

        [HttpGet("resident/{residentId:int}/household")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<HouseholdMember>>> GetHouseholdMembers(int residentId)
        {
            var members = await _db.HouseholdMembers
                .Where(h => h.ResidentId == residentId)
                .OrderBy(h => h.Id)
                .ToListAsync();
            return Ok(members);
        }

        [HttpPost("resident/{residentId:int}/household")]
        [AllowAnonymous]
        public async Task<ActionResult<HouseholdMember>> AddHouseholdMember(
            int residentId, [FromBody] HouseholdMember member)
        {
            var resident = await _db.Residents.FindAsync(residentId);
            if (resident == null) return NotFound("Resident not found.");

            if (string.IsNullOrWhiteSpace(member.Name))
                return BadRequest("Member name is required.");

            member.Id = 0;
            member.ResidentId = residentId;
            _db.HouseholdMembers.Add(member);
            await _db.SaveChangesAsync();

            return Ok(member);
        }

        [HttpDelete("resident/{residentId:int}/household/{memberId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> RemoveHouseholdMember(int residentId, int memberId)
        {
            var member = await _db.HouseholdMembers
                .FirstOrDefaultAsync(h => h.Id == memberId && h.ResidentId == residentId);
            if (member == null) return NotFound("Household member not found.");

            _db.HouseholdMembers.Remove(member);
            await _db.SaveChangesAsync();
            return Ok(new { success = true });
        }

        // ── Resident Self-Service Vehicles (Mobile App) ──────────────────────

        [HttpGet("resident/{residentId:int}/vehicles")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<Vehicle>>> GetResidentVehicles(int residentId)
        {
            var vehicles = await _db.Vehicles
                .Where(v => v.ResidentId == residentId)
                .OrderByDescending(v => v.Id)
                .ToListAsync();
            return Ok(vehicles);
        }

        [HttpPost("resident/{residentId:int}/vehicles")]
        [AllowAnonymous]
        public async Task<ActionResult<Vehicle>> RegisterResidentVehicle(
            int residentId, [FromBody] Vehicle vehicle)
        {
            var resident = await _db.Residents.FindAsync(residentId);
            if (resident == null) return NotFound("Resident not found.");

            if (string.IsNullOrWhiteSpace(vehicle.PlateNumber))
                return BadRequest("Plate number is required.");

            vehicle.Id = 0;
            vehicle.ResidentId = residentId;
            vehicle.ResidentName = resident.FullName;
            vehicle.UnitNumber = resident.UnitNumber;
            vehicle.TenantId = resident.TenantId;
            vehicle.PlateNumber = vehicle.PlateNumber.Trim().ToUpper();
            vehicle.RegisteredAt = DateTime.UtcNow.ToString("yyyy-MM-dd");
            vehicle.Status = "Approved";

            _db.Vehicles.Add(vehicle);
            resident.VehiclesCount += 1;
            await _db.SaveChangesAsync();

            return Ok(vehicle);
        }

        [HttpPut("vehicles/{id:int}")]
        [AllowAnonymous]
        public async Task<ActionResult<Vehicle>> UpdateResidentVehicle(
            int id, [FromBody] Vehicle input)
        {
            var vehicle = await _db.Vehicles.FindAsync(id);
            if (vehicle == null) return NotFound("Vehicle not found.");

            vehicle.PlateNumber = input.PlateNumber.Trim().ToUpper();
            vehicle.VehicleType = input.VehicleType;
            vehicle.MakeModel = input.MakeModel;
            vehicle.ParkingSlot = input.ParkingSlot;

            await _db.SaveChangesAsync();
            return Ok(vehicle);
        }

        [HttpDelete("resident/{residentId:int}/vehicles/{vehicleId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> RemoveResidentVehicle(int residentId, int vehicleId)
        {
            var vehicle = await _db.Vehicles
                .FirstOrDefaultAsync(v => v.Id == vehicleId && v.ResidentId == residentId);
            if (vehicle == null) return NotFound("Vehicle not found.");

            _db.Vehicles.Remove(vehicle);
            var resident = await _db.Residents.FindAsync(residentId);
            if (resident != null && resident.VehiclesCount > 0)
                resident.VehiclesCount -= 1;

            await _db.SaveChangesAsync();
            return Ok(new { success = true });
        }

        // ── Resident Self-Service Domestic Staff & Passes (Mobile App) ───────

        [HttpGet("resident/{residentId:int}/staff")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<DomesticStaff>>> GetResidentStaff(int residentId)
        {
            var staff = await _db.DomesticStaff
                .Where(s => s.ResidentId == residentId)
                .OrderByDescending(s => s.Id)
                .ToListAsync();
            return Ok(staff);
        }

        [HttpPost("resident/{residentId:int}/staff")]
        [AllowAnonymous]
        public async Task<ActionResult<DomesticStaff>> RegisterResidentStaff(
            int residentId, [FromBody] DomesticStaff staff)
        {
            var resident = await _db.Residents.FindAsync(residentId);
            if (resident == null) return NotFound("Resident not found.");

            if (string.IsNullOrWhiteSpace(staff.FullName))
                return BadRequest("Staff member full name is required.");

            staff.Id = 0;
            staff.ResidentId = residentId;
            staff.ResidentName = resident.FullName;
            staff.UnitNumber = resident.UnitNumber;
            staff.TenantId = resident.TenantId;
            staff.IsActive = true;
            staff.AccessPassCode = $"PASS-{Guid.NewGuid().ToString("N")[..4].ToUpper()}-{resident.UnitNumber ?? "UNIT"}";

            _db.DomesticStaff.Add(staff);
            resident.StaffCount += 1;
            await _db.SaveChangesAsync();

            return Ok(staff);
        }

        [HttpPatch("resident/staff/{id:int}/toggle")]
        [AllowAnonymous]
        public async Task<ActionResult<DomesticStaff>> ToggleResidentStaffPass(int id)
        {
            var staff = await _db.DomesticStaff.FindAsync(id);
            if (staff == null) return NotFound("Staff member not found.");

            staff.IsActive = !staff.IsActive;
            await _db.SaveChangesAsync();
            return Ok(staff);
        }

        [HttpDelete("resident/{residentId:int}/staff/{staffId:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> RemoveResidentStaff(int residentId, int staffId)
        {
            var staff = await _db.DomesticStaff
                .FirstOrDefaultAsync(s => s.Id == staffId && s.ResidentId == residentId);
            if (staff == null) return NotFound("Staff member not found.");

            _db.DomesticStaff.Remove(staff);
            var resident = await _db.Residents.FindAsync(residentId);
            if (resident != null && resident.StaffCount > 0)
                resident.StaffCount -= 1;

            await _db.SaveChangesAsync();
            return Ok(new { success = true });
        }
    }
}
