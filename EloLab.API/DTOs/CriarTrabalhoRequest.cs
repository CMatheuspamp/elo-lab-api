namespace EloLab.API.DTOs;

public class CriarTrabalhoRequest
{
    public Guid LaboratorioId { get; set; }
    public Guid ClinicaId { get; set; }
    
    public string PacienteNome { get; set; } = string.Empty;
    public Guid? ServicoId { get; set; }
    
    // O '?' (nullable) é essencial. Se vier null, usamos o preço de tabela.
    // Se vier um número (ex: 100.00), usamos esse número.
    public decimal? ValorPersonalizado { get; set; } 

    public string? Dentes { get; set; }
    public string? CorDente { get; set; }
    
    // CORREÇÃO AQUI: Mudado de Observacoes para DescricaoPersonalizada
    // para bater com o JSON do Frontend: { descricaoPersonalizada: "..." }
    public string? DescricaoPersonalizada { get; set; } 
    
    public DateTime DataEntrega { get; set; }
}