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

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Clinica>>> GetMinhasClinicas()
    {
        var todasClinicas = await _context.Clinicas
            .OrderBy(c => c.Nome)
            .ToListAsync();

        return Ok(todasClinicas);
    }

    [HttpPost]
    public async Task<IActionResult> CriarClinica([FromBody] CriarClinicaRequest request)
    {
        try 
        {
            // 1. Validar se o laboratório existe
            var labExiste = await _context.Laboratorios.AnyAsync(l => l.Id == request.LaboratorioId);
            if (!labExiste) return BadRequest("Laboratório não encontrado.");

            // 2. Criar a Clínica
            var novaClinica = new Clinica
            {
                Id = Guid.NewGuid(), // Geramos o ID aqui para garantir
                Nome = request.Nome,
                EmailContato = request.Email,
                Telefone = request.Telefone,
                Nif = request.Nif,
                Endereco = request.Endereco,
                CreatedAt = DateTime.UtcNow,
                UsuarioId = null // Explicitamente nulo pois é manual
            };

            _context.Clinicas.Add(novaClinica);
            await _context.SaveChangesAsync(); 

            // 3. Criar o Vínculo (LaboratorioClinica)
            var novoElo = new LaboratorioClinica
            {
                Id = Guid.NewGuid(),
                LaboratorioId = request.LaboratorioId,
                ClinicaId = novaClinica.Id,
                Ativo = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.LaboratorioClinicas.Add(novoElo);
            await _context.SaveChangesAsync();

            // 4. RETORNO BLINDADO (AQUI ESTAVA O ERRO)
            // Em vez de retornar a entidade complexa, retornamos um objeto simples.
            // Isso evita qualquer erro de serialização ou ciclo infinito.
            return Ok(new { 
                id = novaClinica.Id, 
                nome = novaClinica.Nome,
                mensagem = "Cadastrado com sucesso"
            });
        }
        catch (Exception ex)
        {
            // Se der erro, vai aparecer no seu terminal do backend para sabermos o que foi
            Console.WriteLine($"ERRO CRÍTICO AO CRIAR CLÍNICA: {ex.Message}");
            if (ex.InnerException != null) Console.WriteLine($"DETALHE: {ex.InnerException.Message}");
            
            return StatusCode(500, "Erro ao processar o cadastro.");
        }
    }

    [HttpGet("por-laboratorio/{labId}")]
    public async Task<IActionResult> GetClinicasDoLaboratorio(Guid labId)
    {
        var clinicas = await _context.LaboratorioClinicas
            .Where(elo => elo.LaboratorioId == labId && elo.Ativo)
            .Include(elo => elo.Clinica)
            .Select(elo => elo.Clinica)
            .ToListAsync();

        return Ok(clinicas);
    }
    
    [HttpPut("me")]
    public async Task<IActionResult> AtualizarMeuPerfil([FromBody] AtualizarPerfilRequest request)
    {
        // 1. Identificar quem está logado (Agora usando o clinicaId que é muito mais seguro e direto)
        var clinicaIdClaim = User.FindFirst("clinicaId")?.Value;
        if (clinicaIdClaim == null) return Unauthorized();

        // 2. Buscar a Clínica
        var clinica = await _context.Clinicas.FindAsync(Guid.Parse(clinicaIdClaim));
        if (clinica == null) return NotFound("Perfil de clínica não encontrado.");

        // 3. Atualizar Dados (CORRIGIDO: Telefone descomentado)
        clinica.Nome = request.Nome;
        clinica.EmailContato = request.EmailContato;
        clinica.Telefone = request.Telefone; 
        clinica.Nif = request.Nif;
        clinica.Endereco = request.Endereco;

        // 4. Salvar
        await _context.SaveChangesAsync();

        return Ok(clinica);
    }
    
    // ... outros métodos ...

    [HttpDelete("{clinicaId}")]
    public async Task<IActionResult> RemoverClinica(Guid clinicaId)
    {
        var labId = User.FindFirst("laboratorioId")?.Value;
        if (string.IsNullOrEmpty(labId)) return Unauthorized();
        var labGuid = Guid.Parse(labId);

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Tenta achar o vínculo (pode ser null se for lixo antigo)
            var vinculo = await _context.LaboratorioClinicas
                .FirstOrDefaultAsync(lc => lc.LaboratorioId == labGuid && lc.ClinicaId == clinicaId);

            // 2. Tenta achar a clínica
            var clinica = await _context.Clinicas.FindAsync(clinicaId);

            // Se não existe nem um nem outro, aí sim é 404
            if (vinculo == null && clinica == null) 
            {
                return NotFound("Registo não encontrado.");
            }

            // 3. Se o vínculo existe, removemos
            if (vinculo != null)
            {
                _context.LaboratorioClinicas.Remove(vinculo);
            }

            // 4. Se a clínica é MANUAL (UsuarioId == null), removemos a clínica da base de dados
            // Isso garante que limpamos as "órfãs" mesmo que não tenham vínculo
            if (clinica != null && clinica.UsuarioId == null)
            {
                _context.Clinicas.Remove(clinica);
            }

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
}