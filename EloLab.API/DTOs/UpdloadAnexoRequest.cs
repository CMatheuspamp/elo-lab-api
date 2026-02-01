using System.ComponentModel.DataAnnotations;

namespace EloLab.API.DTOs;

public class UploadAnexoRequest
{
    [Required]
    public Guid TrabalhoId { get; set; }
    
    [Required]
    public IFormFile Arquivo { get; set; }
}