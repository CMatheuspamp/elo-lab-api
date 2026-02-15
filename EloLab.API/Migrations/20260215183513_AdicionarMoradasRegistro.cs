using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EloLab.API.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarMoradasRegistro : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "cidade",
                table: "laboratorios",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "codigo_postal",
                table: "laboratorios",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "rua",
                table: "laboratorios",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "cidade",
                table: "clinicas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "codigo_postal",
                table: "clinicas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "rua",
                table: "clinicas",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "cidade",
                table: "laboratorios");

            migrationBuilder.DropColumn(
                name: "codigo_postal",
                table: "laboratorios");

            migrationBuilder.DropColumn(
                name: "rua",
                table: "laboratorios");

            migrationBuilder.DropColumn(
                name: "cidade",
                table: "clinicas");

            migrationBuilder.DropColumn(
                name: "codigo_postal",
                table: "clinicas");

            migrationBuilder.DropColumn(
                name: "rua",
                table: "clinicas");
        }
    }
}
