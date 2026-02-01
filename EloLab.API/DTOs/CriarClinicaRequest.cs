namespace EloLab.API.DTOs;

// Esta classe serve APENAS para receber os dados do formulário de criação
public class CriarClinicaRequest
{
    public Guid LaboratorioId { get; set; } // Quem está a cadastrar/convidar?
    public string Nome { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Nif { get; set; }
    public string? Endereco { get; set; }
}