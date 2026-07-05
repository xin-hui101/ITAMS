namespace ITAMS_GME_BACKEND.Models
{
    public class Permission
    {
        public int Id { get; set; }
        public string Module { get; set; } = string.Empty;    // "Modules"
        public string Action { get; set; } = string.Empty;   // "CRUD"
        public string? Description { get; set; }

        public ICollection<UserPermission> UserPermissions { get; set; } = new List<UserPermission>();
    }
}