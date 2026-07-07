namespace ITAMS_GME_BACKEND.DTOs
{
    // ── List ─────────────────────────────────────────────────────
    public class AssetListDto
    {
        public int Id { get; set; }
        public string AssetTag { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public string? Location { get; set; }
        public decimal? PurchasePrice { get; set; }
        public DateTime? PurchaseDate { get; set; }
        public DateTime? WarrantyExpiry { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<AssetTableFieldDto> CustomFields { get; set; } = new();
    }

    // ── Detail ───────────────────────────────────────────────────
    public class AssetDetailDto
    {
        public int Id { get; set; }
        public string AssetTag { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? SerialNumber { get; set; }
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public decimal? PurchasePrice { get; set; }
        public DateTime? PurchaseDate { get; set; }
        public DateTime? WarrantyExpiry { get; set; }
        public string? Location { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<AssetFieldValueDto> CustomFields { get; set; } = new();
    }

    // ── Custom Field Value ────────────────────────────────────────
    public class AssetFieldValueDto
    {
        public int CategoryFieldId { get; set; }
        public string FieldKey { get; set; } = string.Empty;
        public string FieldLabel { get; set; } = string.Empty;
        public string FieldType { get; set; } = string.Empty;
        public string? ValueText { get; set; }
        public decimal? ValueNumber { get; set; }
        public DateTime? ValueDate { get; set; }
    }

    // ── Create ────────────────────────────────────────────────────
    public class CreateAssetDto
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Status { get; set; } = "Active";
        public string? SerialNumber { get; set; }
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public decimal? PurchasePrice { get; set; }
        public DateTime? PurchaseDate { get; set; }
        public DateTime? WarrantyExpiry { get; set; }
        public string? Location { get; set; }
        public string? Notes { get; set; }
        public List<AssetFieldInputDto> CustomFields { get; set; } = new();
    }

    // ── Update ────────────────────────────────────────────────────
    public class UpdateAssetDto
    {
        public string Name { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? SerialNumber { get; set; }
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public decimal? PurchasePrice { get; set; }
        public DateTime? PurchaseDate { get; set; }
        public DateTime? WarrantyExpiry { get; set; }
        public string? Location { get; set; }
        public string? Notes { get; set; }
        public List<AssetFieldInputDto> CustomFields { get; set; } = new();
    }

    // ── Custom Field Input ────────────────────────────────────────
    public class AssetFieldInputDto
    {
        public int CategoryFieldId { get; set; }
        public string FieldKey { get; set; } = string.Empty;
        public string? ValueText { get; set; }
        public decimal? ValueNumber { get; set; }
        public DateTime? ValueDate { get; set; }
    }

    // ── Query ─────────────────────────────────────────────────────
    public class AssetQueryDto
    {
        public string? Search { get; set; }
        public int? CategoryId { get; set; }
        public string? Status { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    // ── Stats ─────────────────────────────────────────────────────
    public class AssetStatsDto
    {
        public int TotalCategories { get; set; }
        public int TotalAssets { get; set; }
        public int ActiveCount { get; set; }
        public int InactiveCount { get; set; }
        public int UnderMaintenanceCount { get; set; }
        public int DisposeCount { get; set; }
        public decimal TotalValue { get; set; }
    }

    public class AssetTableFieldDto
    {
        public string FieldKey { get; set; } = string.Empty;
        public string FieldLabel { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }
}