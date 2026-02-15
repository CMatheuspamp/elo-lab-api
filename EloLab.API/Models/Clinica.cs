using System.ComponentModel.DataAnnotations.Schema;

namespace EloLab.API.Models;

[Table("clinicas")]
public class Clinica
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("nome")]
    public string Nome { get; set; } = string.Empty;

    [Column("email_contato")]
    public string? EmailContato { get; set; }

    // === NOVO CAMPO (O ÚNICO QUE FALTAVA) ===
    [Column("telefone")]
    public string? Telefone { get; set; }
    
    [Column("rua")]
    public string? Rua { get; set; }

    [Column("cidade")]
    public string? Cidade { get; set; }

    [Column("codigo_postal")]
    public string? CodigoPostal { get; set; }
    // ========================================

    [Column("nif")]
    public string? Nif { get; set; }

    [Column("endereco")]
    public string? Endereco { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Column("usuario_id")]
    public Guid? UsuarioId { get; set; }
}