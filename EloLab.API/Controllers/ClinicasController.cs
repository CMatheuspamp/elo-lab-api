using EloLab.API.Data;
using EloLab.API.DTOs;
using EloLab.API.Models;
using Microsoft.AspNetCore.Authorization; 
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EloLab.API.Controllers;

[Authorize] 
[ApiController]
[Route("api/[controller]")]
public class ClinicasController : ControllerBase
{
    private readonly AppDbContext _context;

    public ClinicasController(AppDbContext context)
    {
        _context = context;
    }

    // REMOVIDO: O método 'GetMinhasClinicas' antigo que causava conflito.
    // Agora o 'GetClinicasDoLaboratorio' abaixo é o único dono do GET /.

    [HttpGet]
    public async Task<IActionResult> GetClinicasDoLaboratorio()
    {
        try 
        {
            var labId = User.FindFirst("laboratorioId")?.Value;
            if (string.IsNullOrEmpty(labId)) return Unauthorized();
            var labGuid = Guid.Parse(labId);

            var clinicas = await _context.LaboratorioClinicas
                .Where(lc => lc.LaboratorioId == labGuid && lc.Ativo)
                .Include(lc => lc.Clinica)
                .Include(lc => lc.TabelaPreco) // Traz a tabela associada
                .Select(lc => new 
                {
                    Id = lc.Clinica.Id,
                    Nome = lc.Clinica.Nome,
                    EmailContato = lc.Clinica.EmailContato,
                    Telefone = lc.Clinica.Telefone,
                    Nif = lc.Clinica.Nif,
                    Endereco = lc.Clinica.Endereco,
                    UsuarioId = lc.Clinica.UsuarioId,
                    
                    // Dados da Tabela de Preços
                    TabelaPrecoId = lc.TabelaPrecoId,
                    NomeTabela = lc.TabelaPreco == null ? "Padrão" : lc.TabelaPreco.Nome
                })
                .OrderBy(c => c.Nome)
                .ToListAsync();

            return Ok(clinicas);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ERRO CRÍTICO NO GET CLINICAS: {ex.Message}");
            if (ex.InnerException != null) Console.WriteLine(ex.InnerException.Message);
            return StatusCode(500, "Erro interno no servidor.");
        }
    }

    [HttpPost]
    public async Task<IActionResult> CriarClinica([FromBody] CriarClinicaRequest request)
    {
        // Inicia Transação para garantir integridade
        using var transaction = await _context.Database.BeginTransactionAsync();
        try 
        {
            var labExiste = await _context.Laboratorios.AnyAsync(l => l.Id == request.LaboratorioId);
            if (!labExiste) return BadRequest("Laboratório não encontrado.");

            // 1. Criar a Clínica
            var novaClinica = new Clinica
            {
                Id = Guid.NewGuid(),
                Nome = request.Nome,
                EmailContato = request.Email,
                Telefone = request.Telefone,
                Nif = request.Nif,
                Endereco = request.Endereco,
                CreatedAt = DateTime.UtcNow,
                UsuarioId = null
            };

            _context.Clinicas.Add(novaClinica);
            await _context.SaveChangesAsync(); 

            // 2. Criar o Vínculo
            var novoElo = new LaboratorioClinica
            {
                Id = Guid.NewGuid(),
                LaboratorioId = request.LaboratorioId,
                ClinicaId = novaClinica.Id,
                Ativo = true,
                CreatedAt = DateTime.UtcNow,
                TabelaPrecoId = null // Começa com padrão
            };

            _context.LaboratorioClinicas.Add(novoElo);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return Ok(new { 
                id = novaClinica.Id, 
                nome = novaClinica.Nome,
                mensagem = "Cadastrado com sucesso"
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            Console.WriteLine($"ERRO AO CRIAR CLÍNICA: {ex.Message}");
            return StatusCode(500, "Erro ao processar o cadastro.");
        }
    }
    
    [HttpPut("me")]
    public async Task<IActionResult> AtualizarMeuPerfil([FromBody] AtualizarPerfilRequest request)
    {
        var clinicaIdClaim = User.FindFirst("clinicaId")?.Value;
        if (clinicaIdClaim == null) return Unauthorized();

        var clinica = await _context.Clinicas.FindAsync(Guid.Parse(clinicaIdClaim));
        if (clinica == null) return NotFound("Perfil de clínica não encontrado.");

        clinica.Nome = request.Nome;
        clinica.EmailContato = request.EmailContato;
        clinica.Telefone = request.Telefone; 
        clinica.Nif = request.Nif;
        clinica.Endereco = request.Endereco;

        await _context.SaveChangesAsync();
        return Ok(clinica);
    }

    [HttpDelete("{clinicaId}")]
    public async Task<IActionResult> RemoverClinica(Guid clinicaId)
    {
        var labId = User.FindFirst("laboratorioId")?.Value;
        if (string.IsNullOrEmpty(labId)) return Unauthorized();
        var labGuid = Guid.Parse(labId);

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var vinculo = await _context.LaboratorioClinicas
                .FirstOrDefaultAsync(lc => lc.LaboratorioId == labGuid && lc.ClinicaId == clinicaId);

            var clinica = await _context.Clinicas.FindAsync(clinicaId);

            if (vinculo == null && clinica == null) return NotFound("Registo não encontrado.");

            if (vinculo != null) _context.LaboratorioClinicas.Remove(vinculo);

            if (clinica != null && clinica.UsuarioId == null) _context.Clinicas.Remove(clinica);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            Console.WriteLine($"Erro ao remover: {ex.Message}");
            return StatusCode(500, "Erro ao remover clínica.");
        }
    }
    
    [HttpPatch("{clinicaId}/tabela")]
    public async Task<IActionResult> DefinirTabelaPreco(Guid clinicaId, [FromBody] System.Text.Json.JsonElement payload)
    {
        var labId = User.FindFirst("laboratorioId")?.Value;
        if (string.IsNullOrEmpty(labId)) return Unauthorized();
        var labGuid = Guid.Parse(labId);

        // Extração segura do JSON
        Guid? tabelaId = null;
        if (payload.TryGetProperty("tabelaId", out var elem) && elem.ValueKind == System.Text.Json.JsonValueKind.String)
        {
             var str = elem.GetString();
             if (!string.IsNullOrEmpty(str)) tabelaId = Guid.Parse(str);
        }

        var vinculo = await _context.LaboratorioClinicas
            .FirstOrDefaultAsync(lc => lc.LaboratorioId == labGuid && lc.ClinicaId == clinicaId);

        if (vinculo == null) return NotFound("Vínculo não encontrado.");

        vinculo.TabelaPrecoId = tabelaId;
        await _context.SaveChangesAsync();

        return Ok();
    }
}