using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace EloLab.API.Models;

// 1. Mapear o nome da tabela (igual ao SQL)
[Table("laboratorio_clinicas")]
public class LaboratorioClinica
{
    [Key]
    [Column("id")] // Mapeia para "id" minúsculo no banco
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("laboratorio_id")] // Mapeia para "laboratorio_id"
    public Guid LaboratorioId { get; set; }

    [Required]
    [Column("clinica_id")] // Mapeia para "clinica_id"
    public Guid ClinicaId { get; set; }

    [Column("ativo")]
    public bool Ativo { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // =================================================================
    // PROPRIEDADES DE NAVEGAÇÃO
    // =================================================================
    
    [ForeignKey("LaboratorioId")]
    [JsonIgnore]
    public virtual Laboratorio? Laboratorio { get; set; }

    [ForeignKey("ClinicaId")]
    [JsonIgnore]
    public virtual Clinica? Clinica { get; set; }
}