using System.ComponentModel.DataAnnotations.Schema;

namespace EloLab.API.Models;

[Table("trabalhos")]
public class Trabalho
{
    [Column("id")]
    public Guid Id { get; set; }

    // --- RELACIONAMENTO COM LABORATÓRIO ---
    [Column("laboratorio_id")]
    public Guid LaboratorioId { get; set; }

    // ADICIONE ISTO: O objeto de navegação
    [ForeignKey("LaboratorioId")]
    public virtual Laboratorio? Laboratorio { get; set; }


    // --- RELACIONAMENTO COM CLÍNICA ---
    [Column("clinica_id")]
    public Guid ClinicaId { get; set; }

    // ADICIONE ISTO: O objeto de navegação
    [ForeignKey("ClinicaId")]
    public virtual Clinica? Clinica { get; set; }


    // --- RELACIONAMENTO COM SERVIÇO ---
    [Column("servico_id")]
    public Guid? ServicoId { get; set; }

    // ADICIONE ISTO (Opcional, mas útil no futuro)
    [ForeignKey("ServicoId")]
    public virtual Servico? Servico { get; set; }


    // --- Outras Propriedades (Mantenha como estão) ---
    [Column("paciente_nome")]
    public string PacienteNome { get; set; } = string.Empty;

    [Column("dentes")]
    public string? Dentes { get; set; }

    [Column("cor_dente")]
    public string? CorDente { get; set; }

    [Column("data_entrega_prevista")]
    public DateTime DataEntregaPrevista { get; set; }

    [Column("valor_final")]
    public decimal ValorFinal { get; set; }

    [Column("status")]
    public string Status { get; set; } = "Pendente";

    [Column("descricao_personalizada")]
    public string? DescricaoPersonalizada { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}