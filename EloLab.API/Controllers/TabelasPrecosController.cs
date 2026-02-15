using EloLab.API.Data;
using EloLab.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using EloLab.API.DTOs;

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
    
    // =======================================================
    // 1. EDITAR NOME DA TABELA
    // =======================================================
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> EditarTabela(Guid id, [FromBody] NomeTabelaRequest request)
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var lab = await _context.Laboratorios.FirstOrDefaultAsync(l => l.UsuarioId == userId);
        if (lab == null) return Forbid();

        // Procura a tabela garantindo que pertence a este laboratório
        var tabela = await _context.TabelasPrecos.FirstOrDefaultAsync(t => t.Id == id && t.LaboratorioId == lab.Id);
        if (tabela == null) return NotFound(new { mensagem = "Tabela não encontrada." });

        tabela.Nome = request.Nome;
        await _context.SaveChangesAsync();

        return Ok(tabela);
    }

    // =======================================================
    // 2. DUPLICAR TABELA
    // =======================================================
    [HttpPost("{id}/duplicar")]
    [Authorize]
    public async Task<IActionResult> DuplicarTabela(Guid id)
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var lab = await _context.Laboratorios.FirstOrDefaultAsync(l => l.UsuarioId == userId);
        if (lab == null) return Forbid();

        // Carrega a tabela original e os seus TabelaItem
        var tabelaOriginal = await _context.TabelasPrecos
            .Include(t => t.Itens)
            .FirstOrDefaultAsync(t => t.Id == id && t.LaboratorioId == lab.Id);

        if (tabelaOriginal == null) return NotFound(new { mensagem = "Tabela não encontrada." });

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Criar a nova Tabela (Usando as propriedades corretas do teu Model)
            var novaTabela = new TabelaPreco
            {
                Id = Guid.NewGuid(),
                LaboratorioId = tabelaOriginal.LaboratorioId,
                Nome = tabelaOriginal.Nome + " (Cópia)",
                CreatedAt = DateTime.UtcNow // Nome corrigido!
            };
            
            _context.TabelasPrecos.Add(novaTabela);
            await _context.SaveChangesAsync(); // Para o ID existir na BD

            // 2. Copiar os itens (Usando TabelaItem)
            if (tabelaOriginal.Itens != null && tabelaOriginal.Itens.Any())
            {
                var novosItens = tabelaOriginal.Itens.Select(item => new TabelaItem
                {
                    Id = Guid.NewGuid(),
                    TabelaPrecoId = novaTabela.Id,
                    ServicoId = item.ServicoId,
                    Preco = item.Preco
                }).ToList();

                _context.AddRange(novosItens); // Adiciona todos de uma vez (não importa o nome do DbSet)
                await _context.SaveChangesAsync();
            }

            await transaction.CommitAsync();
            
            // Devolver a tabela novinha em folha para o Frontend a desenhar na hora
            return Ok(novaTabela);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            Console.WriteLine($"Erro ao duplicar: {ex.Message}");
            return StatusCode(500, new { mensagem = "Erro interno ao duplicar tabela." });
        }
    }

    // =======================================================
    // 3. ADICIONAR TODOS OS SERVIÇOS DO CATÁLOGO
    // =======================================================
    [HttpPost("{id}/adicionar-todos")]
    [Authorize]
    public async Task<IActionResult> AdicionarTodosServicos(Guid id, [FromQuery] decimal desconto = 0)
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var lab = await _context.Laboratorios.FirstOrDefaultAsync(l => l.UsuarioId == userId);
        if (lab == null) return Forbid();

        var tabela = await _context.TabelasPrecos
            .Include(t => t.Itens)
            .FirstOrDefaultAsync(t => t.Id == id && t.LaboratorioId == lab.Id);

        if (tabela == null) return NotFound(new { mensagem = "Tabela não encontrada." });

        // Vai buscar o catálogo inteiro de serviços do Laboratório
        var servicosCatalogo = await _context.Servicos
            .Where(s => s.LaboratorioId == lab.Id && s.Ativo)
            .ToListAsync();

        int adicionados = 0;

        foreach (var servico in servicosCatalogo)
        {
            // Verifica se o serviço já NÃO EXISTE na tabela para evitar duplicados
            if (!tabela.Itens.Any(i => i.ServicoId == servico.Id))
            {
                // Calcula o preço com o desconto (Ex: 10% de desconto)
                decimal precoFinal = servico.PrecoBase;
                if (desconto > 0 && desconto <= 100)
                {
                    precoFinal = servico.PrecoBase - (servico.PrecoBase * (desconto / 100m));
                }

                var novoItem = new TabelaItem // Nome do Model Corrigido
                {
                    Id = Guid.NewGuid(),
                    TabelaPrecoId = tabela.Id,
                    ServicoId = servico.Id,
                    Preco = precoFinal
                };

                _context.Add(novoItem);
                adicionados++;
            }
        }

        if (adicionados > 0)
        {
            await _context.SaveChangesAsync();
        }

        return Ok(new { mensagem = $"{adicionados} serviços importados com sucesso." });
    }
}