using EloLab.API.Data;
using EloLab.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EloLab.API.Controllers;

[ApiController]
[Route("api/[controller]")] // A rota será: http://localhost:5036/api/laboratorios
public class LaboratoriosController : ControllerBase
{
    private readonly AppDbContext _context;

    // Construtor: Aqui pedimos ao C# para nos dar o Banco de Dados pronto a usar
    public LaboratoriosController(AppDbContext context)
    {
        _context = context;
    }

    // 1. GET: api/laboratorios
    // Serve para listar todos os laboratórios (Só para testarmos)
    [HttpGet]
    public async Task<IActionResult> GetLaboratorios()
    {
        var labs = await _context.Laboratorios.ToListAsync();
        return Ok(labs);
    }

    // 2. POST: api/laboratorios
    // Serve para criar um novo laboratório
    [HttpPost]
    public async Task<IActionResult> CreateLaboratorio([FromBody] Laboratorio laboratorio)
    {
        // Define a data de criação automaticamente
        laboratorio.CreatedAt = DateTime.UtcNow;
        laboratorio.Ativo = true;

        // Adiciona ao "banco virtual"
        _context.Laboratorios.Add(laboratorio);
        
        // "Salva" de verdade no Supabase
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetLaboratorios), new { id = laboratorio.Id }, laboratorio);
    }
}