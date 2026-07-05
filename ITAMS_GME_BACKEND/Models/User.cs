namespace ITAMS_GME_BACKEND.Models
{
    public class User
    {
        public int Id { get; set; }
        public int RoleId { get; set; }          // FK → Roles table
        public string Username { get; set; } = string.Empty; //VARCHAR NOT NULL,by defauly just give empty string like ""
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty; // save hashed password, not plain text
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int TokenVersion { get; set; } = 1;

        public Role Role { get; set; } = null!;                          // navigate → Role
        public ICollection<UserPermission> UserPermissions { get; set; } = null!;
    }
}