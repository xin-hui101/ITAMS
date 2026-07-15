using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using ITAMS_GME_BACKEND.Data;
using ITAMS_GME_BACKEND.DTOs;
using ITAMS_GME_BACKEND.Models;

namespace ITAMS_GME_BACKEND.Services
{
    public class AssetService
    {
        private readonly AppDbContext _db;
        private readonly CategoryService _categoryService;
        private readonly AuditLogService _auditLog;

        public AssetService(AppDbContext db, CategoryService categoryService, AuditLogService auditLog)
        {
            _db = db;
            _categoryService = categoryService;
            _auditLog = auditLog;
        }

        // ── Get All Assets (paginated + search + filter) ──────────
        public async Task<PaginatedResult<AssetListDto>> GetAssetsAsync(AssetQueryDto query)
        {

            // 临时加在 var q = 之后
var testAssets = await _db.Assets
    .Where(a => a.CategoryId == 24)
    .Select(a => new { a.Id, a.AssetTag, a.Status })
    .ToListAsync();
            var q = _db.Assets.AsNoTracking().AsQueryable();

            // Search by name, asset tag, brand, model
            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var search = query.Search.ToLower();
                q = q.Where(a =>
                    (a.Name != null && a.Name.ToLower().Contains(search)) ||
                    a.AssetTag.ToLower().Contains(search) ||
                    (a.Brand != null && a.Brand.ToLower().Contains(search)) ||
                    (a.Model != null && a.Model.ToLower().Contains(search))
                );
            }

            // Filter by category
            if (query.CategoryId.HasValue)
                q = q.Where(a => a.CategoryId == query.CategoryId.Value);

            // Filter by status
            if (!string.IsNullOrWhiteSpace(query.Status))
                q = q.Where(a => a.Status == query.Status);

            var total = await q.CountAsync();

            // Step 1: Load assets (no Include)
            var orderedQ = query.SortField switch
            {
                "assetTag" => query.SortOrder == "asc" ? q.OrderBy(a => a.AssetTag) : q.OrderByDescending(a => a.AssetTag),
                "name" => query.SortOrder == "asc" ? q.OrderBy(a => a.Name) : q.OrderByDescending(a => a.Name),
                "status" => query.SortOrder == "asc" ? q.OrderBy(a => a.Status) : q.OrderByDescending(a => a.Status),
                "location" => query.SortOrder == "asc" ? q.OrderBy(a => a.Location) : q.OrderByDescending(a => a.Location),
                "warrantyExpiry" => query.SortOrder == "asc" ? q.OrderBy(a => a.WarrantyExpiry) : q.OrderByDescending(a => a.WarrantyExpiry),
                "purchasePrice" => query.SortOrder == "asc" ? q.OrderBy(a => a.PurchasePrice) : q.OrderByDescending(a => a.PurchasePrice),
                _ => q.OrderByDescending(a => a.CreatedAt),
            };

            var rawAssets = await orderedQ
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            // Step 2: Load categories manually
            var categoryIds = rawAssets.Select(a => a.CategoryId).Distinct().ToList();
            var categories = await _db.Categories
                .Where(c => categoryIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id);

            // Step 3: Load asset field values manually
            var assetIds = rawAssets.Select(a => a.Id).ToList();
            var fieldValues = await _db.AssetFieldValues
                .Where(fv => assetIds.Contains(fv.AssetId))
                .ToListAsync();

            // Step 4: Load category fields manually
            var cfIds = fieldValues.Select(fv => fv.CategoryFieldId).Distinct().ToList();
            var categoryFields = cfIds.Any()
                ? await _db.CategoryFields
                    .Where(cf => cfIds.Contains(cf.Id))
                    .ToDictionaryAsync(cf => cf.Id)
                : new Dictionary<int, CategoryField>();

