using System.ComponentModel.DataAnnotations.Schema;

namespace EloLab.API.Models;

[Table("servicos")]
public class Servico
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("laboratorio_id")]
    public Guid LaboratorioId { get; set; } // FK

    [Column("nome")]
    public string Nome { get; set; } = string.Empty;

    [Column("descricao")]
    public string? Descricao { get; set; }

    [Column("preco_base")]
    public decimal PrecoBase { get; set; } // "decimal" é o tipo certo para dinheiro

    [Column("prazo_dias_uteis")]
    public int PrazoDiasUteis { get; set; } = 5;

    [Column("ativo")]
    public bool Ativo { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}