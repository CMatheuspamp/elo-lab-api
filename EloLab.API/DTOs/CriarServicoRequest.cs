using System.ComponentModel.DataAnnotations;

namespace EloLab.API.DTOs;

public class CriarServicoRequest
{
    [Required]
    public string Nome { get; set; }

    // --- NOVO ---
    public string Material { get; set; } = "Geral";
    // -----------

    [Required]
    public decimal PrecoBase { get; set; }

    public int PrazoDiasUteis { get; set; } = 5;

    public string? Descricao { get; set; }
}