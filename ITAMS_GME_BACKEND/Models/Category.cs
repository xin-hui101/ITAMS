namespace ITAMS_GME_BACKEND.Models
{
    public class Category
    {
        public int Id { get; set; }
        
        public int CreatedBy { get; set; }
        public string CategoryCode { get; set; } = string.Empty;  // Auto generated e.g. C01
        public string Name { get; set; } = string.Empty;
        public string AssetPrefix { get; set; } = string.Empty;   // User defined e.g. NF-000
        public string? Description { get; set; }
        public string Icon { get; set; } = "ti-category"; // Tabler icon name
        public string? FixedFieldsConfig { get; set; } // JSON: which fixed fields are required
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User CreatedByUser { get; set; } = null!;
        public ICollection<CategoryField> CategoryFields { get; set; } = new List<CategoryField>();
        public ICollection<Asset> Assets { get; set; } = new List<Asset>();
    }
}