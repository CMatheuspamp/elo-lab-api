using System.ComponentModel.DataAnnotations.Schema;

namespace EloLab.API.Models;

[Table("anexos")]
public class Anexo
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("trabalho_id")]
    public Guid TrabalhoId { get; set; }

    [Column("nome_arquivo")]
    public string NomeArquivo { get; set; } = string.Empty;

    [Column("url")]
    public string Url { get; set; } = string.Empty;

    [Column("tamanho_bytes")]
    public long TamanhoBytes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}