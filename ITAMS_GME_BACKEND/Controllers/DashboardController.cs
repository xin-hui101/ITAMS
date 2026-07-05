using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ITAMS_GME_BACKEND.Services;

namespace ITAMS_GME_BACKEND.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly DashboardService _dashboardService;

        public DashboardController(DashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        // GET api/dashboard — returns data based on current user's permissions
        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            // Extract all permission claims from JWT token
            var permissions = User
                .FindAll("permission")
                .Select(c => c.Value)
                .ToList();

            var dashboard = await _dashboardService.GetDashboardAsync(permissions);
            return Ok(dashboard);
        }
    }
}