            // Step 5: Map to DTOs in memory
            var assets = rawAssets.Select(a => new AssetListDto
            {
                Id = a.Id,
                AssetTag = a.AssetTag,
                Name = a.Name,
                Category = categories.ContainsKey(a.CategoryId) ? categories[a.CategoryId].Name : "",
                CategoryId = a.CategoryId,
                Status = a.Status,
                SerialNumber = a.SerialNumber,  
                Brand = a.Brand,
                Model = a.Model,
                Location = a.Location,
                PurchasePrice = a.PurchasePrice,
                PurchaseDate = a.PurchaseDate,
                WarrantyExpiry = a.WarrantyExpiry,
                CreatedAt = a.CreatedAt,
                CustomFields = fieldValues
                    .Where(fv => fv.AssetId == a.Id
                              && categoryFields.ContainsKey(fv.CategoryFieldId)
                              && categoryFields[fv.CategoryFieldId].ShowInTable)
                    .Select(fv => new AssetTableFieldDto
                    {
                        FieldKey = categoryFields[fv.CategoryFieldId].FieldKey,
                        FieldLabel = categoryFields[fv.CategoryFieldId].FieldLabel,
                        Value = fv.ValueText
                                  ?? fv.ValueNumber?.ToString()
                                  ?? fv.ValueDate?.ToString("dd MMM yyyy")
                                  ?? "—",
                    })
                    .ToList(),
            }).ToList();

            return new PaginatedResult<AssetListDto>
            {
                Data = assets,
                Total = total,
                Page = query.Page,
                PageSize = query.PageSize,
                TotalPages = (int)Math.Ceiling(total / (double)query.PageSize),
            };
        }

        // ── Get Asset Stats (for KPI cards) ────────────────────────────
        public async Task<AssetStatsDto> GetStatsAsync(int? categoryId = null)
        {
            var assetsQuery = _db.Assets.AsQueryable();

            if (categoryId.HasValue)
                assetsQuery = assetsQuery.Where(a => a.CategoryId == categoryId.Value);

            var totalAssets = await assetsQuery.CountAsync();

            var activeCount = await assetsQuery.CountAsync(a => a.Status == "Active");
            var inactiveCount = await assetsQuery.CountAsync(a => a.Status == "Inactive");
            var maintenanceCount = await assetsQuery.CountAsync(a => a.Status == "Under Maintenance");
            var disposeCount = await assetsQuery.CountAsync(a => a.Status == "Dispose");

            var totalValue = await assetsQuery.SumAsync(a => a.PurchasePrice ?? 0);

            var totalCategories = categoryId.HasValue
                ? 0
                : await _db.Categories.CountAsync();

            return new AssetStatsDto
            {
                TotalCategories = totalCategories,
                TotalAssets = totalAssets,
                ActiveCount = activeCount,
                InactiveCount = inactiveCount,
                UnderMaintenanceCount = maintenanceCount,
                DisposeCount = disposeCount,
                TotalValue = totalValue,
            };
        }

        // ── Get Asset Detail ──────────────────────────────────────
        public async Task<AssetDetailDto?> GetAssetByIdAsync(int id)
        {
            var asset = await _db.Assets
                .Include(a => a.Category)
                .Include(a => a.AssetFieldValues)
                    .ThenInclude(afv => afv.CategoryField)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (asset == null) return null;

            return new AssetDetailDto
            {
                Id = asset.Id,
                AssetTag = asset.AssetTag,
                Name = asset.Name,
                CategoryId = asset.CategoryId,
                Category = asset.Category.Name,
                Status = asset.Status,
                SerialNumber = asset.SerialNumber,
                Brand = asset.Brand,
                Model = asset.Model,
                PurchasePrice = asset.PurchasePrice,
                PurchaseDate = asset.PurchaseDate,
                WarrantyExpiry = asset.WarrantyExpiry,
                Location = asset.Location,
                Notes = asset.Notes,
                CreatedAt = asset.CreatedAt,
                UpdatedAt = asset.UpdatedAt,
                CustomFields = asset.AssetFieldValues
                    .Where(afv => afv.CategoryField != null)
                    .OrderBy(afv => afv.CategoryField.SortOrder)
                    .Select(afv => new AssetFieldValueDto
                    {
                        CategoryFieldId = afv.CategoryFieldId,
                        FieldKey = afv.FieldKey,
                        FieldLabel = afv.CategoryField.FieldLabel,
                        FieldType = afv.CategoryField.FieldType,
                        ValueText = afv.ValueText,
                        ValueNumber = afv.ValueNumber,
                        ValueDate = afv.ValueDate,
                    })
                    .ToList(),
            };
        }

