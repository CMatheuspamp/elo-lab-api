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

    // LISTAR MEUS SERVIÇOS (Só para Laboratórios verem a sua lista geral)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Servico>>> GetMeusServicos()
    {
        var labIdClaim = User.FindFirst("laboratorioId")?.Value;
        
        if (string.IsNullOrEmpty(labIdClaim) || !Guid.TryParse(labIdClaim, out var labId))
        {
            return Ok(new List<Servico>());
        }

        return await _context.Servicos
            .Where(s => s.LaboratorioId == labId && s.Ativo)
            .OrderBy(s => s.Nome)
            .ToListAsync();
    }

    // LISTAR SERVIÇOS DE UM LABORATÓRIO (Genérico)
    [HttpGet("laboratorio/{labId}")]
    public async Task<ActionResult<IEnumerable<Servico>>> GetServicosDoLab(Guid labId)
    {
        return await _context.Servicos
            .Where(s => s.LaboratorioId == labId && s.Ativo)
            .OrderBy(s => s.Nome)
            .ToListAsync();
    }

    [HttpGet("por-clinica/{clinicaId}")]
    public async Task<IActionResult> GetServicosPorClinica(Guid clinicaId, [FromQuery] Guid? laboratorioId)
    {
        // 1. Identificar quem está a chamar a API
        var userType = User.FindFirst("tipo")?.Value;
        
        // Claims Específicos (IDs da Entidade, não do Login)
        var clinicaIdToken = User.FindFirst("clinicaId")?.Value;
        var labIdToken = User.FindFirst("laboratorioId")?.Value;

        // === VALIDAÇÃO DE SEGURANÇA ===
        
        // Se for CLÍNICA:
        if (userType == "Clinica")
        {
            // Verifica se o ID da clínica na URL bate com o ID da clínica no Token
            if (string.IsNullOrEmpty(clinicaIdToken) || clinicaIdToken.ToLower() != clinicaId.ToString().ToLower())
            {
                // DEBUG: Para você ver no terminal se der erro de novo
                Console.WriteLine($"ERRO 401: Token diz ser clinica {clinicaIdToken}, mas URL pede {clinicaId}");
                return Unauthorized("Você não tem permissão para acessar dados desta clínica.");
            }

            // Se for Clínica, É OBRIGATÓRIO informar qual laboratório quer consultar
            if (!laboratorioId.HasValue)
            {
                return BadRequest("Clínicas precisam informar o 'laboratorioId' na URL.");
            }
        }
        
        // Se for LABORATÓRIO:
        else if (userType == "Laboratorio")
        {
            // O laboratório da URL (vínculo) tem de ser o mesmo do Token
            // Nota: Se o Lab está a ver a clínica X, ele quer ver o vínculo consigo mesmo.
            laboratorioId = Guid.Parse(labIdToken!); 
        }
        else
        {
            return Unauthorized("Tipo de usuário desconhecido.");
        }

        // === BUSCA DADOS ===

        // Preparar a consulta do vínculo
        var vinculo = await _context.LaboratorioClinicas
            .Include(lc => lc.TabelaPreco)
                .ThenInclude(tp => tp.Itens)
                    .ThenInclude(i => i.Servico) 
            .Where(lc => lc.ClinicaId == clinicaId && lc.LaboratorioId == laboratorioId && lc.Ativo)
            .FirstOrDefaultAsync();

        // Se não achou vínculo (ex: acabou de selecionar o lab e a internet falhou ou não são parceiros)
        if (vinculo == null) 
        {
            // Retorna lista vazia para não quebrar o frontend
            return Ok(new List<object>()); 
        }

        // === CENÁRIO A: TEM TABELA ASSOCIADA ===
        if (vinculo.TabelaPreco != null && vinculo.TabelaPreco.Itens.Any())
        {
            var servicosRestritos = vinculo.TabelaPreco.Itens
                .Where(item => item.Servico != null && item.Servico.Ativo) 
                .Select(item => new
                {
                    Id = item.ServicoId,
                    Nome = item.Servico!.Nome,
                    Material = item.Servico.Material,
                    Descricao = item.Servico.Descricao,
                    PrazoDiasUteis = item.Servico.PrazoDiasUteis,
                    FotoUrl = item.Servico.FotoUrl,
                    PrecoBase = item.Preco, // Preço da Tabela
                    IsTabela = true 
                })
                .OrderBy(s => s.Nome)
                .ToList();

            return Ok(servicosRestritos);
        }

        // === CENÁRIO B: NÃO TEM TABELA (Lista Padrão do Lab) ===
        var todosServicos = await _context.Servicos
            .Where(s => s.LaboratorioId == vinculo.LaboratorioId && s.Ativo)
            .OrderBy(s => s.Nome)
            .Select(s => new 
            {
                Id = s.Id,
                Nome = s.Nome,
                Material = s.Material,
                Descricao = s.Descricao,
                PrazoDiasUteis = s.PrazoDiasUteis,
                FotoUrl = s.FotoUrl,
                PrecoBase = s.PrecoBase, // Preço Original
                IsTabela = false
            })
            .ToListAsync();

        return Ok(todosServicos);
    }
    
    // =================================================================================

    // CRIAR SERVIÇO
    [HttpPost]
    public async Task<ActionResult<Servico>> PostServico(CriarServicoRequest request)
    {
        var labIdClaim = User.FindFirst("laboratorioId")?.Value;

        if (string.IsNullOrEmpty(labIdClaim) || !Guid.TryParse(labIdClaim, out var labId))
            return BadRequest("Apenas laboratórios podem criar serviços.");

        var servico = new Servico
        {
            LaboratorioId = labId,
            Nome = request.Nome,
            Material = request.Material,
            Descricao = request.Descricao,
            PrecoBase = request.PrecoBase,
            PrazoDiasUteis = request.PrazoDiasUteis,
            Ativo = true,
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

        var labIdClaim = User.FindFirst("laboratorioId")?.Value;
        if (labIdClaim == null || servico.LaboratorioId.ToString() != labIdClaim)
            return Forbid();

        servico.Nome = request.Nome;
        servico.Material = request.Material;
        servico.Descricao = request.Descricao;
        servico.PrecoBase = request.PrecoBase;
        servico.PrazoDiasUteis = request.PrazoDiasUteis;
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

        try
        {
            _context.Servicos.Remove(servico);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (DbUpdateException)
        {
            return BadRequest(new { erro = "Este serviço não pode ser apagado porque já faz parte do histórico de um ou mais pedidos. Se já não o utiliza, recomendamos editar o nome (Ex: 'Inativo - Zircónia')." });
        }
        catch (Exception)
        {
            return StatusCode(500, new { erro = "Ocorreu um erro interno ao tentar excluir o serviço." });
        }
    }
}