using ITAMS_GME_BACKEND.Data;
using ITAMS_GME_BACKEND.DTOs;
using ITAMS_GME_BACKEND.Models;
using Microsoft.EntityFrameworkCore;  // For .Include() and .ThenInclude()
using Microsoft.IdentityModel.Tokens; // For defining security keys and signing credentials when generating JWT tokens    
using System.IdentityModel.Tokens.Jwt; // For creating and writing JWT tokens
using System.Security.Claims; // For defining claims inside the JWT token,Claims = user info + permissions stored in the token, which can be read and verified by the server on subsequent requests
using System.Text; // For encoding the secret key when generating JWT tokens
using static ITAMS_GME_BACKEND.DTOs.AuthDTOs;

namespace ITAMS_GME_BACKEND.Services
{
    public class AuthService
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;
        private readonly AuditLogService _auditLog;

        public AuthService(AppDbContext db, IConfiguration config, AuditLogService auditLog)
        {
            _db = db;
            _config = config;
            _auditLog = auditLog;
        }

        // ── Login ─────────────────────────────────────────────────
        public async Task<LoginResponseDto?> LoginAsync(
            LoginRequestDto request, string? ipAddress = null)
        {
            // Find user by email, include Role and Permissions
            var user = await _db.Users
                .Include(u => u.Role)
                .Include(u => u.UserPermissions)
                    .ThenInclude(up => up.Permission)
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

            if (user == null) return null;

            // Verify password against stored hash
            bool isValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            if (!isValid) return null;

            // Build permission list: ["Assets:Read", "Assets:Create", ...]
            var permissions = user.UserPermissions
                .Select(up => $"{up.Permission.Module}:{up.Permission.Action}")
                .ToList();

            // Generate JWT token
            var token = GenerateJwtToken(user, permissions);

            // Log login action — records who logged in and from which IP
            await _auditLog.LogLoginAsync(user.Id, ipAddress);

            return new LoginResponseDto
            {
                Token = token,
                User = new UserInfoDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    Username = user.Username,
                    Role = user.Role.Name,
                    Permissions = permissions,
                }
            };
        }

        // ── JWT Generation ────────────────────────────────────────
        private string GenerateJwtToken(User user, List<string> permissions)
        {
            var jwtSettings = _config.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"]!;
            var issuer = jwtSettings["Issuer"]!;
            var audience = jwtSettings["Audience"]!;
            var expireHours = int.Parse(jwtSettings["ExpireHours"] ?? "24");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // Build claims stored inside the token
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email,          user.Email),
                new Claim(ClaimTypes.Name,           user.FullName),
                new Claim("username",                user.Username),
                new Claim(ClaimTypes.Role,           user.Role.Name),
                new Claim("tokenVersion",            user.TokenVersion.ToString()),
            };

            // Add each permission as a separate claim
            foreach (var perm in permissions)
                claims.Add(new Claim("permission", perm));

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(expireHours),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // ── Password Helper ───────────────────────────────────────
        // Use this when creating users to hash their password
        public static string HashPassword(string plainPassword)
        {
            return BCrypt.Net.BCrypt.HashPassword(plainPassword);
        }
    }
}