namespace ITAMS_GME_BACKEND.Models
{
    public class AuditLog
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Module { get; set; } = string.Empty;      // e.g. "Users", "Assets"
        public string Action { get; set; } = string.Empty;      // e.g. "Create", "Update", "Delete"
        public string RecordType { get; set; } = string.Empty;  // e.g. "User", "Asset"
        public int RecordId { get; set; }                        // ID of the affected record
        public string? OldValues { get; set; }                  // JSON string of old values
        public string? NewValues { get; set; }                  // JSON string of new values
        public string? IpAddress { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User User { get; set; } = null!;
    }
}