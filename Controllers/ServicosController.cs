using EloLab.API.Data;
using EloLab.API.DTOs;
using EloLab.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EloLab.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicosController : ControllerBase
{
    private readonly AppDbContext _context;

    public ServicosController(AppDbContext context)
    {
        _context = context;
    }

    // 1. Adicionar um serviço ao menu do laboratório
    [HttpPost]
    public async Task<IActionResult> CriarServico([FromBody] CriarServicoRequest request)
    {
        // Validação: Preço não pode ser negativo
        if (request.PrecoBase < 0)
            return BadRequest("O preço não pode ser negativo.");

        var novoServico = new Servico
        {
            LaboratorioId = request.LaboratorioId,
            Nome = request.Nome,
            Descricao = request.Descricao,
            PrecoBase = request.PrecoBase,
            PrazoDiasUteis = request.PrazoDiasUteis
        };

        _context.Servicos.Add(novoServico);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetServicosPorLaboratorio), new { labId = request.LaboratorioId }, novoServico);
    }

    // 2. Listar o menu de um laboratório (Para a clínica ver o que pode pedir)
    [HttpGet("por-laboratorio/{labId}")]
    public async Task<IActionResult> GetServicosPorLaboratorio(Guid labId)
    {
        var servicos = await _context.Servicos
            .Where(s => s.LaboratorioId == labId && s.Ativo)
            .OrderBy(s => s.Nome) // Ordenar alfabeticamente fica mais bonito no frontend
            .ToListAsync();

        return Ok(servicos);
    }
}