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
public class TabelasPrecosController : ControllerBase
{
    private readonly AppDbContext _context;

    public TabelasPrecosController(AppDbContext context)
    {
        _context = context;
    }

    // 1. Listar todas as tabelas do meu laboratório
    [HttpGet]
    public async Task<IActionResult> GetMinhasTabelas()
    {
        var labId = User.FindFirst("laboratorioId")?.Value;
        if (labId == null) return Unauthorized();

        var tabelas = await _context.TabelasPrecos
            .Include(t => t.Itens) // Traz quantos itens tem
            .Where(t => t.LaboratorioId == Guid.Parse(labId))
            .OrderBy(t => t.Nome)
            .ToListAsync();

        return Ok(tabelas);
    }

    // 2. Criar uma nova tabela (Só o nome)
    [HttpPost]
    public async Task<IActionResult> CriarTabela([FromBody] TabelaPreco request)
    {
        var labId = User.FindFirst("laboratorioId")?.Value;
        if (labId == null) return Unauthorized();

        var novaTabela = new TabelaPreco
        {
            Id = Guid.NewGuid(),
            LaboratorioId = Guid.Parse(labId),
            Nome = request.Nome,
            CreatedAt = DateTime.UtcNow
        };

        _context.TabelasPrecos.Add(novaTabela);
        await _context.SaveChangesAsync();

        return Ok(novaTabela);
    }

    // 3. Adicionar ou Atualizar um Preço Específico numa Tabela
    [HttpPost("{tabelaId}/itens")]
    public async Task<IActionResult> DefinirPreco(Guid tabelaId, [FromBody] TabelaItem request)
    {
        // Verificar se a tabela é minha
        var labId = User.FindFirst("laboratorioId")?.Value;
        var tabela = await _context.TabelasPrecos.FindAsync(tabelaId);
        
        if (tabela == null || tabela.LaboratorioId != Guid.Parse(labId!))
            return Unauthorized("Tabela não encontrada ou sem permissão.");

        // Verifica se já existe preço para este serviço nesta tabela
        var itemExistente = await _context.TabelaItens
            .FirstOrDefaultAsync(i => i.TabelaPrecoId == tabelaId && i.ServicoId == request.ServicoId);

        if (itemExistente != null)
        {
            // Atualiza
            itemExistente.Preco = request.Preco;
        }
        else
        {
            // Cria novo
            var novoItem = new TabelaItem
            {
                Id = Guid.NewGuid(),
                TabelaPrecoId = tabelaId,
                ServicoId = request.ServicoId,
                Preco = request.Preco
            };
            _context.TabelaItens.Add(novoItem);
        }

        await _context.SaveChangesAsync();
        return Ok();
    }
    
    // 4. Buscar detalhes da tabela (com os preços e nomes dos serviços)
    [HttpGet("{id}")]
    public async Task<IActionResult> GetDetalhesTabela(Guid id)
    {
        var tabela = await _context.TabelasPrecos
            .Include(t => t.Itens)
                .ThenInclude(i => i.Servico) // Traz o nome do serviço
            .FirstOrDefaultAsync(t => t.Id == id);

        if (tabela == null) return NotFound();

        return Ok(tabela);
    }
    
    // 5. Apagar uma Tabela inteira
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTabela(Guid id)
    {
        var labId = User.FindFirst("laboratorioId")?.Value;
        
        var tabela = await _context.TabelasPrecos.FindAsync(id);
        if (tabela == null || tabela.LaboratorioId != Guid.Parse(labId!))
            return NotFound("Tabela não encontrada ou sem permissão.");

        _context.TabelasPrecos.Remove(tabela);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // 6. Remover um Serviço (Item) de uma Tabela
    [HttpDelete("{tabelaId}/itens/{itemId}")]
    public async Task<IActionResult> DeleteItem(Guid tabelaId, Guid itemId)
    {
        var labId = User.FindFirst("laboratorioId")?.Value;

        // Verifica dono da tabela
        var tabela = await _context.TabelasPrecos.FindAsync(tabelaId);
        if (tabela == null || tabela.LaboratorioId != Guid.Parse(labId!))
            return Unauthorized();

        var item = await _context.TabelaItens.FindAsync(itemId);
        if (item == null) return NotFound();

        _context.TabelaItens.Remove(item);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}