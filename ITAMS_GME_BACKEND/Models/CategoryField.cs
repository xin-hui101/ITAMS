namespace ITAMS_GME_BACKEND.Models
{
    public class CategoryField
    {
        public int Id { get; set; }
        public int CategoryId { get; set; }
        public string FieldKey { get; set; } = string.Empty;    // e.g. "ram_gb"
        public string FieldLabel { get; set; } = string.Empty;  // e.g. "RAM (GB)"
        public string FieldType { get; set; } = string.Empty;   // text, number, date, select
        public bool IsRequired { get; set; } = false;
        public string? DefaultValue { get; set; }
        public int SortOrder { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Category Category { get; set; } = null!;
        public ICollection<AssetFieldValue> AssetFieldValues { get; set; } = new List<AssetFieldValue>();
    }
}