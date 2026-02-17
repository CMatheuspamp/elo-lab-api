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
public class MateriaisController : ControllerBase
{
    private readonly AppDbContext _context;

    public MateriaisController(AppDbContext context)
    {
        _context = context;
    }

    // Função auxiliar para verificar se é o administrador mestre
    private bool IsSuperAdmin()
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        return email != null && email.ToLower() == "matheuspamp4@outlook.com";
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Material>>> GetMateriais()
    {
        var labIdClaim = User.FindFirst("laboratorioId")?.Value;
        if (string.IsNullOrEmpty(labIdClaim)) return BadRequest();
        var labId = Guid.Parse(labIdClaim);

        return await _context.Materiais
            .Where(m => m.LaboratorioId == labId)
            .OrderBy(m => m.Nome)
            .ToListAsync();
    }

    // === NOVO ENDPOINT: PERMITE AO ADMIN VER MATERIAIS DE QUALQUER LAB ===
    [HttpGet("admin/{labId}")]
    public async Task<IActionResult> GetMateriaisParaAdmin(Guid labId)
    {
        if (!IsSuperAdmin()) return Forbid("Apenas o Super Admin pode aceder a esta biblioteca.");

        var materiais = await _context.Materiais
            .Where(m => m.LaboratorioId == labId)
            .OrderBy(m => m.Nome)
            .ToListAsync();

        return Ok(materiais);
    }

    [HttpPost]
    public async Task<ActionResult<Material>> PostMaterial([FromBody] Material material)
    {
        var labIdClaim = User.FindFirst("laboratorioId")?.Value;
        if (string.IsNullOrEmpty(labIdClaim)) return BadRequest();

        material.LaboratorioId = Guid.Parse(labIdClaim);
        material.Id = Guid.NewGuid();

        _context.Materiais.Add(material);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetMateriais", new { id = material.Id }, material);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMaterial(Guid id)
    {
        var labIdClaim = User.FindFirst("laboratorioId")?.Value;
        var material = await _context.Materiais.FindAsync(id);

        if (material == null) return NotFound();

        // Segurança: Só o dono do material ou o Super Admin podem apagar
        if (!IsSuperAdmin() && material.LaboratorioId.ToString() != labIdClaim) 
            return Unauthorized();

        _context.Materiais.Remove(material);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}