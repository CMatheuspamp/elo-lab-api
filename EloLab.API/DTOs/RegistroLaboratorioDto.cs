using System.ComponentModel.DataAnnotations;

namespace EloLab.API.DTOs // Confirme se a sua pasta se chama DTOs
{
    public class RegistroLaboratorioDto
    {
        [Required(ErrorMessage = "O nome do responsável é obrigatório.")]
        public string NomeResponsavel { get; set; } = string.Empty;

        [Required(ErrorMessage = "O email é obrigatório.")]
        [EmailAddress(ErrorMessage = "Formato de email inválido.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "A senha é obrigatória.")]
        [MinLength(8, ErrorMessage = "A senha deve ter pelo menos 8 caracteres.")]
        public string Senha { get; set; } = string.Empty;

        [Required(ErrorMessage = "O nome do laboratório é obrigatório.")]
        public string NomeLaboratorio { get; set; } = string.Empty;

        // Campos que o lab pode preencher agora ou deixar para depois
        public string? Nif { get; set; }
        public string? Telefone { get; set; }
    }
}