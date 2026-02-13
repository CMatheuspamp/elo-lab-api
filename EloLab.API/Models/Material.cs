using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EloLab.API.Models;

[Table("materiais")]
public class Material
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("laboratorio_id")]
    public Guid LaboratorioId { get; set; }

    [Required]
    [Column("nome")]
    public string Nome { get; set; } = string.Empty;
}