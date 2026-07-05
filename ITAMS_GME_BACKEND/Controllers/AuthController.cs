using ITAMS_GME_BACKEND.DTOs;
using ITAMS_GME_BACKEND.Services;
using Microsoft.AspNetCore.Mvc;
using static ITAMS_GME_BACKEND.DTOs.AuthDTOs;

namespace ITAMS_GME_BACKEND.Controllers
{
    // Step 1: Define what this controller does
    // - Handle login → POST /api/auth/login
    // - Handle logout → POST /api/auth/logout

    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        // Step 2: Declare dependencies
        // - AuthService handles all business logic (DB query, BCrypt, JWT)
        // - Controller only receives request and returns response
        private readonly AuthService _authService;

        // Step 3: Inject AuthService via constructor
        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        // Step 4: Write the login endpoint skeleton first, then fill in logic
        // POST api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            // Step 5: Handle easiest error first — missing input
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Email and password are required." });
            }

            // Get client IP address
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

            // Step 6: Pass to AuthService — controller does NOT handle business logic
            var result = await _authService.LoginAsync(request,ipAddress);

            // Step 7: Handle result — null means wrong credentials or inactive user
            if (result == null)
                return Unauthorized(new { message = "Invalid email or password." });

            // Step 8: Return token + user info to frontend
            return Ok(result);
        }

        // POST api/auth/logout
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // JWT is stateless — actual logout is handled on frontend by removing token
            // This endpoint exists as a hook for future refresh token blacklisting
            return Ok(new { message = "Logged out successfully." });
        }

        
    }

}
