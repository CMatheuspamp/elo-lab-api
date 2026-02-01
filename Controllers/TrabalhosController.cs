using EloLab.API.Data;
using EloLab.API.DTOs;
using EloLab.API.Models;
using EloLab.API.Models.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EloLab.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TrabalhosController : ControllerBase
{
    private readonly AppDbContext _context;

    public TrabalhosController(AppDbContext context)
    {
        _context = context;
    }

    // 1. CRIAR PEDIDO (Com lógica de Preço Inteligente)
    [HttpPost]
    public async Task<IActionResult> CriarTrabalho([FromBody] CriarTrabalhoRequest request)
    {
        decimal valorFinalCalculado = 0;

        // LÓGICA DE PREÇO:
        // Prioridade 1: Preço definido manualmente no pedido (Override)
        if (request.ValorPersonalizado.HasValue)
        {
            valorFinalCalculado = request.ValorPersonalizado.Value;
        }
        // Prioridade 2: Preço vindo da tabela de serviços
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
            // Postgres prefere datas em UTC
            DataEntregaPrevista = request.DataEntrega.ToUniversalTime(), 
            
            ValorFinal = valorFinalCalculado,
            
            Status = StatusTrabalho.Pendente.ToString(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Trabalhos.Add(trabalho);
        await _context.SaveChangesAsync();

        return Ok(trabalho);
    }

    // 2. LISTAR TRABALHOS DO LABORATÓRIO (Dashboard)
    [HttpGet("laboratorio/{labId}")]
    public async Task<IActionResult> GetTrabalhosDoLaboratorio(Guid labId)
    {
        var trabalhos = await _context.Trabalhos
            .Where(t => t.LaboratorioId == labId)
            .OrderByDescending(t => t.CreatedAt) // Mais recentes primeiro
            .ToListAsync();

        return Ok(trabalhos);
    }

    // 3. MUDAR STATUS (Workflow)
    [HttpPatch("{trabalhoId}/status")]
    public async Task<IActionResult> AtualizarStatus(Guid trabalhoId, [FromBody] string novoStatus)
    {
        var trabalho = await _context.Trabalhos.FindAsync(trabalhoId);
        if (trabalho == null) return NotFound("Trabalho não encontrado.");

        // Verifica se o texto enviado corresponde a um status válido do Enum
        if (!Enum.TryParse<StatusTrabalho>(novoStatus, true, out _))
        {
            return BadRequest($"Status inválido. Status permitidos: {string.Join(", ", Enum.GetNames(typeof(StatusTrabalho)))}");
        }

        trabalho.Status = novoStatus;
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Status atualizado com sucesso", novoStatus = trabalho.Status });
    }
}