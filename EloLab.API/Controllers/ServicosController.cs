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

    // GET: api/Servicos
    [HttpGet]
    public async Task<IActionResult> GetMeusServicos()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        
        // Descobre qual é o Laboratório deste usuário
        var laboratorio = await _context.Laboratorios.FirstOrDefaultAsync(l => l.UsuarioId == userId);
        if (laboratorio == null) return BadRequest("Apenas laboratórios têm serviços.");

        var servicos = await _context.Servicos
            .Where(s => s.LaboratorioId == laboratorio.Id && s.Ativo)
            .OrderBy(s => s.Nome)
            .ToListAsync();

        return Ok(servicos);
    }

    // POST: api/Servicos
    [HttpPost]
    public async Task<IActionResult> CriarServico([FromBody] CriarServicoRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var laboratorio = await _context.Laboratorios.FirstOrDefaultAsync(l => l.UsuarioId == userId);
        if (laboratorio == null) return Unauthorized("Apenas laboratórios podem criar serviços.");

        var servico = new Servico
        {
            LaboratorioId = laboratorio.Id,
            Nome = request.Nome,
            Material = request.Material, // <--- Salvando o Material
            PrecoBase = request.PrecoBase,
            PrazoDiasUteis = request.PrazoDiasUteis,
            Descricao = request.Descricao
        };

        _context.Servicos.Add(servico);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMeusServicos), new { id = servico.Id }, servico);
    }

    // PUT: api/Servicos/{id} (EDITAR)
    [HttpPut("{id}")]
    public async Task<IActionResult> AtualizarServico(Guid id, [FromBody] CriarServicoRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        
        // Verifica se o serviço existe e pertence ao laboratório do usuário logado
        var servico = await _context.Servicos
            .Include(s => s.Laboratorio) // Inclui dados do lab para conferir dono
            .FirstOrDefaultAsync(s => s.Id == id);

        if (servico == null) return NotFound();
        if (servico.Laboratorio?.UsuarioId != userId) return Unauthorized("Este serviço não é seu.");

        // Atualiza os dados
        servico.Nome = request.Nome;
        servico.Material = request.Material; // <--- Atualizando Material
        servico.PrecoBase = request.PrecoBase;
        servico.PrazoDiasUteis = request.PrazoDiasUteis;
        servico.Descricao = request.Descricao;

        await _context.SaveChangesAsync();
        return Ok(servico);
    }

    // DELETE: api/Servicos/{id} (EXCLUIR)
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletarServico(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

        var servico = await _context.Servicos
             .Include(s => s.Laboratorio)
             .FirstOrDefaultAsync(s => s.Id == id);

        if (servico == null) return NotFound();
        if (servico.Laboratorio?.UsuarioId != userId) return Unauthorized();

        // Hard Delete (Remove do banco) ou Soft Delete (s.Ativo = false)
        // Vamos usar Hard Delete para simplificar agora
        _context.Servicos.Remove(servico);
        await _context.SaveChangesAsync();

        return NoContent();
    }
    
    // GET: api/Servicos/laboratorio/{labId}
    // Permite que uma Clínica veja os serviços de um Lab específico para fazer o pedido
    [HttpGet("laboratorio/{labId}")]
    public async Task<IActionResult> GetServicosPorLaboratorio(Guid labId)
    {
        // Apenas usuários logados podem ver
        var servicos = await _context.Servicos
            .Where(s => s.LaboratorioId == labId && s.Ativo)
            .OrderBy(s => s.Nome)
            .ToListAsync();

        return Ok(servicos);
    }
}