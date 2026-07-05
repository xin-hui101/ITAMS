using Microsoft.EntityFrameworkCore;
using ITAMS_GME_BACKEND.Data;
using ITAMS_GME_BACKEND.DTOs;
using ITAMS_GME_BACKEND.Models;

namespace ITAMS_GME_BACKEND.Services
{
    public class UserService
    {
        private readonly AppDbContext _db;
        private readonly AuditLogService _auditLog;

        public UserService(AppDbContext db, AuditLogService auditLog)
        {
            _db = db;
            _auditLog = auditLog;
        }

        // ── Get All Users (with search, filter, pagination) ───────
        public async Task<PaginatedResult<UserListDto>> GetUsersAsync(UserQueryDto query)
        {
            var q = _db.Users
                .Include(u => u.Role)
                .AsQueryable();

            // Search by name, email or username
            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var search = query.Search.ToLower();
                q = q.Where(u =>
                    u.FullName.ToLower().Contains(search) ||
                    u.Email.ToLower().Contains(search) ||
                    u.Username.ToLower().Contains(search)
                );
            }

            // Filter by role
            if (query.RoleId.HasValue)
                q = q.Where(u => u.RoleId == query.RoleId.Value);

            // Filter by active status
            if (query.IsActive.HasValue)
                q = q.Where(u => u.IsActive == query.IsActive.Value);

            // Get total count before pagination
            var total = await q.CountAsync();

            // Apply pagination
            var users = await q
                .OrderByDescending(u => u.CreatedAt)
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(u => new UserListDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Username = u.Username,
                    Email = u.Email,
                    Role = u.Role.Name,
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt,
                })
                .ToListAsync();

            return new PaginatedResult<UserListDto>
            {
                Data = users,
                Total = total,
                Page = query.Page,
                PageSize = query.PageSize,
                TotalPages = (int)Math.Ceiling(total / (double)query.PageSize),
            };
        }

        // ── Get User Detail by ID ─────────────────────────────────
        public async Task<UserDetailDto?> GetUserByIdAsync(int id)
        {
            var user = await _db.Users
                .Include(u => u.Role)
                .Include(u => u.UserPermissions)
                    .ThenInclude(up => up.Permission)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return null;

            return new UserDetailDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Username = user.Username,
                Email = user.Email,
                Phone = user.Phone,
                Role = user.Role.Name,
                RoleId = user.RoleId,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                Permissions = user.UserPermissions
                    .Select(up => $"{up.Permission.Module}:{up.Permission.Action}")
                    .ToList(),
            };
        }

        // ── Create User ───────────────────────────────────────────
        public async Task<UserDetailDto> CreateUserAsync(CreateUserDto dto, int createdByUserId)
        {
            // Check if email already exists
            if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
                throw new InvalidOperationException("Email already exists.");

            // Check if username already exists
            if (await _db.Users.AnyAsync(u => u.Username == dto.Username))
                throw new InvalidOperationException("Username already exists.");

            // Hash password before saving
            var user = new User
            {
                FullName = dto.FullName,
                Username = dto.Username,
                Email = dto.Email,
                PasswordHash = AuthService.HashPassword(dto.Password),
                Phone = dto.Phone,
                RoleId = dto.RoleId,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            // Assign permissions
            if (dto.PermissionIds.Any())
            {
                var permissions = dto.PermissionIds.Select(pid => new UserPermission
                {
                    UserId = user.Id,
                    PermissionId = pid,
                    GrantedBy = createdByUserId,
                    GrantedAt = DateTime.UtcNow,
                }).ToList();

                _db.UserPermissions.AddRange(permissions);
                await _db.SaveChangesAsync();
            }

            // Log create action — records who created the user and basic info
            await _auditLog.LogCreateAsync(
                createdByUserId, "Users", "User", user.Id,
                new { user.FullName, user.Email, user.Username });

            return (await GetUserByIdAsync(user.Id))!;
        }

        // ── Update User ───────────────────────────────────────────
        public async Task<UserDetailDto?> UpdateUserAsync(int id, UpdateUserDto dto, int updatedByUserId)
        {
            var user = await _db.Users
                .Include(u => u.UserPermissions)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return null;

            // Check email conflict with other users
            if (await _db.Users.AnyAsync(u => u.Email == dto.Email && u.Id != id))
                throw new InvalidOperationException("Email already exists.");

            // Check username conflict with other users
            if (await _db.Users.AnyAsync(u => u.Username == dto.Username && u.Id != id))
                throw new InvalidOperationException("Username already exists.");

            // Save old values before updating — for audit log comparison
            var oldValues = new
            {
                user.FullName,
                user.Email,
                user.Username,
                user.IsActive,
                user.RoleId,
            };

            // Update fields
            user.FullName = dto.FullName;
            user.Username = dto.Username;
            user.Email = dto.Email;
            user.Phone = dto.Phone;
            user.RoleId = dto.RoleId;
            user.IsActive = dto.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

            // Replace all permissions — remove old, add new
            _db.UserPermissions.RemoveRange(user.UserPermissions);

            if (dto.PermissionIds.Any())
            {
                var permissions = dto.PermissionIds.Select(pid => new UserPermission
                {
                    UserId = user.Id,
                    PermissionId = pid,
                    GrantedBy = updatedByUserId,
                    GrantedAt = DateTime.UtcNow,
                }).ToList();

                _db.UserPermissions.AddRange(permissions);
            }

            // Increment token version to invalidate any tokens issued before
            // this update — this runs every time, even if permissions were
            // cleared to empty, so removing all access also forces re-login
            user.TokenVersion++;

            await _db.SaveChangesAsync();

            // Log update action — records old and new values for comparison
            await _auditLog.LogUpdateAsync(
                updatedByUserId, "Users", "User", user.Id,
                oldValues,
                new { user.FullName, user.Email, user.Username, user.IsActive });

            return await GetUserByIdAsync(id);
        }

        // ── Delete User ───────────────────────────────────────────
        public async Task<bool> DeleteUserAsync(int id, int deletedByUserId)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return false;

            // Save old values before deleting — for audit log record
            var oldValues = new { user.FullName, user.Email, user.Username };

            _db.Users.Remove(user);
            await _db.SaveChangesAsync();

            // Log delete action — records who was deleted and by whom
            await _auditLog.LogDeleteAsync(
                deletedByUserId, "Users", "User", id, oldValues);

            return true;
        }

        // ── Get All Roles (for dropdown in create/edit form) ──────
        public async Task<List<Role>> GetRolesAsync()
        {
            return await _db.Roles.ToListAsync();
        }

        // ── Get All Permissions (for checkbox list) ───────────────
        public async Task<List<Permission>> GetPermissionsAsync()
        {
            return await _db.Permissions.ToListAsync();
        }
    }
}