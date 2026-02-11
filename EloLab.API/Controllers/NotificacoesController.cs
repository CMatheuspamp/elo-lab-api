using EloLab.API.Data;
using EloLab.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EloLab.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotificacoesController : ControllerBase
{
    private readonly AppDbContext _context;

    public NotificacoesController(AppDbContext context)
    {
        _context = context;
    }

    // 1. Ir buscar as notificações do utilizador logado
    [HttpGet]
    public async Task<IActionResult> GetMinhasNotificacoes()
    {
        // Tenta pegar o ID do perfil específico (Lab ou Clínica)
        var labId = User.FindFirst("laboratorioId")?.Value;
        var clinicaId = User.FindFirst("clinicaId")?.Value;

        // Se não tiver nenhum dos dois, usa o ID do usuário genérico (fallback)
        var userIdString = labId ?? clinicaId ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var targetId)) 
            return Unauthorized();

        var notificacoes = await _context.Notificacoes
            .Where(n => n.UsuarioId == targetId) // Agora compara com o ID correto!
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync();

        return Ok(notificacoes);
    }

    // 2. Marcar uma notificação específica como lida (ao clicar nela)
    [HttpPatch("{id}/lida")]
    public async Task<IActionResult> MarcarComoLida(Guid id)
    {
        var notificacao = await _context.Notificacoes.FindAsync(id);
        if (notificacao == null) return NotFound();

        notificacao.Lida = true;
        await _context.SaveChangesAsync();

        return Ok();
    }

    // 3. Marcar todas como lidas (Botão "Limpar tudo")
    [HttpPatch("marcar-todas-lidas")]
    public async Task<IActionResult> MarcarTodasComoLidas()
    {
        var labId = User.FindFirst("laboratorioId")?.Value;
        var clinicaId = User.FindFirst("clinicaId")?.Value;
        var userIdString = labId ?? clinicaId ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var targetId)) 
            return Unauthorized();

        var naoLidas = await _context.Notificacoes
            .Where(n => n.UsuarioId == targetId && !n.Lida)
            .ToListAsync();

        foreach (var notif in naoLidas)
        {
            notif.Lida = true;
        }

        await _context.SaveChangesAsync();
        return Ok();
    }
    
    // 4. Apagar uma notificação específica
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNotificacao(Guid id)
    {
        var notificacao = await _context.Notificacoes.FindAsync(id);
        if (notificacao == null) return NotFound();

        _context.Notificacoes.Remove(notificacao);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // 5. Apagar TODAS as notificações do utilizador (Limpar tudo)
    [HttpDelete("todas")]
    public async Task<IActionResult> DeleteTodas()
    {
        // Mesma lógica de descobrir quem é o utilizador
        var labId = User.FindFirst("laboratorioId")?.Value;
        var clinicaId = User.FindFirst("clinicaId")?.Value;
        var userIdString = labId ?? clinicaId ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var targetId)) 
            return Unauthorized();

        var todas = await _context.Notificacoes
            .Where(n => n.UsuarioId == targetId)
            .ToListAsync();

        _context.Notificacoes.RemoveRange(todas);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}