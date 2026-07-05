namespace ITAMS_GME_BACKEND.Models
{
    public class UserPermission
    {
        public int Id { get; set; }
        public int UserId { get; set; }       // FK → Users
        public int PermissionId { get; set; } // FK → Permissions
        public int GrantedBy { get; set; }    // Who granted this permission (UserId)
        public DateTime GrantedAt { get; set; }

        public User User { get; set; } = null!;
        public Permission Permission { get; set; } = null!;
    }
}