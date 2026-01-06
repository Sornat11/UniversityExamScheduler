using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UniversityExamScheduler.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIsStarostaColumnFix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_starosta",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_starosta",
                table: "users");
        }
    }
}
