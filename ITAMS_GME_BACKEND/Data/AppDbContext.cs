using Microsoft.EntityFrameworkCore;
using ITAMS_GME_BACKEND.Models;

namespace ITAMS_GME_BACKEND.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // ── Tables ───────────────────────────────────────────────
        public DbSet<Role> Roles { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<UserPermission> UserPermissions { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<CategoryField> CategoryFields { get; set; }
        public DbSet<Asset> Assets { get; set; }
        public DbSet<AssetFieldValue> AssetFieldValues { get; set; }
        public DbSet<MaintenanceRecord> MaintenanceRecords { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ── Role ──────────────────────────────────────────────
            modelBuilder.Entity<Role>(entity =>
            {
                entity.HasKey(r => r.Id);
                entity.Property(r => r.Name).IsRequired().HasMaxLength(50);
            });

            // ── Permission ────────────────────────────────────────
            modelBuilder.Entity<Permission>(entity =>
            {
                entity.HasKey(p => p.Id);
                entity.Property(p => p.Module).IsRequired().HasMaxLength(50);
                entity.Property(p => p.Action).IsRequired().HasMaxLength(50);
                entity.HasIndex(p => new { p.Module, p.Action }).IsUnique();
            });

            // ── User ──────────────────────────────────────────────
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.Id);
                entity.Property(u => u.Email).IsRequired().HasMaxLength(150);
                entity.Property(u => u.Username).IsRequired().HasMaxLength(100);
                entity.Property(u => u.PasswordHash).IsRequired();
                entity.Property(u => u.FullName).IsRequired().HasMaxLength(150);
                entity.HasIndex(u => u.Email).IsUnique();

                entity.HasOne(u => u.Role)
                      .WithMany(r => r.Users)
                      .HasForeignKey(u => u.RoleId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── UserPermission ────────────────────────────────────
            modelBuilder.Entity<UserPermission>(entity =>
            {
                entity.HasKey(up => up.Id);
                entity.HasIndex(up => new { up.UserId, up.PermissionId }).IsUnique();

                entity.HasOne(up => up.User)
                      .WithMany(u => u.UserPermissions)
                      .HasForeignKey(up => up.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(up => up.Permission)
                      .WithMany(p => p.UserPermissions)
                      .HasForeignKey(up => up.PermissionId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ── Category ──────────────────────────────────────────────
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(c => c.Id);
                entity.Property(c => c.Name).IsRequired().HasMaxLength(100);
                entity.Property(c => c.CategoryCode).IsRequired().HasMaxLength(10);
                entity.Property(c => c.AssetPrefix).IsRequired().HasMaxLength(20);
                entity.Property(c => c.Icon).IsRequired().HasMaxLength(50).HasDefaultValue("ti-category");
                entity.Property(c => c.FixedFieldsConfig).HasColumnType("nvarchar(max)");

                // Unique category code
                entity.HasIndex(c => c.CategoryCode).IsUnique();

                // Unique asset prefix — no two categories share same prefix
                entity.HasIndex(c => c.AssetPrefix).IsUnique();

                // Category created by user
                entity.HasOne(c => c.CreatedByUser)
                      .WithMany()
                      .HasForeignKey(c => c.CreatedBy)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── CategoryField ─────────────────────────────────────
            modelBuilder.Entity<CategoryField>(entity =>
            {
                entity.HasKey(cf => cf.Id);
                entity.Property(cf => cf.FieldKey).IsRequired().HasMaxLength(100);
                entity.Property(cf => cf.FieldLabel).IsRequired().HasMaxLength(100);
                entity.Property(cf => cf.FieldType).IsRequired().HasMaxLength(50);

                entity.HasOne(cf => cf.Category)
                      .WithMany(c => c.CategoryFields)
                      .HasForeignKey(cf => cf.CategoryId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ── Asset ─────────────────────────────────────────────
            modelBuilder.Entity<Asset>(entity =>
            {
                entity.HasKey(a => a.Id);
                entity.Property(a => a.AssetTag).IsRequired().HasMaxLength(100);
                entity.Property(a => a.Name).IsRequired().HasMaxLength(150);
                entity.Property(a => a.Status).IsRequired().HasMaxLength(50);
                entity.Property(a => a.PurchasePrice).HasPrecision(18, 2);

                // Unique asset tag
                entity.HasIndex(a => a.AssetTag).IsUnique();

                entity.HasOne(a => a.Category)
                      .WithMany(c => c.Assets)
                      .HasForeignKey(a => a.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── AssetFieldValue ───────────────────────────────────
            modelBuilder.Entity<AssetFieldValue>(entity =>
            {
                entity.HasKey(afv => afv.Id);
                entity.Property(afv => afv.ValueNumber).HasPrecision(18, 2);

                entity.HasOne(afv => afv.Asset)
                      .WithMany(a => a.AssetFieldValues)
                      .HasForeignKey(afv => afv.AssetId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(afv => afv.CategoryField)
                      .WithMany(cf => cf.AssetFieldValues)
                      .HasForeignKey(afv => afv.CategoryFieldId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── MaintenanceRecord ─────────────────────────────────
            modelBuilder.Entity<MaintenanceRecord>(entity =>
            {
                entity.HasKey(m => m.Id);
                entity.Property(m => m.Type).IsRequired().HasMaxLength(50);
                entity.Property(m => m.Status).IsRequired().HasMaxLength(50);
                entity.Property(m => m.Description).IsRequired();
                entity.Property(m => m.Cost).HasPrecision(18, 2);

                entity.HasOne(m => m.Asset)
                      .WithMany(a => a.MaintenanceRecords)
                      .HasForeignKey(m => m.AssetId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(m => m.CreatedByUser)
                      .WithMany()
                      .HasForeignKey(m => m.CreatedBy)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── AuditLog ──────────────────────────────────────────
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasKey(al => al.Id);
                entity.Property(al => al.Module).IsRequired().HasMaxLength(50);
                entity.Property(al => al.Action).IsRequired().HasMaxLength(50);
                entity.Property(al => al.RecordType).IsRequired().HasMaxLength(50);

                entity.HasOne(al => al.User)
                      .WithMany()
                      .HasForeignKey(al => al.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Seed: static date ─────────────────────────────────
            var seedDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            modelBuilder.Entity<Role>().HasData(
                new Role { Id = 1, Name = "Admin", Description = "Full system access", CreatedAt = seedDate },
                new Role { Id = 2, Name = "IT Manager", Description = "", CreatedAt = seedDate },
                new Role { Id = 3, Name = "IT Staff", Description = "", CreatedAt = seedDate }
            );

            modelBuilder.Entity<Permission>().HasData(
                new Permission { Id = 1, Module = "Users", Action = "Create" },
                new Permission { Id = 2, Module = "Users", Action = "Read" },
                new Permission { Id = 3, Module = "Users", Action = "Update" },
                new Permission { Id = 4, Module = "Users", Action = "Delete" },
                new Permission { Id = 5, Module = "Assets", Action = "Create" },
                new Permission { Id = 6, Module = "Assets", Action = "Read" },
                new Permission { Id = 7, Module = "Assets", Action = "Update" },
                new Permission { Id = 8, Module = "Assets", Action = "Delete" },
                new Permission { Id = 9, Module = "Categories", Action = "Create" },
                new Permission { Id = 10, Module = "Categories", Action = "Read" },
                new Permission { Id = 11, Module = "Categories", Action = "Update" },
                new Permission { Id = 12, Module = "Categories", Action = "Delete" },
                new Permission { Id = 13, Module = "Maintenance", Action = "Create" },
                new Permission { Id = 14, Module = "Maintenance", Action = "Read" },
                new Permission { Id = 15, Module = "Maintenance", Action = "Update" },
                new Permission { Id = 16, Module = "Maintenance", Action = "Delete" },
                new Permission { Id = 17, Module = "AuditLogs", Action = "Read" }
            );
        }
    }
}