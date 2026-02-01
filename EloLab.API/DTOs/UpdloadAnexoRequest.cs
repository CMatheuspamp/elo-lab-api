namespace EloLab.API.DTOs;

public class UploadAnexoRequest
{
    public Guid TrabalhoId { get; set; }
    public IFormFile Arquivo { get; set; }
}