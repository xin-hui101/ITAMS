using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ITAMS_GME_BACKEND.DTOs;
using ITAMS_GME_BACKEND.Services;
using ITAMS_GME_BACKEND.Attributes;

namespace ITAMS_GME_BACKEND.Controllers
{
    [ApiController]
    [Route("api/assets")]
    [Authorize]
    public class AssetController : ControllerBase
    {
        private readonly AssetService _assetService;

        public AssetController(AssetService assetService)
        {
            _assetService = assetService;
        }

        // Helper — get current logged in user ID from JWT token
        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(claim ?? "0");
        }

        // GET api/assets?search=laptop&categoryId=1&status=Active&page=1&pageSize=10
        [HttpGet]
        [RequirePermission("Assets", "Read")]
        public async Task<IActionResult> GetAssets([FromQuery] AssetQueryDto query)
        {
            var result = await _assetService.GetAssetsAsync(query);
            return Ok(result);
        }

        // GET api/assets/stats?categoryId=1 — for KPI cards
        [HttpGet("stats")]
        [RequirePermission("Assets", "Read")]
        public async Task<IActionResult> GetStats([FromQuery] int? categoryId)
        {
            var stats = await _assetService.GetStatsAsync(categoryId);
            return Ok(stats);
        }

        // GET api/assets/{id}
        [HttpGet("{id}")]
        [RequirePermission("Assets", "Read")]
        public async Task<IActionResult> GetAsset(int id)
        {
            var asset = await _assetService.GetAssetByIdAsync(id);
            if (asset == null)
                return NotFound(new { message = "Asset not found." });

            return Ok(asset);
        }

        // POST api/assets
        [HttpPost]
        [RequirePermission("Assets", "Create")]
        public async Task<IActionResult> CreateAsset([FromBody] CreateAssetDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Asset name is required." });

            if (dto.CategoryId == 0)
                return BadRequest(new { message = "Category is required." });

            try
            {
                var asset = await _assetService.CreateAssetAsync(dto, GetCurrentUserId());
                return CreatedAtAction(nameof(GetAsset), new { id = asset.Id }, asset);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        // PUT api/assets/{id}
        [HttpPut("{id}")]
        [RequirePermission("Assets", "Update")]
        public async Task<IActionResult> UpdateAsset(int id, [FromBody] UpdateAssetDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Asset name is required." });

            try
            {
                var asset = await _assetService.UpdateAssetAsync(id, dto, GetCurrentUserId());
                if (asset == null)
                    return NotFound(new { message = "Asset not found." });

                return Ok(asset);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        // DELETE api/assets/{id}
        [HttpDelete("{id}")]
        [RequirePermission("Assets", "Delete")]
        public async Task<IActionResult> DeleteAsset(int id)
        {
            try
            {
                var success = await _assetService.DeleteAssetAsync(id, GetCurrentUserId());
                if (!success)
                    return NotFound(new { message = "Asset not found." });

                return Ok(new { message = "Asset deleted successfully." });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        // GET api/assets/field-values?fieldKey=brand&search=mic
        // Returns distinct values for autocomplete suggestions
        [HttpGet("field-values")]
        [RequirePermission("Assets", "Read")]
        public async Task<IActionResult> GetFieldValues(
            [FromQuery] string fieldKey,
            [FromQuery] string? search,
            [FromQuery] int? categoryId)
        {
            var result = await _assetService.GetFieldValuesAsync(fieldKey, search, categoryId);
            return Ok(result);
        }
    }
}