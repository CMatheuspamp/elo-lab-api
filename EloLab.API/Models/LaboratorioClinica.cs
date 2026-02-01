using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization; // Importante para evitar ciclos infinitos no JSON

namespace EloLab.API.Models;

public class LaboratorioClinica
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid LaboratorioId { get; set; }

    [Required]
    public Guid ClinicaId { get; set; }

    public bool Ativo { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // =================================================================
    // PROPRIEDADES DE NAVEGAÇÃO (O SEGREDO PARA O INCLUDE FUNCIONAR)
    // =================================================================
    
    [ForeignKey("LaboratorioId")]
    [JsonIgnore] // Evita que o JSON fique num loop infinito (Lab -> Clinica -> Lab...)
    public virtual Laboratorio? Laboratorio { get; set; }

    [ForeignKey("ClinicaId")]
    [JsonIgnore]
    public virtual Clinica? Clinica { get; set; }
}