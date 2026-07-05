namespace ITAMS_GME_BACKEND.DTOs
{
    // ── List ─────────────────────────────────────────────────────
    public class AuditLogListDto
    {
        public int Id { get; set; }
        public string UserFullName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string Module { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string RecordType { get; set; } = string.Empty;
        public int RecordId { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? IpAddress { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ── Detail ───────────────────────────────────────────────────
    public class AuditLogDetailDto
    {
        public int Id { get; set; }
        public string UserFullName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string Module { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string RecordType { get; set; } = string.Empty;
        public int RecordId { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? OldValues { get; set; }
        public string? NewValues { get; set; }
        public string? IpAddress { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ── Stats ─────────────────────────────────────────────────────
    public class AuditLogStatsDto
    {
        public int TodayTotal { get; set; }
        public int TodayCreate { get; set; }
        public int TodayUpdate { get; set; }
        public int TodayDelete { get; set; }
    }

    // ── Query ─────────────────────────────────────────────────────
    public class AuditLogQueryDto
    {
        public string? Search { get; set; }     // Search by user name, email
        public string? Module { get; set; }     // Filter by module
        public string? Action { get; set; }     // Filter by action
        public int? UserId { get; set; }        // Filter by specific user
        public DateTime? DateFrom { get; set; } // Filter by date range
        public DateTime? DateTo { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}