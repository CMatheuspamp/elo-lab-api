using EloLab.API.Data;
using EloLab.API.DTOs;
using EloLab.API.Models;
using Microsoft.AspNetCore.Authorization; // <--- Importante adicionar isto
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EloLab.API.Controllers;

[Authorize] // <--- Adicione isto para proteger todo o controlador
[ApiController]
[Route("api/[controller]")]
public class ServicosController : ControllerBase
{
    private readonly AppDbContext _context;

    public ServicosController(AppDbContext context)
    {
        _context = context;
    }

    // [NOVO MÉTODO] GET: api/Servicos (Lista os serviços do Próprio Laboratório Logado)
    // É este que o Frontend "NewJob" vai chamar.
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Servico>>> GetMeusServicos()
    {
        // 1. Descobrir quem está logado
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) userId = User.FindFirst("sub")?.Value;
        
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var usuarioGuid = Guid.Parse(userId);

        // 2. Descobrir qual é o laboratório deste usuário
        var lab = await _context.Laboratorios.FirstOrDefaultAsync(l => l.UsuarioId == usuarioGuid);

        if (lab == null)
        {
            // Se for uma Clínica acessando, retorna vazio (ou lógica futura para clínicas)
            return Ok(new List<Servico>());
        }

        // 3. Retornar os serviços desse laboratório
        return await _context.Servicos
            .Where(s => s.LaboratorioId == lab.Id && s.Ativo)
            .OrderBy(s => s.Nome)
            .ToListAsync();
    }

    // --- MÉTODOS ANTIGOS (MANTIDOS) ---

    // 1. Adicionar um serviço ao menu do laboratório
    [HttpPost]
    public async Task<IActionResult> CriarServico([FromBody] CriarServicoRequest request)
    {
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

    // 2. Listar o menu de um laboratório específico (Público ou para Clínicas)
    [AllowAnonymous] // <--- Opcional: Permite que qualquer um veja o menu se tiver o ID
    [HttpGet("por-laboratorio/{labId}")]
    public async Task<IActionResult> GetServicosPorLaboratorio(Guid labId)
    {
        var servicos = await _context.Servicos
            .Where(s => s.LaboratorioId == labId && s.Ativo)
            .OrderBy(s => s.Nome)
            .ToListAsync();

        return Ok(servicos);
    }
}