        // ── Get distinct field values for autocomplete ────────────────
        public async Task<List<string>> GetFieldValuesAsync(
            string fieldKey, string? search, int? categoryId)
        {
            IQueryable<string?> query;

            if (fieldKey is "name" or "brand" or "model" or "location" or "serialNumber")
            {
                var assetsQuery = _db.Assets.AsQueryable();

                if (categoryId.HasValue)
                    assetsQuery = assetsQuery.Where(a => a.CategoryId == categoryId.Value);

                query = fieldKey switch
                {
                    "name" => assetsQuery.Select(a => (string?)a.Name),
                    "brand" => assetsQuery.Select(a => a.Brand),
                    "model" => assetsQuery.Select(a => a.Model),
                    "location" => assetsQuery.Select(a => a.Location),
                    "serialNumber" => assetsQuery.Select(a => a.SerialNumber),
                    _ => assetsQuery.Select(a => (string?)a.Name),
                };
            }
            else
            {
                var customQuery = _db.AssetFieldValues
                    .Where(fv => fv.CategoryField.FieldKey == fieldKey);

                if (categoryId.HasValue)
                    customQuery = customQuery.Where(fv => fv.Asset.CategoryId == categoryId.Value);

                query = customQuery.Select(fv => fv.ValueText);
            }

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(v => v != null && v.ToLower().Contains(search.ToLower()));

            return await query
                .Where(v => v != null && v != "")
                .Distinct()
                .OrderBy(v => v)
                .Take(10)
                .Select(v => v!)
                .ToListAsync();
        }

