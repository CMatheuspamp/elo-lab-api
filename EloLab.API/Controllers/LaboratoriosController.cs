using System.Security.Claims;
using EloLab.API.Data;
using EloLab.API.Models;
using EloLab.API.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace EloLab.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")] 
public class LaboratoriosController : ControllerBase
{
    private readonly AppDbContext _context;

    public LaboratoriosController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize] // Impede que visitantes anónimos vejam os laboratórios
    public async Task<IActionResult> GetLaboratorios()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var uid))
            return Unauthorized();

        // 1. Verificar se o utilizador logado é uma Clínica
        var clinica = await _context.Clinicas.FirstOrDefaultAsync(c => c.UsuarioId == uid);
        
        if (clinica != null)
        {
            // A MÁGICA: Só devolve os laboratórios que têm um vínculo com esta clínica!
            var labsParceiros = await _context.LaboratorioClinicas
                .Where(lc => lc.ClinicaId == clinica.Id)
                .Join(_context.Laboratorios, // Cruza com a tabela de Laboratórios
                    vinculo => vinculo.LaboratorioId,
                    lab => lab.Id,
                    (vinculo, lab) => lab)
                .ToListAsync();

            return Ok(labsParceiros);
        }

        // 2. Se for um Laboratório a fazer o pedido, devolvemos apenas os dados dele próprio
        var laboratorio = await _context.Laboratorios.FirstOrDefaultAsync(l => l.UsuarioId == uid);
        if (laboratorio != null)
        {
            return Ok(new List<Laboratorio> { laboratorio });
        }

        return BadRequest(new { mensagem = "Perfil não identificado." });
    }

    [HttpPost]
    public async Task<IActionResult> CreateLaboratorio([FromBody] Laboratorio laboratorio)
    {
        laboratorio.CreatedAt = DateTime.UtcNow;
        laboratorio.Ativo = true;

        _context.Laboratorios.Add(laboratorio);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetLaboratorios), new { id = laboratorio.Id }, laboratorio);
    }
    
    [HttpPut("me")]
    public async Task<IActionResult> AtualizarMeuPerfil([FromBody] AtualizarPerfilRequest request)
    {
        var labIdClaim = User.FindFirst("laboratorioId")?.Value;
        if (labIdClaim == null) return Unauthorized();

        var lab = await _context.Laboratorios.FindAsync(Guid.Parse(labIdClaim));
        if (lab == null) return NotFound();

        // === CORRIGIDO: NIF ADICIONADO AQUI ===
        lab.Nome = request.Nome;
        lab.EmailContato = request.EmailContato;
        lab.Telefone = request.Telefone;
        lab.Nif = request.Nif; 
        lab.Endereco = request.Endereco;
        
        // === ATUALIZA APARÊNCIA ===
        if (!string.IsNullOrEmpty(request.CorPrimaria)) 
            lab.CorPrimaria = request.CorPrimaria;
            
        if (!string.IsNullOrEmpty(request.LogoUrl)) 
            lab.LogoUrl = request.LogoUrl;

        await _context.SaveChangesAsync();

        return Ok(lab);
    }
    
    [HttpPost("logo")]
    public async Task<IActionResult> UploadLogo(IFormFile arquivo)
    {
        if (arquivo == null || arquivo.Length == 0)
            return BadRequest("Nenhum arquivo enviado.");

        var extensao = Path.GetExtension(arquivo.FileName).ToLower();
        var permitidos = new[] { ".jpg", ".jpeg", ".png", ".webp" }; 
        
        if (!permitidos.Contains(extensao))
            return BadRequest("Formato inválido. Use JPG, PNG ou WEBP.");

        var labIdClaim = User.FindFirst("laboratorioId")?.Value;
        if (string.IsNullOrEmpty(labIdClaim)) return Unauthorized();

        var pastaLogos = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "logos");
        if (!Directory.Exists(pastaLogos)) Directory.CreateDirectory(pastaLogos);

        var nomeArquivo = $"{labIdClaim}_logo{extensao}";
        var caminhoCompleto = Path.Combine(pastaLogos, nomeArquivo);

        using (var stream = new FileStream(caminhoCompleto, FileMode.Create))
        {
            await arquivo.CopyToAsync(stream);
        }

        var urlPublica = $"/logos/{nomeArquivo}";

        return Ok(new { url = urlPublica });
    }
}