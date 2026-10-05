using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ApartmentManagement.Api.Migrations
{
    public partial class AddFacilityBookingInvoiceReference : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FacilityBookingId",
                table: "Invoices",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_FacilityBookingId",
                table: "Invoices",
                column: "FacilityBookingId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_FacilityBookings_FacilityBookingId",
                table: "Invoices",
                column: "FacilityBookingId",
                principalTable: "FacilityBookings",
                principalColumn: "BookingId",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_FacilityBookings_FacilityBookingId",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_FacilityBookingId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "FacilityBookingId",
                table: "Invoices");
        }
    }
}
