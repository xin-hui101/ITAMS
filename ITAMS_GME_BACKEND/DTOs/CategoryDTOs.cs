namespace ITAMS_GME_BACKEND.DTOs
{
    // ── List ─────────────────────────────────────────────────────
    public class CategoryListDto
    {
        public int Id { get; set; }
        public string CategoryCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string AssetPrefix { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Icon { get; set; } = "ti-category";
        public string? FixedFieldsConfig { get; set; }
        public int AssetCount { get; set; }
        public int FieldCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
    }

    // ── Detail ───────────────────────────────────────────────────
    public class CategoryDetailDto
    {
        public int Id { get; set; }
        public string CategoryCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string AssetPrefix { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Icon { get; set; } = "ti-category";
        public string? FixedFieldsConfig { get; set; }
        public int AssetCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public List<CategoryFieldDto> Fields { get; set; } = new();
    }

    // ── Category Field ────────────────────────────────────────────
    public class CategoryFieldDto
    {
        public int Id { get; set; }
        public string FieldKey { get; set; } = string.Empty;
        public string FieldLabel { get; set; } = string.Empty;
        public string FieldType { get; set; } = string.Empty;
        public bool IsRequired { get; set; }
        public string? DefaultValue { get; set; }
        public int SortOrder { get; set; }
    }

    // ── Create ────────────────────────────────────────────────────
    public class CreateCategoryDto
    {
        public string Name { get; set; } = string.Empty;
        public string AssetPrefix { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Icon { get; set; } = "ti-category";
        public string? FixedFieldsConfig { get; set; }
        public List<CreateCategoryFieldDto> Fields { get; set; } = new();
    }

    // ── Update ────────────────────────────────────────────────────
    public class UpdateCategoryDto
    {
        public string Name { get; set; } = string.Empty;
        public string AssetPrefix { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Icon { get; set; } = "ti-category";
        public string? FixedFieldsConfig { get; set; }
        public List<CreateCategoryFieldDto> Fields { get; set; } = new();
    }

    // ── Create Field ──────────────────────────────────────────────
    public class CreateCategoryFieldDto
    {
        public string FieldKey { get; set; } = string.Empty;
        public string FieldLabel { get; set; } = string.Empty;
        public string FieldType { get; set; } = string.Empty;
        public bool IsRequired { get; set; } = false;
        public string? DefaultValue { get; set; }
        public int SortOrder { get; set; } = 0;
    }

    // ── Query ─────────────────────────────────────────────────────
    public class CategoryQueryDto
    {
        public string? Search { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}