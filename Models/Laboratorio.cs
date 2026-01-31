using System.ComponentModel.DataAnnotations.Schema;

namespace EloLab.API.Models;

[Table("laboratorios")]
public class Laboratorio
{
    [Column("id")]
    public Guid Id { get; set; }
    
    [Column("nome")]
    public string Nome { get; set; } = string.Empty;
    
    [Column("slug")]
    public string Slug { get; set; } = string.Empty;

    [Column("cor_primaria")] 
    public string CorPrimaria { get; set; } = "#2563EB";
    
    [Column("logo_url")]
    public string? LogoUrl { get; set; }
    
    [Column("ativo")]
    public bool Ativo { get; set; } = true;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}