using EloLab.API.Data;
using EloLab.API.DTOs;
using EloLab.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EloLab.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MensagensController : ControllerBase
{
    private readonly AppDbContext _context;

    public MensagensController(AppDbContext context)
    {
        _context = context;
    }

    // 1. ENVIAR MENSAGEM
    [HttpPost]
    public async Task<IActionResult> EnviarMensagem([FromBody] CriarMensagemRequest request)
    {
        // Validação: O trabalho existe?
        var trabalhoExiste = await _context.Trabalhos.AnyAsync(t => t.Id == request.TrabalhoId);
        if (!trabalhoExiste) return NotFound("Trabalho não encontrado.");

        if (string.IsNullOrWhiteSpace(request.Conteudo))
            return BadRequest("A mensagem não pode estar vazia.");

        var novaMensagem = new Mensagem
        {
            TrabalhoId = request.TrabalhoId,
            RemetenteId = request.RemetenteId, // Num app real, pegamos do User.Identity
            Conteudo = request.Conteudo,
            Lida = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Mensagens.Add(novaMensagem);
        await _context.SaveChangesAsync();

        return Ok(novaMensagem);
    }

    // 2. LER HISTÓRICO (Chat)
    [HttpGet("trabalho/{trabalhoId}")]
    public async Task<IActionResult> GetMensagensDoTrabalho(Guid trabalhoId)
    {
        var mensagens = await _context.Mensagens
            .Where(m => m.TrabalhoId == trabalhoId)
            .OrderBy(m => m.CreatedAt) // Do mais antigo para o mais novo (fluxo de chat)
            .ToListAsync();

        return Ok(mensagens);
    }
}