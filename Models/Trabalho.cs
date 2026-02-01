using System.ComponentModel.DataAnnotations.Schema;
using EloLab.API.Models.Enums;

namespace EloLab.API.Models;

[Table("trabalhos")]
public class Trabalho
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("laboratorio_id")]
    public Guid LaboratorioId { get; set; }

    [Column("clinica_id")]
    public Guid ClinicaId { get; set; }

    [Column("servico_id")]
    public Guid? ServicoId { get; set; } // Pode ser nulo se for um trabalho customizado

    [Column("paciente_nome")]
    public string PacienteNome { get; set; } = string.Empty;

    [Column("dentes")]
    public string? Dentes { get; set; } // "11, 21"

    [Column("cor_dente")]
    public string? CorDente { get; set; } // "A2"

    [Column("descricao_personalizada")]
    public string? DescricaoPersonalizada { get; set; }

    [Column("data_entrega_prevista")]
    public DateTime DataEntregaPrevista { get; set; }

    [Column("status")]
    public string Status { get; set; } = StatusTrabalho.Pendente.ToString(); // Guardamos como Texto no banco para ser legível

    [Column("valor_final")]
    public decimal ValorFinal { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}