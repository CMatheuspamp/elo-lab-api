using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EloLab.API.Migrations
{
    /// <inheritdoc />
    public partial class AjusteNomesColunasLaboratorio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "StripeCustomerId",
                table: "laboratorios",
                newName: "stripe_customer_id");

            migrationBuilder.RenameColumn(
                name: "StatusAssinatura",
                table: "laboratorios",
                newName: "status_assinatura");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "stripe_customer_id",
                table: "laboratorios",
                newName: "StripeCustomerId");

            migrationBuilder.RenameColumn(
                name: "status_assinatura",
                table: "laboratorios",
                newName: "StatusAssinatura");
        }
    }
}
