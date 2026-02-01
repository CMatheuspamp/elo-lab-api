using EloLab.API.Data;
using EloLab.API.DTOs;
using EloLab.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EloLab.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClinicasController : ControllerBase
{
    private readonly AppDbContext _context;

    public ClinicasController(AppDbContext context)
    {
        _context = context;
    }

    // POST: api/clinicas
    // Cria a clínica E cria o vínculo com o laboratório ao mesmo tempo
    [HttpPost]
    public async Task<IActionResult> CriarClinica([FromBody] CriarClinicaRequest request)
    {
        // 1. Verificação de Segurança: O laboratório existe?
        var labExiste = await _context.Laboratorios.AnyAsync(l => l.Id == request.LaboratorioId);
        if (!labExiste)
        {
            return BadRequest("O Laboratório informado não existe.");
        }

        // 2. Criar a Entidade Clínica
        var novaClinica = new Clinica
        {
            Nome = request.Nome,
            EmailContato = request.Email,
            Nif = request.Nif,
            Endereco = request.Endereco,
            CreatedAt = DateTime.UtcNow
        };

        // Adiciona ao banco (mas ainda não salvou, está na memória do EF Core)
        _context.Clinicas.Add(novaClinica);
        
        // SALVAR #1: Precisamos salvar agora para o Banco gerar o ID da Clínica
        await _context.SaveChangesAsync(); 

        // 3. Criar o Vínculo (O "Elo")
        var novoElo = new LaboratorioClinica
        {
            LaboratorioId = request.LaboratorioId,
            ClinicaId = novaClinica.Id, // Aqui usamos o ID que acabou de ser gerado acima
            Ativo = true
        };

        _context.LaboratorioClinicas.Add(novoElo);
        
        // SALVAR #2: Agora salvamos o vínculo
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetClinicasDoLaboratorio), new { labId = request.LaboratorioId }, novaClinica);
    }

    // GET: api/clinicas/por-laboratorio/{labId}
    // Lista todas as clínicas de um laboratório específico
    [HttpGet("por-laboratorio/{labId}")]
    public async Task<IActionResult> GetClinicasDoLaboratorio(Guid labId)
    {
        // Esta query é um pouco mais avançada (LINQ):
        // "Vai à tabela de Elos, filtra pelo LabID, e inclui os dados da Clínica correspondente"
        var clinicas = await _context.LaboratorioClinicas
            .Where(elo => elo.LaboratorioId == labId && elo.Ativo)
            .Select(elo => _context.Clinicas.FirstOrDefault(c => c.Id == elo.ClinicaId))
            .ToListAsync();

        return Ok(clinicas);
    }
}