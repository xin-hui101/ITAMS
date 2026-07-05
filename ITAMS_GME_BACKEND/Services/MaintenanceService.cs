using Microsoft.EntityFrameworkCore;
using ITAMS_GME_BACKEND.Data;
using ITAMS_GME_BACKEND.DTOs;
using ITAMS_GME_BACKEND.Models;

namespace ITAMS_GME_BACKEND.Services
{
    public class MaintenanceService
    {
        private readonly AppDbContext _db;
        private readonly AuditLogService _auditLog;

        public MaintenanceService(AppDbContext db, AuditLogService auditLog)
        {
            _db = db;
            _auditLog = auditLog;
        }

        // ── Get Maintenance Stats (for KPI cards) ─────────────────
        public async Task<MaintenanceStatsDto> GetStatsAsync()
        {
            var totalRecords = await _db.MaintenanceRecords.CountAsync();
            var pendingCount = await _db.MaintenanceRecords.CountAsync(m => m.Status == "Pending");
            var inProgressCount = await _db.MaintenanceRecords.CountAsync(m => m.Status == "In Progress");
            var completedCount = await _db.MaintenanceRecords.CountAsync(m => m.Status == "Completed");

            return new MaintenanceStatsDto
            {
                TotalRecords = totalRecords,
                PendingCount = pendingCount,
                InProgressCount = inProgressCount,
                CompletedCount = completedCount,
            };
        }

        // ── Get All Maintenance Records ───────────────────────────
        public async Task<PaginatedResult<MaintenanceListDto>> GetMaintenanceAsync(
            MaintenanceQueryDto query, int userId)
        {
            var q = _db.MaintenanceRecords
                .Include(m => m.Asset)
                    .ThenInclude(a => a.Category)
                .Include(m => m.CreatedByUser)
                .AsQueryable();

            // Search by asset name, tag or technician
            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var search = query.Search.ToLower();
                q = q.Where(m =>
                    m.Asset.Name.ToLower().Contains(search) ||
                    m.Asset.AssetTag.ToLower().Contains(search) ||
                    (m.Technician != null && m.Technician.ToLower().Contains(search))
                );
            }

            // Filter by status
            if (!string.IsNullOrWhiteSpace(query.Status))
                q = q.Where(m => m.Status == query.Status);

            // Filter by type
            if (!string.IsNullOrWhiteSpace(query.Type))
                q = q.Where(m => m.Type == query.Type);

            // Filter by asset
            if (query.AssetId.HasValue)
                q = q.Where(m => m.AssetId == query.AssetId.Value);

            var total = await q.CountAsync();

            var records = await q
                .OrderByDescending(m => m.CreatedAt)
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(m => new MaintenanceListDto
                {
                    Id = m.Id,
                    AssetTag = m.Asset.AssetTag,
                    AssetName = m.Asset.Name,
                    Type = m.Type,
                    Status = m.Status,
                    Description = m.Description,
                    TechnicianOrCompany = m.Technician,
                    Cost = m.Cost,
                    CompletedDate = m.CompletedDate,
                    CreatedBy = m.CreatedByUser.FullName,
                    CreatedAt = m.CreatedAt,
                })
                .ToListAsync();

            return new PaginatedResult<MaintenanceListDto>
            {
                Data = records,
                Total = total,
                Page = query.Page,
                PageSize = query.PageSize,
                TotalPages = (int)Math.Ceiling(total / (double)query.PageSize),
            };
        }

        // ── Get Maintenance Detail ────────────────────────────────
        public async Task<MaintenanceDetailDto?> GetMaintenanceByIdAsync(int id)
        {
            var record = await _db.MaintenanceRecords
                .Include(m => m.Asset)
                    .ThenInclude(a => a.Category)
                .Include(m => m.CreatedByUser)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (record == null) return null;

            return new MaintenanceDetailDto
            {
                Id = record.Id,
                AssetId = record.AssetId,
                AssetTag = record.Asset.AssetTag,
                AssetName = record.Asset.Name,
                AssetCategory = record.Asset.Category.Name,
                Type = record.Type,
                Status = record.Status,
                Description = record.Description,
                TechnicianOrCompany = record.Technician,
                Cost = record.Cost,
                CompletedDate = record.CompletedDate,
                Remarks = record.Remarks,
                CreatedBy = record.CreatedByUser.FullName,
                CreatedAt = record.CreatedAt,
            };
        }

