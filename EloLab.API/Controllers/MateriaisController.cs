using EloLab.API.Data;
using EloLab.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
        if (material.LaboratorioId.ToString() != labIdClaim) return Unauthorized();

        _context.Materiais.Remove(material);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}