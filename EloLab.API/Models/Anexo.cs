using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization; 

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

    // === CORREÇÃO AQUI ===
    // Adicionado '?' para permitir NULL caso a base de dados tenha registos antigos incompletos
    [Column("tipo_arquivo")]
    public string? TipoArquivo { get; set; } 

    [Column("tamanho_bytes")]
    public long TamanhoBytes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("TrabalhoId")]
    [JsonIgnore]
    public virtual Trabalho? Trabalho { get; set; }
}