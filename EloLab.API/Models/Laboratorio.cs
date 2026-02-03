using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace EloLab.API.Models;

[Table("laboratorios")]
public class Laboratorio
{
    [Key] // <--- Importante para o Entity Framework saber que é a chave
    [Column("id")]
    public Guid Id { get; set; }
    
    [Required]
    [Column("nome")]
    public string Nome { get; set; } = string.Empty;
    
    [Column("slug")]
    public string Slug { get; set; } = string.Empty;

    // === APARÊNCIA ===
    [Column("cor_primaria")] 
    public string CorPrimaria { get; set; } = "#2563EB"; // Azul padrão
    
    [Column("logo_url")]
    public string? LogoUrl { get; set; }
    // =================

    [Column("ativo")]
    public bool Ativo { get; set; } = true;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [Column("usuario_id")]
    public Guid UsuarioId { get; set; } // Removi o '?' pois todo lab deve ter um dono

    // === DADOS DE PERFIL ===
    [Column("email_contato")]
    public string? EmailContato { get; set; }

    [Column("telefone")]
    public string? Telefone { get; set; }

    [Column("nif")]
    public string? Nif { get; set; }

    [Column("endereco")]
    public string? Endereco { get; set; }
}