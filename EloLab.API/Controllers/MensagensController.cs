using EloLab.API.Data;
using EloLab.API.DTOs;
using EloLab.API.Models;
using EloLab.API.Hubs; // <-- IMPORT NOVO
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR; // <-- IMPORT NOVO
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EloLab.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MensagensController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHubContext<AppHub> _hubContext; // <-- INJETADO

    public MensagensController(AppDbContext context, IHubContext<AppHub> hubContext) // <-- ADICIONADO NO CONSTRUTOR
    {
        _context = context;
        _hubContext = hubContext;
    }

    [HttpGet("trabalho/{trabalhoId}")]
    public async Task<IActionResult> GetMensagens(Guid trabalhoId)
    {
        var mensagens = await _context.Mensagens
            .Where(m => m.TrabalhoId == trabalhoId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        return Ok(mensagens);
    }

    [HttpPost]
    public async Task<IActionResult> EnviarMensagem([FromBody] CriarMensagemRequest request)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                        ?? User.FindFirst("sub")?.Value;
        
        if (!Guid.TryParse(userIdStr, out var userId)) 
            return Unauthorized();

        string nomeRemetente = "Desconhecido";
        
        var lab = await _context.Laboratorios.FirstOrDefaultAsync(l => l.UsuarioId == userId);
        if (lab != null)
        {
            nomeRemetente = lab.Nome;
        }
        else
        {
            var clinica = await _context.Clinicas.FirstOrDefaultAsync(c => c.UsuarioId == userId);
            if (clinica != null) nomeRemetente = clinica.Nome;
        }

        var mensagem = new Mensagem
        {
            TrabalhoId = request.TrabalhoId,
            RemetenteId = userId,
            NomeRemetente = nomeRemetente,
            Texto = request.Texto, 
            CreatedAt = DateTime.UtcNow
        };

        _context.Mensagens.Add(mensagem);
        await _context.SaveChangesAsync();

        // === DISPARAR NOTIFICAÇÃO DE MENSAGEM ===
        var trabMensagem = await _context.Trabalhos
            .Include(t => t.Clinica)
            .Include(t => t.Laboratorio)
            .Include(t => t.Servico)
            .FirstOrDefaultAsync(t => t.Id == request.TrabalhoId);

        if (trabMensagem != null)
        {
            var isLab = User.FindFirst("tipo")?.Value == "Laboratorio";
    
            var destinatarioId = isLab ? trabMensagem.ClinicaId : trabMensagem.LaboratorioId;
            var remetenteNome = isLab ? trabMensagem.Laboratorio?.Nome : trabMensagem.Clinica?.Nome;
            
            // Define o grupo do SignalR para o destinatário correto
            string grupoSignalR = isLab ? $"Clinica_{destinatarioId}" : $"Lab_{destinatarioId}";
    
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

            // === A MÁGICA DO SIGNALR ===
            await _hubContext.Clients.Group(grupoSignalR).SendAsync("NovaNotificacao", notifMensagem);
        }
        
        return Ok(mensagem);
    }
}