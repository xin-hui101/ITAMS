using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ITAMS_GME_BACKEND.Data;

namespace ITAMS_GME_BACKEND.Attributes
{
    // Custom attribute to check if user has required permission
    // Usage: [RequirePermission("Users", "Delete")]
    public class RequirePermissionAttribute : TypeFilterAttribute
    {
        public RequirePermissionAttribute(string module, string action)
            : base(typeof(PermissionFilter))
        {
            Arguments = new object[] { module, action };
        }
    }

    // The actual filter that runs on every request with this attribute
    public class PermissionFilter : IAsyncAuthorizationFilter
    {
        private readonly string _module;
        private readonly string _action;
        private readonly AppDbContext _db;

        public PermissionFilter(string module, string action, AppDbContext db)
        {
            _module = module;
            _action = action;
            _db = db;
        }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var user = context.HttpContext.User;

            // Get user ID and token version from JWT claims
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var tokenVersionClaim = user.FindFirst("tokenVersion")?.Value;

            if (userIdClaim == null || tokenVersionClaim == null)
            {
                context.Result = new UnauthorizedObjectResult(new { message = "Invalid token." });
                return;
            }

            var userId = int.Parse(userIdClaim);
            var tokenVersion = int.Parse(tokenVersionClaim);

            // Check current token version against database — if mismatched,
            // the user's permissions were changed and the token is now stale
            var currentVersion = await _db.Users
                .Where(u => u.Id == userId)
                .Select(u => u.TokenVersion)
                .FirstOrDefaultAsync();

            if (currentVersion != tokenVersion)
            {
                context.Result = new ObjectResult(new
                {
                    message = "Your permissions have changed. Please log in again."
                })
                {
                    StatusCode = 401
                };
                return;
            }

            // Get all permission claims from JWT token
            var permissions = user
                .FindAll("permission")
                .Select(c => c.Value)
                .ToList();

            // Check if user has required permission e.g. "Users:Delete"
            var required = $"{_module}:{_action}";

            if (!permissions.Contains(required))
            {
                context.Result = new ObjectResult(new
                {
                    message = $"You do not have permission to perform this action. Required: {required}"
                })
                {
                    StatusCode = 403 // Forbidden
                };
            }
        }
    }
}