        // ── Create Maintenance Record ─────────────────────────────
        public async Task<MaintenanceDetailDto> CreateMaintenanceAsync(
            CreateMaintenanceDto dto, int userId)
        {
            // Check asset exists
            var asset = await _db.Assets.FindAsync(dto.AssetId);
            if (asset == null)
                throw new InvalidOperationException("Asset not found.");

            var record = new MaintenanceRecord
            {
                AssetId = dto.AssetId,
                CreatedBy = userId,
                Type = dto.Type,
                Status = dto.Status,
                Description = dto.Description,
                Technician = dto.TechnicianOrCompany,
                Cost = dto.Cost,
                CompletedDate = dto.CompletedDate,
                Remarks = dto.Remarks,
                CreatedAt = DateTime.UtcNow,
            };

            _db.MaintenanceRecords.Add(record);
            await _db.SaveChangesAsync();

            // Log create action — Name includes asset tag and type so the
            // audit log description reads e.g. "Created Maintenance Record: LAP-001 - Repair"
            await _auditLog.LogCreateAsync(
                userId, "Maintenance", "MaintenanceRecord", record.Id,
                new { Name = $"{asset.AssetTag} - {record.Type}", record.Status });

            return (await GetMaintenanceByIdAsync(record.Id))!;
        }

        // ── Update Maintenance Record ─────────────────────────────
        public async Task<MaintenanceDetailDto?> UpdateMaintenanceAsync(
            int id, UpdateMaintenanceDto dto, int updatedByUserId)
        {
            var record = await _db.MaintenanceRecords
                .Include(m => m.Asset)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (record == null) return null;

            // Cache asset tag for audit log description
            var assetTag = record.Asset?.AssetTag ?? $"Asset #{record.AssetId}";

            // Save old values before updating — for audit log comparison
            var oldValues = new
            {
                Name = $"{assetTag} - {record.Type}",
                record.Status,
                record.Technician,
            };

            record.Type = dto.Type;
            record.Status = dto.Status;
            record.Description = dto.Description;
            record.Technician = dto.TechnicianOrCompany;
            record.Cost = dto.Cost;
            record.CompletedDate = dto.CompletedDate;
            record.Remarks = dto.Remarks;

            await _db.SaveChangesAsync();

            // Log update action — records old and new values for comparison
            await _auditLog.LogUpdateAsync(
                updatedByUserId, "Maintenance", "MaintenanceRecord", id,
                oldValues,
                new { Name = $"{assetTag} - {record.Type}", record.Status, record.Technician });

            return await GetMaintenanceByIdAsync(id);
        }

        // ── Delete Maintenance Record ─────────────────────────────
        public async Task<bool> DeleteMaintenanceAsync(int id, int deletedByUserId)
        {
            var record = await _db.MaintenanceRecords
                .Include(m => m.Asset)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (record == null) return false;

            // Cache asset tag before deletion — for audit log description
            var assetTag = record.Asset?.AssetTag ?? $"Asset #{record.AssetId}";

            // Save old values before deleting — for audit log record
            var oldValues = new
            {
                Name = $"{assetTag} - {record.Type}",
                record.Status,
            };

            _db.MaintenanceRecords.Remove(record);
            await _db.SaveChangesAsync();

            // Log delete action — records what was deleted and by whom
            await _auditLog.LogDeleteAsync(
                deletedByUserId, "Maintenance", "MaintenanceRecord", id, oldValues);

            return true;
        }
    }
}