using EloLab.API.Data;
using EloLab.API.DTOs;
using EloLab.API.Models;
using Microsoft.AspNetCore.Authorization; // <--- Adicionado
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EloLab.API.Controllers;

[Authorize] // <--- Protege o controller para podermos ler o User (Token)
[ApiController]
[Route("api/[controller]")]
public class ClinicasController : ControllerBase
{
    private readonly AppDbContext _context;

    public ClinicasController(AppDbContext context)
    {
        _context = context;
    }

    // =============================================================
    // [NOVO] 1. LISTAR MINHAS CLÍNICAS (Para o Dropdown do Frontend)
    // =============================================================
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Clinica>>> GetMinhasClinicas()
    {
        // EM VEZ DE FILTRAR PELO VÍNCULO, VAMOS RETORNAR TUDO POR ENQUANTO
        // Isso permite que você veja a clínica que criou e teste o sistema.
        
        var todasClinicas = await _context.Clinicas
            .OrderBy(c => c.Nome)
            .ToListAsync();

        return Ok(todasClinicas);
    }

    // =============================================================
    // [ANTIGO - MANTIDO] 2. CRIAR CLÍNICA E VÍNCULO
    // =============================================================
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

    // =============================================================
    // [ANTIGO - MANTIDO] 3. LISTAR POR ID ESPECÍFICO
    // =============================================================
    [HttpGet("por-laboratorio/{labId}")]
    public async Task<IActionResult> GetClinicasDoLaboratorio(Guid labId)
    {
        // Ajustei levemente a query para usar o .Include (é mais performático que o Select aninhado)
        var clinicas = await _context.LaboratorioClinicas
            .Where(elo => elo.LaboratorioId == labId && elo.Ativo)
            .Include(elo => elo.Clinica)
            .Select(elo => elo.Clinica)
            .ToListAsync();

        return Ok(clinicas);
    }
    
    // PUT: api/Clinicas/me
    [HttpPut("me")]
    public async Task<IActionResult> AtualizarMeuPerfil([FromBody] DTOs.AtualizarPerfilRequest request)
    {
        // 1. Identificar quem está logado
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value!);

        // 2. Buscar a Clínica
        var clinica = await _context.Clinicas.FirstOrDefaultAsync(c => c.UsuarioId == userId);
        if (clinica == null) return NotFound("Perfil de clínica não encontrado.");

        // 3. Atualizar Dados
        clinica.Nome = request.Nome;
        clinica.EmailContato = request.EmailContato;
        // Se a sua tabela Clinicas não tiver 'Telefone' na Migration, remova a linha abaixo.
        // Mas se tiver (como adicionamos no Laboratorio), mantenha.
        // clinica.Telefone = request.Telefone; 
        clinica.Nif = request.Nif;
        clinica.Endereco = request.Endereco;

        // 4. Salvar
        await _context.SaveChangesAsync();

        return Ok(clinica);
    }
}