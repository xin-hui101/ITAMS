namespace ITAMS_GME_BACKEND.DTOs
{
    // ── List ─────────────────────────────────────────────────────
    public class MaintenanceListDto
    {
        public int Id { get; set; }
        public string AssetTag { get; set; } = string.Empty;
        public string AssetName { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? TechnicianOrCompany { get; set; }
        public decimal? Cost { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    // ── Detail ───────────────────────────────────────────────────
    public class MaintenanceDetailDto
    {
        public int Id { get; set; }
        public int AssetId { get; set; }
        public string AssetTag { get; set; } = string.Empty;
        public string AssetName { get; set; } = string.Empty;
        public string AssetCategory { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? TechnicianOrCompany { get; set; }
        public decimal? Cost { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string? Remarks { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    // ── Create ────────────────────────────────────────────────────
    public class CreateMaintenanceDto
    {
        public int AssetId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public string Description { get; set; } = string.Empty;
        public string? TechnicianOrCompany { get; set; }
        public decimal? Cost { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string? Remarks { get; set; }
    }

    // ── Update ────────────────────────────────────────────────────
    public class UpdateMaintenanceDto
    {
        public string Type { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? TechnicianOrCompany { get; set; }
        public decimal? Cost { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string? Remarks { get; set; }
    }

    // ── Query ─────────────────────────────────────────────────────
    public class MaintenanceQueryDto
    {
        public string? Search { get; set; }   // Search by asset name, tag, technician
        public string? Status { get; set; }   // Filter by status
        public string? Type { get; set; }     // Filter by type
        public int? AssetId { get; set; }     // Filter by specific asset
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    // ── Stats ─────────────────────────────────────────────────────
    public class MaintenanceStatsDto
    {
        public int TotalRecords { get; set; }
        public int PendingCount { get; set; }
        public int InProgressCount { get; set; }
        public int CompletedCount { get; set; }
    }

}