using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ApartmentManagement.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace ApartmentManagement.Api.Services
{
    public class JwtTokenService
    {
        private readonly IConfiguration _config;

        public JwtTokenService(IConfiguration config) => _config = config;

        public static SymmetricSecurityKey GetKey(IConfiguration config)
        {
            var secret = config["Jwt:Key"];
            if (string.IsNullOrWhiteSpace(secret) || secret.Length < 32 || secret.StartsWith("YOUR_"))
            {
                secret = "dev-only-change-me-in-production-0123456789abcdef";
            }
            return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        }

        public string CreateToken(UserAccount user)
        {
            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Name, user.Name),
                new(ClaimTypes.Email, user.Email),
                new(ClaimTypes.Role, user.Role),
            };
            if (user.TenantId.HasValue) claims.Add(new Claim("tenantId", user.TenantId.Value.ToString()));

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(_config.GetValue("Jwt:ExpiryHours", 8)),
                signingCredentials: new SigningCredentials(GetKey(_config), SecurityAlgorithms.HmacSha256));
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string CreateResidentToken(Resident resident)
        {
            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, $"resident:{resident.Id}"),
                new(ClaimTypes.NameIdentifier, resident.Id.ToString()),
                new("residentId", resident.Id.ToString()),
                new("tenantId", resident.TenantId.ToString()),
                new(ClaimTypes.Name, resident.FullName),
                new(ClaimTypes.Email, resident.Email),
                new(ClaimTypes.Role, "Resident"),
            };
            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"], audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(_config.GetValue("Jwt:ExpiryHours", 8)),
                signingCredentials: new SigningCredentials(GetKey(_config), SecurityAlgorithms.HmacSha256));
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
