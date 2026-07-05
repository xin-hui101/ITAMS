using ITAMS_GME_BACKEND.Attributes;
using ITAMS_GME_BACKEND.DTOs;
using ITAMS_GME_BACKEND.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ITAMS_GME_BACKEND.Controllers
{
    [ApiController]
    [Route("api/categories")]
    [Authorize]
    public class CategoryController : ControllerBase
    {
        private readonly CategoryService _categoryService;

        public CategoryController(CategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        // Helper — get current logged in user ID from JWT token
        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(claim ?? "0");
        }

        // GET api/categories?search=laptop&page=1&pageSize=10
        [HttpGet]
        [RequirePermission("Categories", "Read")]
        public async Task<IActionResult> GetCategories([FromQuery] CategoryQueryDto query)
        {
            var result = await _categoryService.GetCategoriesAsync(query);
            return Ok(result);
        }

        // GET api/categories/all — for dropdown list
        [HttpGet("all")]
        public async Task<IActionResult> GetAllCategories()
        {
            var result = await _categoryService.GetAllCategoriesAsync();
            return Ok(result);
        }

        // GET api/categories/{id}
        [HttpGet("{id}")]
        [RequirePermission("Categories", "Read")]
        public async Task<IActionResult> GetCategory(int id)
        {
            var category = await _categoryService.GetCategoryByIdAsync(id);
            if (category == null)
                return NotFound(new { message = "Category not found." });

            return Ok(category);
        }

        // POST api/categories
        [HttpPost]
        [RequirePermission("Categories", "Create")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Category name is required." });

            try
            {
                var userId = GetCurrentUserId();
                var category = await _categoryService.CreateCategoryAsync(dto, userId);
                return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        // PUT api/categories/{id}
        [HttpPut("{id}")]
        [RequirePermission("Categories", "Update")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] UpdateCategoryDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Category name is required." });

            try
            {
                var category = await _categoryService.UpdateCategoryAsync(id, dto, GetCurrentUserId());
                if (category == null)
                    return NotFound(new { message = "Category not found." });

                return Ok(category);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        // DELETE api/categories/{id}
        [HttpDelete("{id}")]
        [RequirePermission("Categories", "Delete")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            try
            {
                var success = await _categoryService.DeleteCategoryAsync(id, GetCurrentUserId());
                if (!success)
                    return NotFound(new { message = "Category not found." });

                return Ok(new { message = "Category deleted successfully." });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }
    }
}