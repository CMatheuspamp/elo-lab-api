namespace EloLab.API.DTOs;

public class CriarMensagemRequest
{
    public Guid TrabalhoId { get; set; }
    public Guid RemetenteId { get; set; } // Temporário: No futuro virá do Token
    public string Conteudo { get; set; } = string.Empty;
}