using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ITAMS_GME_BACKEND.Migrations
{
    /// <inheritdoc />
    public partial class RemoveScheduledDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ScheduledDate",
                table: "MaintenanceRecords");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledDate",
                table: "MaintenanceRecords",
                type: "datetime2",
                nullable: true);
        }
    }
}
