namespace ITAMS_GME_BACKEND.DTOs
{
    // ── List & Detail ─────────────────────────────────────────────

    // Used in user list table
    public class UserListDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // Used in user detail view — includes permissions
    public class UserDetailDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string Role { get; set; } = string.Empty;
        public int RoleId { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<string> Permissions { get; set; } = new();
    }

    // ── Create ────────────────────────────────────────────────────
    public class CreateUserDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public int RoleId { get; set; }
        public bool IsActive { get; set; } = true;
        public List<int> PermissionIds { get; set; } = new(); // Permission IDs to assign
    }

    // ── Update ────────────────────────────────────────────────────
    public class UpdateUserDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public int RoleId { get; set; }
        public bool IsActive { get; set; }
        public List<int> PermissionIds { get; set; } = new();
    }

    // ── Search & Filter ───────────────────────────────────────────
    public class UserQueryDto
    {
        public string? Search { get; set; }       // Search by name, email, username
        public int? RoleId { get; set; }          // Filter by role
        public bool? IsActive { get; set; }       // Filter by active status
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    // ── Paginated Response ────────────────────────────────────────
    public class PaginatedResult<T>
    {
        public List<T> Data { get; set; } = new();
        public int Total { get; set; }      // Total records
        public int Page { get; set; }       // Current page
        public int PageSize { get; set; }   // Records per page
        public int TotalPages { get; set; } // Total pages
    }
}