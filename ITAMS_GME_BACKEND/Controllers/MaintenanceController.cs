using ITAMS_GME_BACKEND.Attributes;
using ITAMS_GME_BACKEND.DTOs;
using ITAMS_GME_BACKEND.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ITAMS_GME_BACKEND.Controllers
{
    [ApiController]
    [Route("api/maintenance")]
    [Authorize]
    public class MaintenanceController : ControllerBase
    {
        private readonly MaintenanceService _maintenanceService;

        public MaintenanceController(MaintenanceService maintenanceService)
        {
            _maintenanceService = maintenanceService;
        }

        // Helper — get current logged in user ID from JWT token
        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(claim ?? "0");
        }

        // GET api/maintenance?search=&status=&type=&assetId=&page=1&pageSize=10
        [HttpGet]
        [RequirePermission("Maintenance", "Read")]
        public async Task<IActionResult> GetMaintenance([FromQuery] MaintenanceQueryDto query)
        {
            var userId = GetCurrentUserId();
            var result = await _maintenanceService.GetMaintenanceAsync(query, userId);
            return Ok(result);
        }

        // GET api/maintenance/stats — for KPI cards
        [HttpGet("stats")]
        [RequirePermission("Maintenance", "Read")]
        public async Task<IActionResult> GetStats()
        {
            var stats = await _maintenanceService.GetStatsAsync();
            return Ok(stats);
        }

        // GET api/maintenance/{id}
        [HttpGet("{id}")]
        [RequirePermission("Maintenance", "Read")]
        public async Task<IActionResult> GetMaintenanceById(int id)
        {
            var record = await _maintenanceService.GetMaintenanceByIdAsync(id);
            if (record == null)
                return NotFound(new { message = "Maintenance record not found." });

            return Ok(record);
        }

        // POST api/maintenance
        [HttpPost]
        [RequirePermission("Maintenance", "Create")]
        public async Task<IActionResult> CreateMaintenance([FromBody] CreateMaintenanceDto dto)
        {
            if (dto.AssetId == 0)
                return BadRequest(new { message = "Asset is required." });

            if (string.IsNullOrWhiteSpace(dto.Type))
                return BadRequest(new { message = "Type is required." });

            if (string.IsNullOrWhiteSpace(dto.Description))
                return BadRequest(new { message = "Description is required." });

            try
            {
                var userId = GetCurrentUserId();
                var record = await _maintenanceService.CreateMaintenanceAsync(dto, userId);
                return CreatedAtAction(nameof(GetMaintenanceById), new { id = record.Id }, record);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // PUT api/maintenance/{id}
        [HttpPut("{id}")]
        [RequirePermission("Maintenance", "Update")]
        public async Task<IActionResult> UpdateMaintenance(int id, [FromBody] UpdateMaintenanceDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Type))
                return BadRequest(new { message = "Type is required." });

            if (string.IsNullOrWhiteSpace(dto.Description))
                return BadRequest(new { message = "Description is required." });

            var record = await _maintenanceService.UpdateMaintenanceAsync(id, dto, GetCurrentUserId());
            if (record == null)
                return NotFound(new { message = "Maintenance record not found." });

            return Ok(record);
        }

        // DELETE api/maintenance/{id}
        [HttpDelete("{id}")]
        [RequirePermission("Maintenance", "Delete")]
        public async Task<IActionResult> DeleteMaintenance(int id)
        {
            var success = await _maintenanceService.DeleteMaintenanceAsync(id, GetCurrentUserId());
            if (!success)
                return NotFound(new { message = "Maintenance record not found." });

            return Ok(new { message = "Maintenance record deleted successfully." });
        }
    }
}