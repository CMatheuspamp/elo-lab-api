using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization; // <--- Importante para evitar loops no JSON

namespace EloLab.API.Models;

[Table("servicos")]
public class Servico
{
    [Column("id")]
    public Guid Id { get; set; }

    [Column("laboratorio_id")]
    public Guid LaboratorioId { get; set; }

    // --- ADICIONE ISTO ---
    [JsonIgnore] // Não envia o Laboratório inteiro quando pedires a lista de serviços
    [ForeignKey("LaboratorioId")]
    public virtual Laboratorio? Laboratorio { get; set; }
    // ---------------------

    [Column("nome")]
    public string Nome { get; set; } = string.Empty;

    [Column("material")]
    public string Material { get; set; } = "Geral"; 

    [Column("descricao")]
    public string? Descricao { get; set; }

    [Column("preco_base")]
    public decimal PrecoBase { get; set; }

    [Column("prazo_dias_uteis")]
    public int PrazoDiasUteis { get; set; } = 5;

    [Column("ativo")]
    public bool Ativo { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}