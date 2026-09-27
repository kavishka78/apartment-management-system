using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApartmentManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddResidentRelationshipsAndSeeder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_VisitorPasses_ResidentId",
                table: "VisitorPasses",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingSlots_ResidentId",
                table: "ParkingSlots",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_FacilityBookings_ResidentId",
                table: "FacilityBookings",
                column: "ResidentId");

            migrationBuilder.AddForeignKey(
                name: "FK_FacilityBookings_Residents_ResidentId",
                table: "FacilityBookings",
                column: "ResidentId",
                principalTable: "Residents",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ParkingSlots_Residents_ResidentId",
                table: "ParkingSlots",
                column: "ResidentId",
                principalTable: "Residents",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_VisitorPasses_Residents_ResidentId",
                table: "VisitorPasses",
                column: "ResidentId",
                principalTable: "Residents",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FacilityBookings_Residents_ResidentId",
                table: "FacilityBookings");

            migrationBuilder.DropForeignKey(
                name: "FK_ParkingSlots_Residents_ResidentId",
                table: "ParkingSlots");

            migrationBuilder.DropForeignKey(
                name: "FK_VisitorPasses_Residents_ResidentId",
                table: "VisitorPasses");

            migrationBuilder.DropIndex(
                name: "IX_VisitorPasses_ResidentId",
                table: "VisitorPasses");

            migrationBuilder.DropIndex(
                name: "IX_ParkingSlots_ResidentId",
                table: "ParkingSlots");

            migrationBuilder.DropIndex(
                name: "IX_FacilityBookings_ResidentId",
                table: "FacilityBookings");
        }
    }
}
