namespace ITAMS_GME_BACKEND.DTOs
{
    // ── Dashboard ─────────────────────────────────────────────────
    public class DashboardDto
    {
        public DashboardAssetsDto? Assets { get; set; }
        public DashboardMaintenanceDto? Maintenance { get; set; }
        public DashboardAuditLogDto? AuditLog { get; set; }
        public DashboardCategoriesDto? Categories { get; set; }
    }

    // ── Assets Section ────────────────────────────────────────────
    public class DashboardAssetsDto
    {
        public int TotalAssets { get; set; }
        public decimal TotalValue { get; set; }
        public int ActiveCount { get; set; }
        public int InactiveCount { get; set; }
        public int UnderMaintenanceCount { get; set; }
        public int DisposeCount { get; set; }
        public List<AssetByCategoryDto> ByCategory { get; set; } = new();
        public List<WarrantyAlertDto> WarrantyAlerts { get; set; } = new();
    }

    // ── Asset by Category ─────────────────────────────────────────
    public class AssetByCategoryDto
    {
        public string CategoryName { get; set; } = string.Empty;
        public string CategoryIcon { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    // ── Warranty Alert ────────────────────────────────────────────
    public class WarrantyAlertDto
    {
        public int Id { get; set; }
        public string AssetTag { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public DateTime? WarrantyExpiry { get; set; }
        public int DaysLeft { get; set; }
    }

    // ── Maintenance Section ───────────────────────────────────────
    public class DashboardMaintenanceDto
    {
        public int PendingCount { get; set; }
        public int InProgressCount { get; set; }
        public int CompletedCount { get; set; }
    }

    // ── Audit Log Section ─────────────────────────────────────────
    public class DashboardAuditLogDto
    {
        public int TodayTotal { get; set; }
        public List<RecentActivityDto> RecentActivity { get; set; } = new();
    }

    // ── Recent Activity Item ──────────────────────────────────────
    public class RecentActivityDto
    {
        public string UserFullName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    // ── Categories Section ────────────────────────────────────────
    public class DashboardCategoriesDto
    {
        public int TotalCategories { get; set; }
    }
}