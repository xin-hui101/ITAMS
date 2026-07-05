namespace ITAMS_GME_BACKEND.Models
{
    public class Asset
    {
        public int Id { get; set; }
        public int CategoryId { get; set; }
        public string AssetTag { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? SerialNumber { get; set; }
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public string Status { get; set; } = "Active";   // Active, Under Maintenance, Retired
        public decimal? PurchasePrice { get; set; }
        public DateTime? PurchaseDate { get; set; }
        public DateTime? WarrantyExpiry { get; set; }
        public string? Location { get; set; }
        public string? Notes { get; set; }
        public string? CustomFieldsJson { get; set; }   // Cache for quick display
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Category Category { get; set; } = null!;
        public ICollection<AssetFieldValue> AssetFieldValues { get; set; } = new List<AssetFieldValue>();
        public ICollection<MaintenanceRecord> MaintenanceRecords { get; set; } = new List<MaintenanceRecord>();
    }
}