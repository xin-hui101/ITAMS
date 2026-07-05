using Microsoft.EntityFrameworkCore;
using ITAMS_GME_BACKEND.Data;
using ITAMS_GME_BACKEND.DTOs;
using System.Text.Json;

namespace ITAMS_GME_BACKEND.Services
{
    public class DashboardService
    {
        private readonly AppDbContext _db;

        public DashboardService(AppDbContext db)
        {
            _db = db;
        }

        // ── Build dashboard data based on user permissions ────────
        public async Task<DashboardDto> GetDashboardAsync(List<string> permissions)
        {
            var dashboard = new DashboardDto();

            // Assets section — only if user has Assets:Read permission
            if (permissions.Contains("Assets:Read"))
            {
                dashboard.Assets = await GetAssetsDataAsync();
            }

            // Categories section — only if user has Categories:Read permission
            if (permissions.Contains("Categories:Read"))
            {
                dashboard.Categories = new DashboardCategoriesDto
                {
                    TotalCategories = await _db.Categories.CountAsync(),
                };
            }

            // Maintenance section — only if user has Maintenance:Read permission
            if (permissions.Contains("Maintenance:Read"))
            {
                dashboard.Maintenance = await GetMaintenanceDataAsync();
            }

            // Audit log section — only if user has AuditLogs:Read permission
            if (permissions.Contains("AuditLogs:Read"))
            {
                dashboard.AuditLog = await GetAuditLogDataAsync();
            }

            return dashboard;
        }

        // ── Assets data ───────────────────────────────────────────
        private async Task<DashboardAssetsDto> GetAssetsDataAsync()
        {
            var totalAssets = await _db.Assets.CountAsync();
            var totalValue = await _db.Assets.SumAsync(a => a.PurchasePrice ?? 0);
            var activeCount = await _db.Assets.CountAsync(a => a.Status == "Active");
            var inactiveCount = await _db.Assets.CountAsync(a => a.Status == "Inactive");
            var maintenanceCount = await _db.Assets.CountAsync(a => a.Status == "Under Maintenance");
            var disposeCount = await _db.Assets.CountAsync(a => a.Status == "Dispose");

            // Assets grouped by category — ordered by count descending
            var byCategory = await _db.Categories
                .Select(c => new AssetByCategoryDto
                {
                    CategoryName = c.Name,
                    CategoryIcon = c.Icon,
                    Count = c.Assets.Count,
                })
                .OrderByDescending(c => c.Count)
                .ToListAsync();

            // Warranty alerts — assets expiring within 30 days or already expired
            var today = DateTime.UtcNow.Date;
            var alertLimit = today.AddDays(30);

            var warrantyAlerts = await _db.Assets
                .Include(a => a.Category)
                .Where(a => a.WarrantyExpiry.HasValue && a.WarrantyExpiry.Value <= alertLimit)
                .OrderBy(a => a.WarrantyExpiry)
                .Take(5)
                .Select(a => new WarrantyAlertDto
                {
                    Id = a.Id,
                    AssetTag = a.AssetTag,
                    Name = a.Name,
                    CategoryName = a.Category.Name,
                    WarrantyExpiry = a.WarrantyExpiry,
                    DaysLeft = (int)(a.WarrantyExpiry!.Value - DateTime.UtcNow).TotalDays,
                })
                .ToListAsync();

            return new DashboardAssetsDto
            {
                TotalAssets = totalAssets,
                TotalValue = totalValue,
                ActiveCount = activeCount,
                InactiveCount = inactiveCount,
                UnderMaintenanceCount = maintenanceCount,
                DisposeCount = disposeCount,
                ByCategory = byCategory,
                WarrantyAlerts = warrantyAlerts,
            };
        }

        // ── Maintenance data ──────────────────────────────────────
        private async Task<DashboardMaintenanceDto> GetMaintenanceDataAsync()
        {
            return new DashboardMaintenanceDto
            {
                PendingCount = await _db.MaintenanceRecords.CountAsync(m => m.Status == "Pending"),
                InProgressCount = await _db.MaintenanceRecords.CountAsync(m => m.Status == "In Progress"),
                CompletedCount = await _db.MaintenanceRecords.CountAsync(m => m.Status == "Completed"),
            };
        }

        // ── Audit log data ────────────────────────────────────────
        private async Task<DashboardAuditLogDto> GetAuditLogDataAsync()
        {
            // Today in Malaysia time (UTC+8)
            var malaysiaTime = DateTime.UtcNow.AddHours(8);
            var todayStartUtc = new DateTime(malaysiaTime.Year, malaysiaTime.Month, malaysiaTime.Day, 0, 0, 0, DateTimeKind.Utc).AddHours(-8);
            var todayEndUtc = todayStartUtc.AddDays(1);

            var todayTotal = await _db.AuditLogs
                .CountAsync(al => al.CreatedAt >= todayStartUtc && al.CreatedAt < todayEndUtc);

            // Recent 5 activities
            var recentLogs = await _db.AuditLogs
                .Include(al => al.User)
                .OrderByDescending(al => al.CreatedAt)
                .Take(5)
                .ToListAsync();

            var recentActivity = recentLogs.Select(al => new RecentActivityDto
            {
                UserFullName = al.User.FullName,
                Action = al.Action,
                Description = BuildDescription(al),
                CreatedAt = al.CreatedAt,
            }).ToList();

            return new DashboardAuditLogDto
            {
                TodayTotal = todayTotal,
                RecentActivity = recentActivity,
            };
        }

        // ── Build readable description from audit log ─────────────
        private string BuildDescription(Models.AuditLog log)
        {
            try
            {
                if (log.Action == "Login") return "Logged in";

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

        private string FormatRecordType(string recordType)
        {
            return recordType switch
            {
                "MaintenanceRecord" => "Maintenance Record",
                _ => recordType,
            };
        }
    }
}