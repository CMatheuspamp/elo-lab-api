using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace EloLab.API.Models;

[Table("mensagens")]
public class Mensagem
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("trabalho_id")]
    public Guid TrabalhoId { get; set; }

    [Required]
    [Column("remetente_id")]
    public Guid RemetenteId { get; set; }

    // IMPORTANTE: Este campo foi adicionado agora
    [Column("nome_remetente")]
    public string NomeRemetente { get; set; } = string.Empty; 

    // Mudamos de 'Conteudo' para 'Texto' para alinhar com o Frontend
    [Required]
    [Column("conteudo")] 
    public string Texto { get; set; } = string.Empty; 

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navegação
    [JsonIgnore]
    [ForeignKey("TrabalhoId")]
    public virtual Trabalho? Trabalho { get; set; }
}