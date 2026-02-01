using System.ComponentModel.DataAnnotations.Schema;

namespace EloLab.API.Models;

[Table("laboratorio_clinicas")]
public class LaboratorioClinica
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("laboratorio_id")]
    public Guid LaboratorioId { get; set; } // Chave Estrangeira para Lab

    [Column("clinica_id")]
    public Guid ClinicaId { get; set; } // Chave Estrangeira para Clinica

    [Column("ativo")]
    public bool Ativo { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}