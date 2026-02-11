using EloLab.API.Data;
using EloLab.API.DTOs;
using EloLab.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EloLab.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MensagensController : ControllerBase
{
    private readonly AppDbContext _context;

    public MensagensController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/mensagens/trabalho/{id}
    [HttpGet("trabalho/{trabalhoId}")]
    public async Task<IActionResult> GetMensagens(Guid trabalhoId)
    {
        var mensagens = await _context.Mensagens
            .Where(m => m.TrabalhoId == trabalhoId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        return Ok(mensagens);
    }

    // POST: api/mensagens
    [HttpPost]
    public async Task<IActionResult> EnviarMensagem([FromBody] CriarMensagemRequest request)
    {
        // 1. Identificar quem está logado (Do Token)
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                        ?? User.FindFirst("sub")?.Value;
        
        if (!Guid.TryParse(userIdStr, out var userId)) 
            return Unauthorized();

        // 2. Descobrir o Nome do Remetente (Lab ou Clínica?)
        string nomeRemetente = "Desconhecido";
        
        // Tenta achar como Laboratório
        var lab = await _context.Laboratorios.FirstOrDefaultAsync(l => l.UsuarioId == userId);
        if (lab != null)
        {
            nomeRemetente = lab.Nome;
        }
        else
        {
            // Se não é Lab, tenta achar como Clínica
            var clinica = await _context.Clinicas.FirstOrDefaultAsync(c => c.UsuarioId == userId);
            if (clinica != null) nomeRemetente = clinica.Nome;
        }

        // 3. Criar a mensagem
        var mensagem = new Mensagem
        {
            TrabalhoId = request.TrabalhoId,
            RemetenteId = userId,
            NomeRemetente = nomeRemetente,
            Texto = request.Texto, // Agora este campo existe no DTO e no Model!
            CreatedAt = DateTime.UtcNow
        };

        _context.Mensagens.Add(mensagem);
        await _context.SaveChangesAsync();

        // === DISPARAR NOTIFICAÇÃO DE MENSAGEM ===
        // Substitua 'request.TrabalhoId' pela variável correta que usa no seu controller
        var trabMensagem = await _context.Trabalhos
            .Include(t => t.Clinica)
            .Include(t => t.Laboratorio)
            .Include(t => t.Servico)
            .FirstOrDefaultAsync(t => t.Id == request.TrabalhoId);

        if (trabMensagem != null)
        {
            var isLab = User.FindFirst("tipo")?.Value == "Laboratorio";
    
            // Se fui eu (Lab) a enviar, o destinatário é a Clínica, e vice-versa
            var destinatarioId = isLab ? trabMensagem.ClinicaId : trabMensagem.LaboratorioId;
            var remetenteNome = isLab ? trabMensagem.Laboratorio?.Nome : trabMensagem.Clinica?.Nome;
    
            var notifMensagem = new Notificacao
            {
                Id = Guid.NewGuid(),
                UsuarioId = destinatarioId,
                Titulo = "Nova Mensagem 💬",
                Texto = $"{remetenteNome} enviou uma mensagem no trabalho de {trabMensagem.PacienteNome} ({(trabMensagem.Servico?.Nome ?? "Personalizado")}).",
                LinkAction = $"/trabalhos/{trabMensagem.Id}",
                CreatedAt = DateTime.UtcNow,
                Lida = false
            };
            _context.Notificacoes.Add(notifMensagem);
            await _context.SaveChangesAsync();
        }
        
        return Ok(mensagem);
    }
}