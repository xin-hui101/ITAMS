using ITAMS_GME_BACKEND.Data;
using ITAMS_GME_BACKEND.DTOs;
using ITAMS_GME_BACKEND.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace ITAMS_GME_BACKEND.Services
{
    public class AuditLogService
    {
        private readonly AppDbContext _db;

        public AuditLogService(AppDbContext db)
        {
            _db = db;
        }

        // ── Log any action ────────────────────────────────────────
        public async Task LogAsync(
            int userId,
            string module,
            string action,
            string recordType,
            int recordId,
            object? oldValues = null,
            object? newValues = null,
            string? ipAddress = null)
        {
            var log = new AuditLog
            {
                UserId = userId,
                Module = module,
                Action = action,
                RecordType = recordType,
                RecordId = recordId,
                OldValues = oldValues != null
                    ? JsonSerializer.Serialize(oldValues)
                    : null,
                NewValues = newValues != null
                    ? JsonSerializer.Serialize(newValues)
                    : null,
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow,
            };

            _db.AuditLogs.Add(log);
            await _db.SaveChangesAsync();
        }

        // ── Shortcut methods ──────────────────────────────────────
        public Task LogCreateAsync(int userId, string module, string recordType,
            int recordId, object? newValues = null, string? ip = null)
            => LogAsync(userId, module, "Create", recordType, recordId,
                null, newValues, ip);

        public Task LogUpdateAsync(int userId, string module, string recordType,
            int recordId, object? oldValues = null, object? newValues = null, string? ip = null)
            => LogAsync(userId, module, "Update", recordType, recordId,
                oldValues, newValues, ip);

        public Task LogDeleteAsync(int userId, string module, string recordType,
            int recordId, object? oldValues = null, string? ip = null)
            => LogAsync(userId, module, "Delete", recordType, recordId,
                oldValues, null, ip);

        public Task LogLoginAsync(int userId, string? ip = null)
            => LogAsync(userId, "Auth", "Login", "User", userId,
                null, null, ip);

       
        private string FormatRecordType(string recordType)
        {
            return recordType switch
            {
                "MaintenanceRecord" => "Maintenance Record",
                _ => recordType,
            };
        }

        private string BuildDescription(AuditLog log)
        {
            try
            {
                // Login has no values stored — handle separately
                if (log.Action == "Login")
                    return "Logged in";

                var json = log.NewValues ?? log.OldValues;
                if (string.IsNullOrEmpty(json))
                    return $"{log.Action} {FormatRecordType(log.RecordType)} #{log.RecordId}";

                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                string? name = null;
                if (root.TryGetProperty("Name", out var n)) name = n.GetString();
                else if (root.TryGetProperty("FullName", out var fn)) name = fn.GetString();
                else if (root.TryGetProperty("AssetTag", out var at)) name = at.GetString();

                if (name == null)
                    return $"{log.Action} {FormatRecordType(log.RecordType)} #{log.RecordId}";

                return log.Action switch
                {
                    "Create" => $"Created {FormatRecordType(log.RecordType)}: {name}",
                    "Update" => $"Updated {FormatRecordType(log.RecordType)}: {name}",
                    "Delete" => $"Deleted {FormatRecordType(log.RecordType)}: {name}",
                    _ => $"{log.Action} {FormatRecordType(log.RecordType)}: {name}",
                };
            }
            catch
            {
                return $"{log.Action} {FormatRecordType(log.RecordType)} #{log.RecordId}";
            }
        }

        // ── Get All Audit Logs (paginated + search + filter) ──────
        public async Task<PaginatedResult<AuditLogListDto>> GetAuditLogsAsync(AuditLogQueryDto query)
        {
            var q = _db.AuditLogs
                .Include(al => al.User)
                .AsQueryable();

            // Search by user name or email
            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var search = query.Search.ToLower();
                q = q.Where(al =>
                    al.User.FullName.ToLower().Contains(search) ||
                    al.User.Email.ToLower().Contains(search)
                );
            }

            // Filter by module
            if (!string.IsNullOrWhiteSpace(query.Module))
                q = q.Where(al => al.Module == query.Module);

            // Filter by action
            if (!string.IsNullOrWhiteSpace(query.Action))
                q = q.Where(al => al.Action == query.Action);

            // Filter by user
            if (query.UserId.HasValue)
                q = q.Where(al => al.UserId == query.UserId.Value);

            // Filter by date range — DateTo is inclusive of the whole day
            if (query.DateFrom.HasValue)
                q = q.Where(al => al.CreatedAt >= query.DateFrom.Value);

            if (query.DateTo.HasValue)
                q = q.Where(al => al.CreatedAt < query.DateTo.Value.AddDays(1));

            var total = await q.CountAsync();

            // Fetch raw entities first — BuildDescription needs NewValues/OldValues
            var logEntities = await q
                .OrderByDescending(al => al.CreatedAt)
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            var logs = logEntities.Select(al => new AuditLogListDto
            {
                Id = al.Id,
                UserFullName = al.User.FullName,
                UserEmail = al.User.Email,
                Module = al.Module,
                Action = al.Action,
                RecordType = al.RecordType,
                RecordId = al.RecordId,
                Description = BuildDescription(al),
                IpAddress = al.IpAddress,
                CreatedAt = al.CreatedAt,
            }).ToList();

            return new PaginatedResult<AuditLogListDto>
            {
                Data = logs,
                Total = total,
                Page = query.Page,
                PageSize = query.PageSize,
                TotalPages = (int)Math.Ceiling(total / (double)query.PageSize),
            };
        }

        // ── Get Audit Log Detail ──────────────────────────────────
        public async Task<AuditLogDetailDto?> GetAuditLogByIdAsync(int id)
        {
            var log = await _db.AuditLogs
                .Include(al => al.User)
                .FirstOrDefaultAsync(al => al.Id == id);

            if (log == null) return null;

            return new AuditLogDetailDto
            {
                Id = log.Id,
                UserFullName = log.User.FullName,
                UserEmail = log.User.Email,
                Module = log.Module,
                Action = log.Action,
                RecordType = log.RecordType,
                RecordId = log.RecordId,
                Description = BuildDescription(log),
                OldValues = log.OldValues,
                NewValues = log.NewValues,
                IpAddress = log.IpAddress,
                CreatedAt = log.CreatedAt,
            };
        }

        // ── Get Audit Log Stats (for KPI cards, Malaysia time) ─────
        public async Task<AuditLogStatsDto> GetStatsAsync()
        {
            // Malaysia is UTC+8 — convert "now" to local time to find
            // today's boundaries, then convert those boundaries back to
            // UTC since CreatedAt is stored in UTC
            var malaysiaNow = DateTime.UtcNow.AddHours(8);
            var todayStartUtc = new DateTime(malaysiaNow.Year, malaysiaNow.Month, malaysiaNow.Day, 0, 0, 0, DateTimeKind.Utc).AddHours(-8);
            var todayEndUtc = todayStartUtc.AddDays(1);

            var todayLogs = _db.AuditLogs
                .Where(al => al.CreatedAt >= todayStartUtc && al.CreatedAt < todayEndUtc);

            var todayTotal = await todayLogs.CountAsync();
            var todayCreate = await todayLogs.CountAsync(al => al.Action == "Create");
            var todayUpdate = await todayLogs.CountAsync(al => al.Action == "Update");
            var todayDelete = await todayLogs.CountAsync(al => al.Action == "Delete");

            return new AuditLogStatsDto
            {
                TodayTotal = todayTotal,
                TodayCreate = todayCreate,
                TodayUpdate = todayUpdate,
                TodayDelete = todayDelete,
            };
        }
    }
}