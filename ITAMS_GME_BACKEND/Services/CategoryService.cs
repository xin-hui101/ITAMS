using Microsoft.EntityFrameworkCore;
using ITAMS_GME_BACKEND.Data;
using ITAMS_GME_BACKEND.DTOs;
using ITAMS_GME_BACKEND.Models;

namespace ITAMS_GME_BACKEND.Services
{
    public class CategoryService
    {
        private readonly AppDbContext _db;
        private readonly AuditLogService _auditLog;

        public CategoryService(AppDbContext db, AuditLogService auditLog)
        {
            _db = db;
            _auditLog = auditLog;
        }

        // ── Auto generate CategoryCode e.g. C01, C02 ─────────────
        private async Task<string> GenerateCategoryCodeAsync()
        {
            // Get the highest existing code number
            var codes = await _db.Categories
                .Select(c => c.CategoryCode)
                .ToListAsync();

            int maxNumber = 0;
            foreach (var code in codes)
            {
                // Extract number from code e.g. "C01" → 1
                if (code.StartsWith("C") && int.TryParse(code[1..], out int num))
                    maxNumber = Math.Max(maxNumber, num);
            }

            // Generate next code e.g. C01, C02, C10, C99
            return $"C{(maxNumber + 1):D2}";
        }

        // ── Generate next Asset ID from prefix ────────────────────
        public async Task<string> GenerateNextAssetIdAsync(int categoryId)
        {
            var category = await _db.Categories
                .FirstOrDefaultAsync(c => c.Id == categoryId);

            if (category == null)
                throw new InvalidOperationException("Category not found.");

            // Count existing assets in this category
            var assetCount = await _db.Assets
                .CountAsync(a => a.CategoryId == categoryId);

            // Extract prefix and base number from AssetPrefix
            // e.g. "NF-000" → prefix = "NF-", digits = 3, base = 0
            var prefix = category.AssetPrefix;

            // Find where numbers start (last non-digit before trailing digits)
            int splitIndex = prefix.Length;
            while (splitIndex > 0 && char.IsDigit(prefix[splitIndex - 1]))
                splitIndex--;

            var textPart = prefix[..splitIndex];  // e.g. "NF-"
            var numberPart = prefix[splitIndex..];  // e.g. "000"
            var digits = numberPart.Length;     // e.g. 3

            // Next number = base number + asset count + 1
            int baseNumber = int.Parse(numberPart);
            int nextNumber = baseNumber + assetCount + 1;
            string nextId = $"{textPart}{nextNumber.ToString($"D{digits}")}";

            return nextId;
        }

        // ── Get All Categories (paginated + search) ───────────────
        public async Task<PaginatedResult<CategoryListDto>> GetCategoriesAsync(CategoryQueryDto query)
        {
            var q = _db.Categories
                .Include(c => c.CreatedByUser)
                .Include(c => c.Assets)
                .Include(c => c.CategoryFields)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var search = query.Search.ToLower();
                q = q.Where(c =>
                    c.Name.ToLower().Contains(search) ||
                    c.CategoryCode.ToLower().Contains(search) ||
                    c.AssetPrefix.ToLower().Contains(search)
                );
            }

            var total = await q.CountAsync();

            var categories = await q
                .OrderBy(c => c.CategoryCode)
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(c => new CategoryListDto
                {
                    Id = c.Id,
                    CategoryCode = c.CategoryCode,
                    Name = c.Name,
                    AssetPrefix = c.AssetPrefix,
                    Description = c.Description,
                    Icon = c.Icon,
                    AssetCount = c.Assets.Count,
                    FixedFieldsConfig = c.FixedFieldsConfig,
                    FieldCount = c.CategoryFields.Count,
                    CreatedAt = c.CreatedAt,
                    CreatedBy = c.CreatedByUser.FullName,
                })
                .ToListAsync();

            return new PaginatedResult<CategoryListDto>
            {
                Data = categories,
                Total = total,
                Page = query.Page,
                PageSize = query.PageSize,
                TotalPages = (int)Math.Ceiling(total / (double)query.PageSize),
            };
        }

