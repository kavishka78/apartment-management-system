using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ApartmentManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSafetyVerdictLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
                        migrationBuilder.CreateTable(
                name: "SafetyVerdictLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    WorkflowId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ProposedBy = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    ActionType = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    RequesterUserId = table.Column<int>(type: "integer", nullable: false),
                    RequesterRole = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Verdict = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ApprovalRequired = table.Column<bool>(type: "boolean", nullable: false),
                    Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ChecksJson = table.Column<string>(type: "text", nullable: false),
                    TraceId = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    HumanDecision = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    DecidedBy = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    DecidedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SafetyVerdictLogs", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
                        migrationBuilder.DropTable(
                name: "SafetyVerdictLogs");
        }
    }
}

