namespace EloLab.API.DTOs;

public class AtualizarPerfilRequest
{
    public string Nome { get; set; } = string.Empty;
    public string EmailContato { get; set; } = string.Empty;
    public string? Telefone { get; set; }
    public string? Nif { get; set; }
    public string? Endereco { get; set; }
    
    // Novos
    public string? CorPrimaria { get; set; }
    public string? LogoUrl { get; set; }
}