        // ── Get Category Detail ───────────────────────────────────
        public async Task<CategoryDetailDto?> GetCategoryByIdAsync(int id)
        {
            var category = await _db.Categories
                .Include(c => c.CreatedByUser)
                .Include(c => c.CategoryFields)
                .Include(c => c.Assets)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null) return null;

            return new CategoryDetailDto
            {
                Id = category.Id,
                CategoryCode = category.CategoryCode,
                Name = category.Name,
                AssetPrefix = category.AssetPrefix,
                Description = category.Description,
                Icon = category.Icon,
                FixedFieldsConfig = category.FixedFieldsConfig,
                AssetCount = category.Assets.Count,
                CreatedAt = category.CreatedAt,
                CreatedBy = category.CreatedByUser.FullName,
                Fields = category.CategoryFields
                    .OrderBy(f => f.SortOrder)
                    .Select(f => new CategoryFieldDto
                    {
                        Id = f.Id,
                        FieldKey = f.FieldKey,
                        FieldLabel = f.FieldLabel,
                        FieldType = f.FieldType,
                        IsRequired = f.IsRequired,
                        ShowInTable = f.ShowInTable,
                        DefaultValue = f.DefaultValue,
                        SortOrder = f.SortOrder,
                    })
                    .ToList(),
            };
        }

        // ── Create Category ───────────────────────────────────────
        public async Task<CategoryDetailDto> CreateCategoryAsync(CreateCategoryDto dto, int userId)
        {
            // Check duplicate name
            if (await _db.Categories.AnyAsync(c => c.Name == dto.Name))
                throw new InvalidOperationException("Category name already exists.");

            // Check duplicate asset prefix
            if (await _db.Categories.AnyAsync(c => c.AssetPrefix == dto.AssetPrefix))
                throw new InvalidOperationException("Asset prefix already exists.");

            // Auto generate category code
            var categoryCode = await GenerateCategoryCodeAsync();

            var category = new Category
            {
                CategoryCode = categoryCode,
                Name = dto.Name,
                AssetPrefix = dto.AssetPrefix,
                Description = dto.Description,
                Icon = dto.Icon,
                FixedFieldsConfig = dto.FixedFieldsConfig,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow,
            };

            _db.Categories.Add(category);
            await _db.SaveChangesAsync();

            // Add custom fields
            if (dto.Fields.Any())
            {
                var fields = dto.Fields.Select((f, index) => new CategoryField
                {
                    CategoryId = category.Id,
                    FieldKey = f.FieldKey,
                    FieldLabel = f.FieldLabel,
                    FieldType = f.FieldType,
                    IsRequired = f.IsRequired,
                    ShowInTable = f.ShowInTable,
                    DefaultValue = f.DefaultValue,
                    SortOrder = f.SortOrder == 0 ? index : f.SortOrder,
                    CreatedAt = DateTime.UtcNow,
                }).ToList();

                _db.CategoryFields.AddRange(fields);
                await _db.SaveChangesAsync();
            }

            // Log create action — records who created the category and basic info
            await _auditLog.LogCreateAsync(
                userId, "Categories", "Category", category.Id,
                new { category.CategoryCode, category.Name, category.AssetPrefix });

            return (await GetCategoryByIdAsync(category.Id))!;
        }

        // ── Update Category ───────────────────────────────────────
        public async Task<CategoryDetailDto?> UpdateCategoryAsync(
            int id, UpdateCategoryDto dto, int updatedByUserId)
        {
            var category = await _db.Categories
                .Include(c => c.CategoryFields)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null) return null;

            // Check duplicate name — exclude current
            if (await _db.Categories.AnyAsync(c => c.Name == dto.Name && c.Id != id))
                throw new InvalidOperationException("Category name already exists.");

            // Check duplicate prefix — exclude current
            if (await _db.Categories.AnyAsync(c => c.AssetPrefix == dto.AssetPrefix && c.Id != id))
                throw new InvalidOperationException("Asset prefix already exists.");

            // Save old values before updating — for audit log comparison
            var oldValues = new { category.Name, category.Description, category.Icon };

            // Update all fields including Icon and FixedFieldsConfig
            category.Name = dto.Name;
            category.AssetPrefix = dto.AssetPrefix;
            category.Description = dto.Description;
            category.Icon = dto.Icon;
            category.FixedFieldsConfig = dto.FixedFieldsConfig;

            // Diff update custom fields — preserve existing AssetFieldValues
            var existingFields = category.CategoryFields.ToList();
            var newFieldKeys = dto.Fields.Select(f => f.FieldKey).ToList();

            // Only remove fields that are no longer in the new config
            var fieldsToRemove = existingFields
                .Where(f => !newFieldKeys.Contains(f.FieldKey))
                .ToList();

            if (fieldsToRemove.Any())
            {
                var fieldIdsToRemove = fieldsToRemove.Select(f => f.Id).ToList();
                var orphanedValues = await _db.AssetFieldValues
                    .Where(v => fieldIdsToRemove.Contains(v.CategoryFieldId))
                    .ToListAsync();
                _db.AssetFieldValues.RemoveRange(orphanedValues);
                _db.CategoryFields.RemoveRange(fieldsToRemove);
            }

            // Update existing fields or add new ones
            foreach (var dtoField in dto.Fields.Select((f, i) => (f, i)))
            {
                var existing = existingFields.FirstOrDefault(f => f.FieldKey == dtoField.f.FieldKey);
                if (existing != null)
                {
                    existing.FieldLabel = dtoField.f.FieldLabel;
                    existing.FieldType = dtoField.f.FieldType;
                    existing.IsRequired = dtoField.f.IsRequired;
                    existing.ShowInTable = dtoField.f.ShowInTable;
                    existing.DefaultValue = dtoField.f.DefaultValue;
                    existing.SortOrder = dtoField.f.SortOrder == 0 ? dtoField.i : dtoField.f.SortOrder;
                }
                else
                {
                    _db.CategoryFields.Add(new CategoryField
                    {
                        CategoryId = category.Id,
                        FieldKey = dtoField.f.FieldKey,
                        FieldLabel = dtoField.f.FieldLabel,
                        FieldType = dtoField.f.FieldType,
                        IsRequired = dtoField.f.IsRequired,
                        ShowInTable = dtoField.f.ShowInTable,
                        DefaultValue = dtoField.f.DefaultValue,
                        SortOrder = dtoField.f.SortOrder == 0 ? dtoField.i : dtoField.f.SortOrder,
                        CreatedAt = DateTime.UtcNow,
                    });
                }
            }

            await _db.SaveChangesAsync();

            // Log update action — records old and new values for comparison
            await _auditLog.LogUpdateAsync(
                updatedByUserId, "Categories", "Category", id,
                oldValues,
                new { category.Name, category.Description, category.Icon });

            return await GetCategoryByIdAsync(id);
        }

        // ── Delete Category ───────────────────────────────────────
        public async Task<bool> DeleteCategoryAsync(int id, int deletedByUserId)
        {
            var category = await _db.Categories
                .Include(c => c.Assets)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null) return false;

            // Cannot delete if has assets
            if (category.Assets.Any())
                throw new InvalidOperationException(
                    "Cannot delete category that has assets. Remove assets first.");

            // Save old values before deleting — for audit log record
            var oldValues = new { category.CategoryCode, category.Name };

            _db.Categories.Remove(category);
            await _db.SaveChangesAsync();

            // Log delete action — records what was deleted and by whom
            await _auditLog.LogDeleteAsync(
                deletedByUserId, "Categories", "Category", id, oldValues);

            return true;
        }

        // ── Get All for Dropdown ──────────────────────────────────
        public async Task<List<CategoryListDto>> GetAllCategoriesAsync()
        {
            return await _db.Categories
                .OrderBy(c => c.CategoryCode)
                .Select(c => new CategoryListDto
                {
                    Id = c.Id,
                    CategoryCode = c.CategoryCode,
                    Name = c.Name,
                    AssetPrefix = c.AssetPrefix,
                    Icon = c.Icon,
                })
                .ToListAsync();
        }
    }
}