// EloLab.API/DTOs/AtualizarTrabalhoRequest.cs
namespace EloLab.API.DTOs;

public class AtualizarTrabalhoRequest
{
    public string PacienteNome { get; set; } = string.Empty;
    public string? Dentes { get; set; }
    public string? CorDente { get; set; }
    public string? DescricaoPersonalizada { get; set; }
    public DateTime DataEntrega { get; set; }
    public decimal ValorFinal { get; set; }
}