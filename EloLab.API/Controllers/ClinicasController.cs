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
        var labExiste = await _context.Laboratorios.AnyAsync(l => l.Id == request.LaboratorioId);
        if (!labExiste)
        {
            return BadRequest("O Laboratório informado não existe.");
        }

        var novaClinica = new Clinica
        {
            Nome = request.Nome,
            EmailContato = request.Email,
            Nif = request.Nif,
            Endereco = request.Endereco,
            CreatedAt = DateTime.UtcNow
        };

        _context.Clinicas.Add(novaClinica);
        await _context.SaveChangesAsync(); 

        var novoElo = new LaboratorioClinica
        {
            LaboratorioId = request.LaboratorioId,
            ClinicaId = novaClinica.Id,
            Ativo = true
        };

        _context.LaboratorioClinicas.Add(novoElo);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetClinicasDoLaboratorio), new { labId = request.LaboratorioId }, novaClinica);
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
}