using ITAMS_GME_BACKEND.Attributes;
using ITAMS_GME_BACKEND.DTOs;
using ITAMS_GME_BACKEND.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ITAMS_GME_BACKEND.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize] // All endpoints require JWT token
    public class UserController : ControllerBase
    {
        private readonly UserService _userService;

        public UserController(UserService userService)
        {
            _userService = userService;
        }

        // Helper — get current logged in user ID from JWT token
        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(claim ?? "0");
        }

        // GET api/users?search=john&roleId=1&isActive=true&page=1&pageSize=10
        [HttpGet]
        [RequirePermission("Users", "Read")]
        public async Task<IActionResult> GetUsers([FromQuery] UserQueryDto query)
        {
            var result = await _userService.GetUsersAsync(query);
            return Ok(result);
        }

        // GET api/users/{id}
        [HttpGet("{id}")]
        [RequirePermission("Users", "Read")]
        public async Task<IActionResult> GetUser(int id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found." });

            return Ok(user);
        }

        // POST api/users
        [HttpPost]
        [RequirePermission("Users", "Create")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
        {
            // Basic validation
            if (string.IsNullOrWhiteSpace(dto.FullName) ||
                string.IsNullOrWhiteSpace(dto.Email) ||
                string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { message = "Full name, email and password are required." });
            }

            try
            {
                var user = await _userService.CreateUserAsync(dto, GetCurrentUserId());
                return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
            }
            catch (InvalidOperationException ex)
            {
                // Email or username already exists
                return Conflict(new { message = ex.Message });
            }
        }

        // PUT api/users/{id}
        [HttpPut("{id}")]
        [RequirePermission("Users", "Update")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto dto)
        {
            // Basic validation
            if (string.IsNullOrWhiteSpace(dto.FullName) ||
                string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { message = "Full name and email are required." });
            }

            try
            {
                var user = await _userService.UpdateUserAsync(id, dto, GetCurrentUserId());
                if (user == null)
                    return NotFound(new { message = "User not found." });

                return Ok(user);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        // DELETE api/users/{id}
        [HttpDelete("{id}")]
        [RequirePermission("Users", "Delete")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var success = await _userService.DeleteUserAsync(id, GetCurrentUserId());
            if (!success)
                return NotFound(new { message = "User not found." });

            return Ok(new { message = "User deleted successfully." });
        }

        // GET api/users/roles — for role dropdown in create/edit form
        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _userService.GetRolesAsync();
            return Ok(roles);
        }

        // GET api/users/permissions — for permission checkboxes
        [HttpGet("permissions")]
        public async Task<IActionResult> GetPermissions()
        {
            var permissions = await _userService.GetPermissionsAsync();
            return Ok(permissions);
        }
    }
}