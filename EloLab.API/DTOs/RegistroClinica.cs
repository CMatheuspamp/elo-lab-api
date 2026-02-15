using System.ComponentModel.DataAnnotations;

namespace EloLab.API.DTOs
{
    public class RegistroClinica
    {
        [Required(ErrorMessage = "O nome é obrigatório.")]
        public string NomeResponsavel { get; set; } = string.Empty;

        [Required(ErrorMessage = "O email é obrigatório.")]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(8)]
        public string Senha { get; set; } = string.Empty;

        [Required(ErrorMessage = "O nome da clínica é obrigatório.")]
        public string NomeClinica { get; set; } = string.Empty;

        public string? Nif { get; set; }
        public string? Telefone { get; set; }
        
        public string? Rua { get; set; }
        public string? Cidade { get; set; }
        public string? CodigoPostal { get; set; }

        // A MÁGICA ESTÁ AQUI: O token do convite (opcional)
        public Guid? TokenConvite { get; set; } 
    }
}