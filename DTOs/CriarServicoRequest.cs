namespace EloLab.API.DTOs;

public class CriarServicoRequest
{
    public Guid LaboratorioId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public decimal PrecoBase { get; set; }
    public int PrazoDiasUteis { get; set; }
}