        // ── Create Asset ──────────────────────────────────────────
        public async Task<AssetDetailDto> CreateAssetAsync(CreateAssetDto dto, int createdByUserId)
        {
            var assetTag = await _categoryService.GenerateNextAssetIdAsync(dto.CategoryId);

            if (!string.IsNullOrWhiteSpace(dto.SerialNumber) &&
                await _db.Assets.AnyAsync(a => a.SerialNumber == dto.SerialNumber))
            {
                throw new InvalidOperationException("Serial number already exists.");
            }

            var asset = new Asset
            {
                CategoryId = dto.CategoryId,
                AssetTag = assetTag,
                Name = dto.Name,
                Status = dto.Status,
                SerialNumber = dto.SerialNumber,
                Brand = dto.Brand,
                Model = dto.Model,
                PurchasePrice = dto.PurchasePrice,
                PurchaseDate = dto.PurchaseDate,
                WarrantyExpiry = dto.WarrantyExpiry,
                Location = dto.Location,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _db.Assets.Add(asset);
            await _db.SaveChangesAsync();

            if (dto.CustomFields.Any())
            {
                var fieldValues = dto.CustomFields
                    .Where(f => f.ValueText != null || f.ValueNumber != null || f.ValueDate != null)
                    .Select(f => new AssetFieldValue
                    {
                        AssetId = asset.Id,
                        CategoryFieldId = f.CategoryFieldId,
                        FieldKey = f.FieldKey,
                        ValueText = f.ValueText,
                        ValueNumber = f.ValueNumber,
                        ValueDate = f.ValueDate,
                        CreatedAt = DateTime.UtcNow,
                    }).ToList();

                _db.AssetFieldValues.AddRange(fieldValues);

                asset.CustomFieldsJson = JsonSerializer.Serialize(
                    dto.CustomFields.ToDictionary(f => f.FieldKey, f =>
                        f.ValueText ?? f.ValueNumber?.ToString() ?? f.ValueDate?.ToString("yyyy-MM-dd"))
                );

                await _db.SaveChangesAsync();
            }

            await _auditLog.LogCreateAsync(
                createdByUserId, "Assets", "Asset", asset.Id,
                new { asset.AssetTag, asset.Name, asset.Status });

            return (await GetAssetByIdAsync(asset.Id))!;
        }

        // ── Update Asset ──────────────────────────────────────────
        public async Task<AssetDetailDto?> UpdateAssetAsync(int id, UpdateAssetDto dto, int updatedByUserId)
        {
            var asset = await _db.Assets
                .Include(a => a.AssetFieldValues)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (asset == null) return null;

            if (!string.IsNullOrWhiteSpace(dto.SerialNumber) &&
                await _db.Assets.AnyAsync(a => a.SerialNumber == dto.SerialNumber && a.Id != id))
            {
                throw new InvalidOperationException("Serial number already exists.");
            }

            var oldValues = new { asset.Name, asset.Status, asset.Location };

            asset.Name = dto.Name;
            asset.Status = dto.Status;
            asset.SerialNumber = dto.SerialNumber;
            asset.Brand = dto.Brand;
            asset.Model = dto.Model;
            asset.PurchasePrice = dto.PurchasePrice;
            asset.PurchaseDate = dto.PurchaseDate;
            asset.WarrantyExpiry = dto.WarrantyExpiry;
            asset.Location = dto.Location;
            asset.Notes = dto.Notes;
            asset.UpdatedAt = DateTime.UtcNow;

            _db.AssetFieldValues.RemoveRange(asset.AssetFieldValues);

            if (dto.CustomFields.Any())
            {
                var fieldValues = dto.CustomFields
                    .Where(f => f.ValueText != null || f.ValueNumber != null || f.ValueDate != null)
                    .Select(f => new AssetFieldValue
                    {
                        AssetId = asset.Id,
                        CategoryFieldId = f.CategoryFieldId,
                        FieldKey = f.FieldKey,
                        ValueText = f.ValueText,
                        ValueNumber = f.ValueNumber,
                        ValueDate = f.ValueDate,
                        CreatedAt = DateTime.UtcNow,
                    }).ToList();

                _db.AssetFieldValues.AddRange(fieldValues);

                asset.CustomFieldsJson = JsonSerializer.Serialize(
                    dto.CustomFields.ToDictionary(f => f.FieldKey, f =>
                        f.ValueText ?? f.ValueNumber?.ToString() ?? f.ValueDate?.ToString("yyyy-MM-dd"))
                );
            }
            else
            {
                asset.CustomFieldsJson = null;
            }

            await _db.SaveChangesAsync();

            await _auditLog.LogUpdateAsync(
                updatedByUserId, "Assets", "Asset", id,
                oldValues,
                new { asset.Name, asset.Status, asset.Location });

            return await GetAssetByIdAsync(id);
        }

        // ── Delete Asset ──────────────────────────────────────────
        public async Task<bool> DeleteAssetAsync(int id, int deletedByUserId)
        {
            var asset = await _db.Assets
                .Include(a => a.MaintenanceRecords)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (asset == null) return false;

            if (asset.MaintenanceRecords.Any())
                throw new InvalidOperationException(
                    "Cannot delete asset that has maintenance records.");

            var oldValues = new { asset.AssetTag, asset.Name, asset.Status };

            _db.Assets.Remove(asset);
            await _db.SaveChangesAsync();

            await _auditLog.LogDeleteAsync(
                deletedByUserId, "Assets", "Asset", id, oldValues);

            return true;
        }
    }
}