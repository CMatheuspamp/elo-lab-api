using EloLab.API.Data;
using EloLab.API.DTOs; // Certifique-se de ter o DTO criado (veja abaixo)
using EloLab.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EloLab.API.Controllers;

[Authorize]
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

    // =============================================================
    // 1. UPLOAD DE ARQUIVO (Supabase + Banco)
    // =============================================================
    [HttpPost("upload")]
    public async Task<IActionResult> UploadAnexo([FromForm] UploadAnexoRequest request)
    {
        // A. Validações Básicas
        if (request.Arquivo == null || request.Arquivo.Length == 0)
            return BadRequest("Nenhum arquivo enviado.");

        var trabalho = await _context.Trabalhos.FindAsync(request.TrabalhoId);
        if (trabalho == null) return NotFound("Trabalho não encontrado.");

        try
        {
            // B. Preparar Nome Único (Evita substituição de arquivos com mesmo nome)
            // Ex: "uuid-trabalho/uuid-arquivo-nome.stl" (Usar barra cria pastas virtuais no Supabase)
            var nomeArquivo = $"{request.TrabalhoId}/{Guid.NewGuid()}-{request.Arquivo.FileName}";

            // C. Converter para Bytes
            using var memoryStream = new MemoryStream();
            await request.Arquivo.CopyToAsync(memoryStream);
            var bytes = memoryStream.ToArray();

            // D. Enviar para o Supabase Storage
            // IMPORTANTE: O nome do bucket deve ser exato ao criado no painel ("trabalhos-arquivos")
            var bucket = _supabaseClient.Storage.From("trabalhos-arquivos");
            
            await bucket.Upload(bytes, nomeArquivo);

            // E. Obter URL Pública
            var urlPublica = bucket.GetPublicUrl(nomeArquivo);

            // F. Salvar Metadados no Banco de Dados
            var anexo = new Anexo
            {
                TrabalhoId = request.TrabalhoId,
                NomeArquivo = request.Arquivo.FileName,
                Url = urlPublica,
                TipoArquivo = request.Arquivo.ContentType, // Ex: application/pdf, image/png
                TamanhoBytes = request.Arquivo.Length,
                CreatedAt = DateTime.UtcNow
            };

            _context.Anexos.Add(anexo);
            await _context.SaveChangesAsync();

            return Ok(anexo);
        }
        catch (Exception ex)
        {
            // Logar o erro real no console para debug
            Console.WriteLine($"Erro no Upload: {ex.Message}");
            return StatusCode(500, $"Erro ao fazer upload: {ex.Message}");
        }
    }

    // =============================================================
    // 2. LISTAR ANEXOS DE UM TRABALHO
    // =============================================================
    [HttpGet("trabalho/{trabalhoId}")]
    public async Task<IActionResult> GetAnexosDoTrabalho(Guid trabalhoId)
    {
        var anexos = await _context.Anexos
            .Where(a => a.TrabalhoId == trabalhoId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return Ok(anexos);
    }

    // =============================================================
    // 3. DELETAR ANEXO (Opcional, mas útil)
    // =============================================================
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletarAnexo(Guid id)
    {
        var anexo = await _context.Anexos.FindAsync(id);
        if (anexo == null) return NotFound();

        // Nota: Idealmente deletaríamos do Supabase também, mas para MVP 
        // deletar do banco já remove o acesso ao link.
        
        _context.Anexos.Remove(anexo);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}