using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ITAMS_GME_BACKEND.Migrations
{
    /// <inheritdoc />
    public partial class AddShowInTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ShowInTable",
                table: "CategoryFields",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShowInTable",
                table: "CategoryFields");
        }
    }
}
