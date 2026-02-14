using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EloLab.API.Models // Confirma se o teu namespace de modelos é este
{
    [Table("convites_clinicas")] // Força o nome da tabela em minúsculas (padrão do Postgres)
    public class ConviteClinica
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [Column("laboratorio_id")]
        public Guid LaboratorioId { get; set; }

        // Propriedade de navegação do Entity Framework
        [ForeignKey("LaboratorioId")]
        public Laboratorio Laboratorio { get; set; }

        [Column("email_convidado")]
        [MaxLength(255)]
        public string? EmailConvidado { get; set; } // O "?" significa que pode ser nulo

        [Column("data_criacao")]
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        [Column("data_expiracao")]
        public DateTime DataExpiracao { get; set; }

        [Column("usado")]
        public bool Usado { get; set; } = false;
    }
}