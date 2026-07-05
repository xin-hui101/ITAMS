namespace ITAMS_GME_BACKEND.Models
{
    public class AssetFieldValue
    {
        public int Id { get; set; }
        public int AssetId { get; set; }
        public int CategoryFieldId { get; set; }
        public string FieldKey { get; set; } = string.Empty;  // Redundant for easy query
        public string? ValueText { get; set; }                // For text/select fields
        public decimal? ValueNumber { get; set; }             // For number fields (indexable)
        public DateTime? ValueDate { get; set; }              // For date fields
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Asset Asset { get; set; } = null!;
        public CategoryField CategoryField { get; set; } = null!;
    }
}