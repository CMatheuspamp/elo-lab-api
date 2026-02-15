using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EloLab.API.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarColunaPago : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "pago",
                table: "trabalhos",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "pago",
                table: "trabalhos");
        }
    }
}
