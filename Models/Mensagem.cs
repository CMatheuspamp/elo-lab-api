using System.ComponentModel.DataAnnotations.Schema;

namespace EloLab.API.Models;

[Table("mensagens")]
public class Mensagem
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("trabalho_id")]
    public Guid TrabalhoId { get; set; } // O chat pertence a qual trabalho?

    [Column("remetente_id")]
    public Guid RemetenteId { get; set; } // Quem escreveu? (User ID)

    [Column("conteudo")]
    public string Conteudo { get; set; } = string.Empty;

    [Column("lida")]
    public bool Lida { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}