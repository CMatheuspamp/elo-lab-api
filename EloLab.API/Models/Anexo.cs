using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization; // Necessário para o [JsonIgnore]

namespace EloLab.API.Models;

[Table("anexos")]
public class Anexo
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("trabalho_id")]
    public Guid TrabalhoId { get; set; }

    [Required]
    [Column("nome_arquivo")]
    public string NomeArquivo { get; set; } = string.Empty;

    [Required]
    [Column("url")]
    public string Url { get; set; } = string.Empty;

    // Adicionei este campo pois ajuda o Frontend a saber se mostra ícone de PDF ou Cubo 3D
    [Column("tipo_arquivo")]
    public string TipoArquivo { get; set; } = string.Empty; // ex: "application/pdf" ou ".stl"

    [Column("tamanho_bytes")]
    public long TamanhoBytes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // =================================================================
    // PROPRIEDADE DE NAVEGAÇÃO (Para o Entity Framework entender o elo)
    // =================================================================
    [ForeignKey("TrabalhoId")]
    [JsonIgnore] // Evita loop infinito no JSON
    public virtual Trabalho? Trabalho { get; set; }
}