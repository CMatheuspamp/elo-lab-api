using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace EloLab.API.Models;

[Table("tabela_itens")]
public class TabelaItem
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("tabela_preco_id")]
    public Guid TabelaPrecoId { get; set; }

    [Column("servico_id")]
    public Guid ServicoId { get; set; }

    [Column("preco")]
    public decimal Preco { get; set; }

    // Navegação para sabermos o nome do serviço
    [ForeignKey("ServicoId")]
    public virtual Servico? Servico { get; set; }
    
    [JsonIgnore]
    public virtual TabelaPreco? TabelaPreco { get; set; }
}