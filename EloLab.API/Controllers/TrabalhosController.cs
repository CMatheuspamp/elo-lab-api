using EloLab.API.Data;
using EloLab.API.DTOs;
using EloLab.API.Models;
using EloLab.API.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EloLab.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TrabalhosController : ControllerBase
{
    private readonly AppDbContext _context;

    public TrabalhosController(AppDbContext context)
    {
        _context = context;
    }

    // =============================================================
    // 1. LISTAR MEUS TRABALHOS (Com dados completos)
    // =============================================================
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Trabalho>>> GetTrabalhos()
    {
        // A. Quem está a chamar?
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) userId = User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var usuarioGuid = Guid.Parse(userId);

        // B. Verificação: É um LABORATÓRIO?
        var meuLab = await _context.Laboratorios
            .FirstOrDefaultAsync(l => l.UsuarioId == usuarioGuid);

        if (meuLab != null)
        {
            return await _context.Trabalhos
                .Where(t => t.LaboratorioId == meuLab.Id)
                .Include(t => t.Clinica) // Quem pediu?
                .Include(t => t.Servico) // O que é? <--- ADICIONADO
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        // C. Verificação: É uma CLÍNICA?
        var minhaClinica = await _context.Clinicas
            .FirstOrDefaultAsync(c => c.UsuarioId == usuarioGuid);

        if (minhaClinica != null)
        {
            return await _context.Trabalhos
                .Where(t => t.ClinicaId == minhaClinica.Id)
                .Include(t => t.Laboratorio) // Quem vai fazer?
                .Include(t => t.Servico)     // O que é? <--- ADICIONADO
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        // D. Nada encontrado
        return Ok(new List<Trabalho>());
    }

    // =============================================================
    // 2. CRIAR PEDIDO
    // =============================================================
    [HttpPost]
    public async Task<IActionResult> CriarTrabalho([FromBody] CriarTrabalhoRequest request)
    {
        decimal valorFinalCalculado = 0;

        if (request.ValorPersonalizado.HasValue)
        {
            valorFinalCalculado = request.ValorPersonalizado.Value;
        }
        else if (request.ServicoId.HasValue)
        {
            var servico = await _context.Servicos.FindAsync(request.ServicoId.Value);
            if (servico != null)
            {
                valorFinalCalculado = servico.PrecoBase;
            }
        }

        var trabalho = new Trabalho
        {
            LaboratorioId = request.LaboratorioId,
            ClinicaId = request.ClinicaId,
            ServicoId = request.ServicoId,
            PacienteNome = request.PacienteNome,
            Dentes = request.Dentes,
            CorDente = request.CorDente,
            DescricaoPersonalizada = request.Observacoes,
            DataEntregaPrevista = request.DataEntrega.ToUniversalTime(),
            ValorFinal = valorFinalCalculado,
            Status = StatusTrabalho.Pendente.ToString(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Trabalhos.Add(trabalho);
        await _context.SaveChangesAsync();

        return Ok(trabalho);
    }

    // =============================================================
    // 3. MUDAR STATUS
    // =============================================================
    [HttpPatch("{trabalhoId}/status")]
    public async Task<IActionResult> AtualizarStatus(Guid trabalhoId, [FromBody] string novoStatus)
    {
        var trabalho = await _context.Trabalhos.FindAsync(trabalhoId);
        if (trabalho == null) return NotFound("Trabalho não encontrado.");

        if (!Enum.TryParse<StatusTrabalho>(novoStatus, true, out _))
        {
            return BadRequest($"Status inválido. Permitidos: {string.Join(", ", Enum.GetNames(typeof(StatusTrabalho)))}");
        }

        trabalho.Status = novoStatus;
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Status atualizado com sucesso", novoStatus = trabalho.Status });
    }
}