namespace EloLab.API.DTOs;

public class AtualizarPerfilRequest
{
    public string Nome { get; set; } = string.Empty;
    public string? EmailContato { get; set; } // Email visível para parceiros
    public string? Telefone { get; set; }
    public string? Nif { get; set; }
    public string? Endereco { get; set; }
}