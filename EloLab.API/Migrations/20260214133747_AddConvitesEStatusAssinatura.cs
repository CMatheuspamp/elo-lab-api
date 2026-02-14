using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EloLab.API.Migrations
{
    /// <inheritdoc />
    public partial class AddConvitesEStatusAssinatura : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "StatusAssinatura",
                table: "laboratorios",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "StripeCustomerId",
                table: "laboratorios",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "convites_clinicas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    laboratorio_id = table.Column<Guid>(type: "uuid", nullable: false),
                    email_convidado = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    data_criacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    data_expiracao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    usado = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_convites_clinicas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_convites_clinicas_laboratorios_laboratorio_id",
                        column: x => x.laboratorio_id,
                        principalTable: "laboratorios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_convites_clinicas_laboratorio_id",
                table: "convites_clinicas",
                column: "laboratorio_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "convites_clinicas");

            migrationBuilder.DropColumn(
                name: "StatusAssinatura",
                table: "laboratorios");

            migrationBuilder.DropColumn(
                name: "StripeCustomerId",
                table: "laboratorios");
        }
    }
}
