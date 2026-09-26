using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Models;
using ApartmentManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ApartmentManagement.Api.Controllers
{
    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class CreateComplexRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string ContactEmail { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string SubscriptionPlan { get; set; } = string.Empty;
        public int TotalUnits { get; set; }
        public int TermMonths { get; set; } = 12;
        public List<string> EnabledModules { get; set; } = new();
        public string? By { get; set; }
    }

    public class PackageRequest
    {
        public string SubscriptionPlan { get; set; } = string.Empty;
        public List<string> EnabledModules { get; set; } = new();
        public string? By { get; set; }
    }

    public class RenewRequest
    {
        public int Months { get; set; } = 12;
        public string? By { get; set; }
    }

    public class ActorRequest
    {
        public string? By { get; set; }
    }

    public class GoogleLoginRequest
    {
        public string Credential { get; set; } = string.Empty;
    }

    public class CreateAdminRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public int ComplexId { get; set; }
    }

    [ApiController]
    [Route("api/v1")]
    public class PlatformController : ControllerBase
    {
        private static readonly PasswordHasher<UserAccount> Hasher = new();
        private readonly AppDbContext _db;
        private readonly JwtTokenService _tokens;
        private readonly IConfiguration _config;

        public PlatformController(AppDbContext db, JwtTokenService tokens, IConfiguration config)
        {
            _db = db;
            _tokens = tokens;
            _config = config;
        }

        private string Actor => User.FindFirstValue(ClaimTypes.Name) ?? "System";

        private static string Today() => DateTime.UtcNow.ToString("yyyy-MM-dd");

        private static string AddMonths(string iso, int months) =>
            DateTime.Parse(iso).AddMonths(months).ToString("yyyy-MM-dd");

        private static string Initials(string name) =>
            name.Length >= 2 ? name[..2].ToUpper() : name.ToUpper();

        private static object ToUserDto(UserAccount u) => new
        {
            id = u.Id,
            name = u.Name,
            email = u.Email,
            role = u.Role,
            tenantId = u.TenantId,
            avatar = Initials(u.Name),
        };

        private void Log(Complex c, string action, string detail) =>
            _db.SubscriptionHistory.Add(new SubscriptionHistory
            {
                ComplexId = c.Id,
                ComplexName = c.Name,
                Action = action,
                Detail = detail,
                By = Actor,
            });

        // ── Auth ─────────────────────────────────────────────────
        [AllowAnonymous]
        [HttpPost("auth/login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            var email = req.Email.Trim().ToLower();
            var user = await _db.UserAccounts.FirstOrDefaultAsync(u => u.Email.ToLower() == email);
            if (user == null || user.Status != "Active" || string.IsNullOrEmpty(user.PasswordHash) ||
                Hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password) == PasswordVerificationResult.Failed)
                return Unauthorized("Invalid email or password.");

            return Ok(new { token = _tokens.CreateToken(user), user = ToUserDto(user) });
        }

        [AllowAnonymous]
        [HttpPost("auth/google")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest req)
        {
            Google.Apis.Auth.GoogleJsonWebSignature.Payload payload;
            try
            {
                payload = await Google.Apis.Auth.GoogleJsonWebSignature.ValidateAsync(
                    req.Credential,
                    new Google.Apis.Auth.GoogleJsonWebSignature.ValidationSettings
                    {
                        Audience = new[] { _config["Google:ClientId"] },
                    });
            }
            catch (Google.Apis.Auth.InvalidJwtException)
            {
                return Unauthorized("Google sign-in could not be verified.");
            }

            if (!payload.EmailVerified) return Unauthorized("This Google email is not verified.");

            var email = payload.Email.ToLower();
            var user = await _db.UserAccounts.FirstOrDefaultAsync(u => u.Email.ToLower() == email);
            if (user == null || user.Status != "Active")
                return Unauthorized("This Google account has not been granted access.");

            // Bind the account to one Google identity on first use
            if (user.GoogleSubject == null)
            {
                user.GoogleSubject = payload.Subject;
                await _db.SaveChangesAsync();
            }
            else if (user.GoogleSubject != payload.Subject)
            {
                return Unauthorized("This account is linked to a different Google identity.");
            }

            return Ok(new { token = _tokens.CreateToken(user), user = ToUserDto(user) });
        }

        [Authorize]
        [HttpGet("auth/me")]
        public async Task<IActionResult> Me()
        {
            var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await _db.UserAccounts.FindAsync(id);
            return user == null || user.Status != "Active" ? Unauthorized() : Ok(ToUserDto(user));
        }

        // ── Complexes ────────────────────────────────────────────
        [Authorize(Roles = "SuperAdmin")]
        [HttpGet("complexes")]
        public async Task<ActionResult<IEnumerable<Complex>>> GetComplexes() =>
            await _db.Complexes.OrderByDescending(c => c.Id).ToListAsync();

        [Authorize]
        [HttpGet("complexes/{id:int}")]
        public async Task<ActionResult<Complex>> GetComplex(int id)
        {
            var isSuper = User.IsInRole("SuperAdmin");
            if (!isSuper && User.FindFirstValue("tenantId") != id.ToString()) return Forbid();
            var c = await _db.Complexes.FindAsync(id);
            return c == null ? NotFound() : Ok(c);
        }

        [Authorize(Roles = "SuperAdmin")]
        [HttpPost("complexes")]
        public async Task<ActionResult<Complex>> CreateComplex([FromBody] CreateComplexRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest("Property name is required.");

            var start = Today();
            var complex = new Complex
            {
                Name = req.Name.Trim(),
                Code = req.Code.Trim(),
                Address = req.Address,
                ContactEmail = req.ContactEmail,
                ContactPhone = req.ContactPhone,
                SubscriptionPlan = req.SubscriptionPlan,
                TotalUnits = req.TotalUnits > 0 ? req.TotalUnits : 24,
                Status = "Active",
                CreatedAt = start,
                SubscriptionStart = start,
                SubscriptionEnd = AddMonths(start, req.TermMonths > 0 ? req.TermMonths : 12),
                EnabledModules = req.EnabledModules,
            };
            _db.Complexes.Add(complex);
            await _db.SaveChangesAsync();

            Log(complex, "Onboarded", $"{complex.SubscriptionPlan}, {req.TermMonths} month term");
            await _db.SaveChangesAsync();
            return Ok(complex);
        }

        [Authorize(Roles = "SuperAdmin")]
        [HttpPut("complexes/{id:int}/package")]
        public async Task<ActionResult<Complex>> UpdatePackage(int id, [FromBody] PackageRequest req)
        {
            var c = await _db.Complexes.FindAsync(id);
            if (c == null) return NotFound();

            if (req.SubscriptionPlan != c.SubscriptionPlan)
                Log(c, "Plan changed", $"{c.SubscriptionPlan} -> {req.SubscriptionPlan}");
            else
                Log(c, "Modules changed", $"{req.EnabledModules.Count} modules enabled");

            c.SubscriptionPlan = req.SubscriptionPlan;
            c.EnabledModules = req.EnabledModules;
            await _db.SaveChangesAsync();
            return Ok(c);
        }

        [Authorize(Roles = "SuperAdmin")]
        [HttpPost("complexes/{id:int}/renew")]
        public async Task<ActionResult<Complex>> Renew(int id, [FromBody] RenewRequest req)
        {
            var c = await _db.Complexes.FindAsync(id);
            if (c == null) return NotFound();
            if (req.Months <= 0) return BadRequest("Months must be positive.");

            var today = Today();
            // Renew from the current end date if still running, otherwise from today
            var baseDate = string.CompareOrdinal(c.SubscriptionEnd, today) > 0 ? c.SubscriptionEnd : today;
            if (baseDate == today) c.SubscriptionStart = today;
            c.SubscriptionEnd = AddMonths(baseDate, req.Months);
            c.Status = "Active";

            Log(c, "Renewed", $"+{req.Months} month(s), valid until {c.SubscriptionEnd}");
            await _db.SaveChangesAsync();
            return Ok(c);
        }

        [Authorize(Roles = "SuperAdmin")]
        [HttpPost("complexes/{id:int}/deactivate")]
        public async Task<ActionResult<Complex>> Deactivate(int id, [FromBody] ActorRequest req)
        {
            var c = await _db.Complexes.FindAsync(id);
            if (c == null) return NotFound();
            c.Status = "Deactivated";
            Log(c, "Deactivated", "Admin access suspended");
            await _db.SaveChangesAsync();
            return Ok(c);
        }

        [Authorize(Roles = "SuperAdmin")]
        [HttpPost("complexes/{id:int}/reactivate")]
        public async Task<ActionResult<Complex>> Reactivate(int id, [FromBody] ActorRequest req)
        {
            var c = await _db.Complexes.FindAsync(id);
            if (c == null) return NotFound();
            c.Status = "Active";
            Log(c, "Reactivated", "Admin access restored");
            await _db.SaveChangesAsync();
            return Ok(c);
        }

        [Authorize(Roles = "SuperAdmin")]
        [HttpGet("subscription-history")]
        public async Task<IActionResult> GetHistory() =>
            Ok(await _db.SubscriptionHistory.OrderByDescending(h => h.At).Take(100).ToListAsync());

        // ── Apartment admins ─────────────────────────────────────
        [Authorize(Roles = "SuperAdmin")]
        [HttpGet("admins")]
        public async Task<IActionResult> GetAdmins()
        {
            var rows = await (from u in _db.UserAccounts
                              join c in _db.Complexes on u.TenantId equals c.Id
                              where u.Role == "ApartmentAdmin"
                              orderby u.Id descending
                              select new
                              {
                                  id = u.Id,
                                  name = u.Name,
                                  email = u.Email,
                                  phone = u.Phone,
                                  complexId = c.Id,
                                  complexName = c.Name,
                                  role = u.Role,
                                  status = u.Status,
                                  assignedAt = u.AssignedAt,
                              }).ToListAsync();
            return Ok(rows);
        }

        [Authorize(Roles = "SuperAdmin")]
        [HttpPost("admins")]
        public async Task<IActionResult> CreateAdmin([FromBody] CreateAdminRequest req)
        {
            var email = req.Email.Trim().ToLower();
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(req.Name))
                return BadRequest("Name and email are required.");
            if (!string.IsNullOrEmpty(req.Password) && req.Password.Length < 6)
                return BadRequest("Password must be at least 6 characters (or leave it blank for Google-only sign-in).");

            var complex = await _db.Complexes.FindAsync(req.ComplexId);
            if (complex == null) return BadRequest("Apartment complex not found.");

            if (await _db.UserAccounts.AnyAsync(u => u.Email.ToLower() == email))
                return Conflict("An account with this email already exists.");

            var user = new UserAccount
            {
                Name = req.Name.Trim(),
                Email = email,
                Phone = req.Phone,
                Role = "ApartmentAdmin",
                TenantId = complex.Id,
                Status = "Active",
                AssignedAt = Today(),
            };
            if (!string.IsNullOrEmpty(req.Password))
                user.PasswordHash = Hasher.HashPassword(user, req.Password);
            _db.UserAccounts.Add(user);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = user.Id,
                name = user.Name,
                email = user.Email,
                phone = user.Phone,
                complexId = complex.Id,
                complexName = complex.Name,
                role = user.Role,
                status = user.Status,
                assignedAt = user.AssignedAt,
            });
        }
    }
}
