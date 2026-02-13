using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace EloLab.API.Models;

[Table("laboratorio_clinicas")]
public class LaboratorioClinica
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("laboratorio_id")]
    public Guid LaboratorioId { get; set; }

    [Required]
    [Column("clinica_id")]
    public Guid ClinicaId { get; set; }

    [Column("ativo")]
    public bool Ativo { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // === CAMPO DA TABELA DE PREÇOS ===
    [Column("tabela_preco_id")]
    public Guid? TabelaPrecoId { get; set; }

    // === PROPRIEDADES DE NAVEGAÇÃO ===
    
    [ForeignKey("LaboratorioId")]
    [JsonIgnore]
    public virtual Laboratorio? Laboratorio { get; set; }

    [ForeignKey("ClinicaId")]
    [JsonIgnore]
    public virtual Clinica? Clinica { get; set; }
    
    [ForeignKey("TabelaPrecoId")]
    [JsonIgnore]
    public virtual TabelaPreco? TabelaPreco { get; set; }
}