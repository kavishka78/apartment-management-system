using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ApartmentManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRegistryModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DomesticStaff",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    ResidentId = table.Column<int>(type: "integer", nullable: true),
                    ResidentName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    UnitNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    FullName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    StaffType = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    NicNumber = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    ContactPhone = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    AccessPassCode = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    WorkingHours = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DomesticStaff", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Residents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    FullName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    NationalId = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    UnitId = table.Column<int>(type: "integer", nullable: true),
                    UnitNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Role = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    MonthlyIncome = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    EmergencyContact = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    MoveInDate = table.Column<string>(type: "text", nullable: true),
                    VehiclesCount = table.Column<int>(type: "integer", nullable: false),
                    StaffCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Residents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Units",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    UnitNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    FloorNumber = table.Column<int>(type: "integer", nullable: false),
                    BlockName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    NumberOfBedrooms = table.Column<int>(type: "integer", nullable: false),
                    NumberOfBathrooms = table.Column<int>(type: "integer", nullable: false),
                    SquareFeet = table.Column<int>(type: "integer", nullable: false),
                    MonthlyRent = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CurrentResidentName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    CurrentResidentPhone = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    ParkingSlot = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Units", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Vehicles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    ResidentId = table.Column<int>(type: "integer", nullable: true),
                    ResidentName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    UnitNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    PlateNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    VehicleType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    MakeModel = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    ParkingSlot = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    RegisteredAt = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vehicles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HouseholdMembers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ResidentId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Relation = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Age = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HouseholdMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HouseholdMembers_Residents_ResidentId",
                        column: x => x.ResidentId,
                        principalTable: "Residents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });




            migrationBuilder.CreateIndex(
                name: "IX_DomesticStaff_TenantId",
                table: "DomesticStaff",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_HouseholdMembers_ResidentId",
                table: "HouseholdMembers",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_Residents_TenantId",
                table: "Residents",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Units_TenantId_UnitNumber",
                table: "Units",
                columns: new[] { "TenantId", "UnitNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_TenantId",
                table: "Vehicles",
                column: "TenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DomesticStaff");

            migrationBuilder.DropTable(
                name: "HouseholdMembers");

            migrationBuilder.DropTable(
                name: "Units");

            migrationBuilder.DropTable(
                name: "Vehicles");

            migrationBuilder.DropTable(
                name: "Residents");



        }
    }
}
