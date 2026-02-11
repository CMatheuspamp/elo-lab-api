using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EloLab.API.Models;

[Table("notificacoes")] // Nome da tabela no Supabase
public class Notificacao
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    // O ID do utilizador (Pode ser o dono do Lab ou da Clínica) que vai RECEBER o aviso
    [Required]
    public Guid UsuarioId { get; set; }

    [Required]
    public string Titulo { get; set; } = string.Empty;

    [Required]
    public string Texto { get; set; } = string.Empty;

    // Link para onde o utilizador vai quando clicar na notificação (ex: /trabalhos/123)
    public string? LinkAction { get; set; }

    public bool Lida { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}