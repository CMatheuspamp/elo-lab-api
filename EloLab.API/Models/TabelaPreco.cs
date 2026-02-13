using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace EloLab.API.Models;

[Table("tabelas_precos")]
public class TabelaPreco
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("laboratorio_id")]
    public Guid LaboratorioId { get; set; }

    [Column("nome")]
    public string Nome { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Lista de Itens (Preços) desta tabela
    public ICollection<TabelaItem> Itens { get; set; } = new List<TabelaItem>();
}