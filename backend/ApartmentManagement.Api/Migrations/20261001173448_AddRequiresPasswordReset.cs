using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApartmentManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRequiresPasswordReset : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "RequiresPasswordReset",
                table: "UserAccounts",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RequiresPasswordReset",
                table: "UserAccounts");
        }
    }
}
