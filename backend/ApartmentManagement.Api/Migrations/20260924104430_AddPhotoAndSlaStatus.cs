using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApartmentManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPhotoAndSlaStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PhotoPath",
                table: "Maintenances",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SlaStatus",
                table: "Maintenances",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PhotoPath",
                table: "Maintenances");

            migrationBuilder.DropColumn(
                name: "SlaStatus",
                table: "Maintenances");
        }
    }
}
