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
public class ServicosController : ControllerBase
{
    private readonly AppDbContext _context;

    public ServicosController(AppDbContext context)
    {
        _context = context;
    }

    // LISTAR MEUS SERVIÇOS (Só para Laboratórios)
    [HttpGet("meus-servicos")] // Rota específica para o dono
    [HttpGet] // Rota padrão também serve
    public async Task<ActionResult<IEnumerable<Servico>>> GetMeusServicos()
    {
        var labIdClaim = User.FindFirst("laboratorioId")?.Value;
        
        if (string.IsNullOrEmpty(labIdClaim) || !Guid.TryParse(labIdClaim, out var labId))
        {
            // Se não for Lab, retorna lista vazia.
            return Ok(new List<Servico>());
        }

        return await _context.Servicos
            .Where(s => s.LaboratorioId == labId && s.Ativo)
            .ToListAsync();
    }

    // LISTAR SERVIÇOS DE UM LABORATÓRIO (Para Clínicas verem)
    [HttpGet("laboratorio/{labId}")]
    public async Task<ActionResult<IEnumerable<Servico>>> GetServicosDoLab(Guid labId)
    {
        return await _context.Servicos
            .Where(s => s.LaboratorioId == labId && s.Ativo)
            .ToListAsync();
    }

    // CRIAR SERVIÇO
    [HttpPost]
    public async Task<ActionResult<Servico>> PostServico(CriarServicoRequest request)
    {
        var labIdClaim = User.FindFirst("laboratorioId")?.Value;

        if (string.IsNullOrEmpty(labIdClaim) || !Guid.TryParse(labIdClaim, out var labId))
            return BadRequest("Apenas laboratórios podem criar serviços.");

        var servico = new Servico
        {
            LaboratorioId = labId, // Pega o ID automático do Token!
            Nome = request.Nome,
            Material = request.Material,
            Descricao = request.Descricao,
            PrecoBase = request.PrecoBase,
            PrazoDiasUteis = request.PrazoDiasUteis,
            Ativo = true,
            // === NOVO: Grava a URL da foto ===
            FotoUrl = request.FotoUrl 
        };

        _context.Servicos.Add(servico);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetMeusServicos", new { id = servico.Id }, servico);
    }

    // ATUALIZAR
    [HttpPut("{id}")]
    public async Task<IActionResult> PutServico(Guid id, CriarServicoRequest request)
    {
        var servico = await _context.Servicos.FindAsync(id);
        if (servico == null) return NotFound();

        // Segurança: Verificar se o serviço pertence ao laboratório logado
        var labIdClaim = User.FindFirst("laboratorioId")?.Value;
        if (labIdClaim == null || servico.LaboratorioId.ToString() != labIdClaim)
            return Forbid();

        servico.Nome = request.Nome;
        servico.Material = request.Material;
        servico.Descricao = request.Descricao;
        servico.PrecoBase = request.PrecoBase;
        servico.PrazoDiasUteis = request.PrazoDiasUteis;
        
        // === NOVO: Atualiza a URL da foto ===
        servico.FotoUrl = request.FotoUrl; 

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETAR
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteServico(Guid id)
    {
        var servico = await _context.Servicos.FindAsync(id);
        if (servico == null) return NotFound();

        var labIdClaim = User.FindFirst("laboratorioId")?.Value;
        if (labIdClaim == null || servico.LaboratorioId.ToString() != labIdClaim)
            return Forbid();

        _context.Servicos.Remove(servico);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}