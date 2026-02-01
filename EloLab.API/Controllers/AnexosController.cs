using EloLab.API.Data;
using EloLab.API.DTOs;
using EloLab.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EloLab.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnexosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly Supabase.Client _supabaseClient;

    public AnexosController(AppDbContext context, Supabase.Client supabaseClient)
    {
        _context = context;
        _supabaseClient = supabaseClient;
    }

    // POST: api/anexos/upload
    // Usa o DTO 'UploadAnexoRequest' para agrupar o ID e o Arquivo, o que corrige o erro do Swagger
    [HttpPost("upload")]
    public async Task<IActionResult> UploadAnexo([FromForm] UploadAnexoRequest request)
    {
        // 1. Validações básicas
        if (request.Arquivo == null || request.Arquivo.Length == 0)
            return BadRequest("Nenhum arquivo enviado.");

        var trabalho = await _context.Trabalhos.FindAsync(request.TrabalhoId);
        if (trabalho == null) return NotFound("Trabalho não encontrado.");

        // 2. Define um nome único para o arquivo para evitar substituições
        // Ex: id-do-trabalho_uuid-aleatorio_foto.jpg
        var nomeArquivo = $"{request.TrabalhoId}_{Guid.NewGuid()}_{request.Arquivo.FileName}";

        // 3. Converte o arquivo recebido para um array de bytes (formato que o Supabase aceita)
        using var memoryStream = new MemoryStream();
        await request.Arquivo.CopyToAsync(memoryStream);
        var bytes = memoryStream.ToArray();

        // 4. Envia o arquivo para o Bucket "trabalhos" no Supabase Storage
        await _supabaseClient.Storage
            .From("trabalhos")
            .Upload(bytes, nomeArquivo);

        // 5. Obtém o Link Público da imagem para guardarmos no banco
        var urlPublica = _supabaseClient.Storage
            .From("trabalhos")
            .GetPublicUrl(nomeArquivo);

        // 6. Salva os dados do anexo no PostgreSQL
        var anexo = new Anexo
        {
            TrabalhoId = request.TrabalhoId,
            NomeArquivo = request.Arquivo.FileName,
            Url = urlPublica,
            TamanhoBytes = request.Arquivo.Length,
            CreatedAt = DateTime.UtcNow
        };

        _context.Anexos.Add(anexo);
        await _context.SaveChangesAsync();

        return Ok(anexo);
    }

    // GET: api/anexos/trabalho/{trabalhoId}
    // Lista todas as fotos/arquivos de um trabalho específico
    [HttpGet("trabalho/{trabalhoId}")]
    public async Task<IActionResult> GetAnexosDoTrabalho(Guid trabalhoId)
    {
        var anexos = await _context.Anexos
            .Where(a => a.TrabalhoId == trabalhoId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return Ok(anexos);
    }
}