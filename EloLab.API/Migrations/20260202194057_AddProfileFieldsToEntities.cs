using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EloLab.API.Migrations
{
    /// <inheritdoc />
    public partial class AddProfileFieldsToEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "email_contato",
                table: "laboratorios",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "endereco",
                table: "laboratorios",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "nif",
                table: "laboratorios",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "telefone",
                table: "laboratorios",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "telefone",
                table: "clinicas",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_servicos_laboratorio_id",
                table: "servicos",
                column: "laboratorio_id");

            migrationBuilder.AddForeignKey(
                name: "FK_servicos_laboratorios_laboratorio_id",
                table: "servicos",
                column: "laboratorio_id",
                principalTable: "laboratorios",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_servicos_laboratorios_laboratorio_id",
                table: "servicos");

            migrationBuilder.DropIndex(
                name: "IX_servicos_laboratorio_id",
                table: "servicos");

            migrationBuilder.DropColumn(
                name: "email_contato",
                table: "laboratorios");

            migrationBuilder.DropColumn(
                name: "endereco",
                table: "laboratorios");

            migrationBuilder.DropColumn(
                name: "nif",
                table: "laboratorios");

            migrationBuilder.DropColumn(
                name: "telefone",
                table: "laboratorios");

            migrationBuilder.DropColumn(
                name: "telefone",
                table: "clinicas");
        }
    }
}
