using System.ComponentModel.DataAnnotations;

namespace EloLab.API.DTOs;

public class CriarMensagemRequest
{
    [Required]
    public Guid TrabalhoId { get; set; }

    // Removemos o RemetenteId daqui porque agora pegamos automático do Token (Segurança)
    
    [Required]
    public string Texto { get; set; } = string.Empty; 
}