namespace ITAMS_GME_BACKEND.Models
{
    public class MaintenanceRecord
    {
        public int Id { get; set; }
        public int AssetId { get; set; }
        public int CreatedBy { get; set; }
        public string Type { get; set; } = string.Empty;         // Repair, Service, Inspection
        public string Status { get; set; } = string.Empty;       // Pending, In Progress, Completed
        public string Description { get; set; } = string.Empty;
        public string? Technician { get; set; }                  // Technician or Service Company
        public decimal? Cost { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string? Remarks { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Asset Asset { get; set; } = null!;
        public User CreatedByUser { get; set; } = null!;
    }
}