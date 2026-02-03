using EloLab.API.Data;
using EloLab.API.Models;
using EloLab.API.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace EloLab.API.Controllers;

[Authorize]
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
    
    // PUT: api/Laboratorios/me
    [HttpPut("me")]
    public async Task<IActionResult> AtualizarMeuPerfil([FromBody] AtualizarPerfilRequest request)
    {
        var labIdClaim = User.FindFirst("laboratorioId")?.Value;
        if (labIdClaim == null) return Unauthorized();

        var lab = await _context.Laboratorios.FindAsync(Guid.Parse(labIdClaim));
        if (lab == null) return NotFound();

        // Atualiza dados básicos
        lab.Nome = request.Nome;
        lab.EmailContato = request.EmailContato;
        lab.Telefone = request.Telefone;
        lab.Endereco = request.Endereco;
        
        // === ATUALIZA APARÊNCIA ===
        // Se vier nulo, mantém o que estava. Se vier vazio, volta pro padrão.
        if (!string.IsNullOrEmpty(request.CorPrimaria)) 
            lab.CorPrimaria = request.CorPrimaria;
            
        if (!string.IsNullOrEmpty(request.LogoUrl)) 
            lab.LogoUrl = request.LogoUrl;
        // ==========================

        await _context.SaveChangesAsync();

        return Ok(lab);
    }
    
    // POST: api/Laboratorios/logo
    [HttpPost("logo")]
    public async Task<IActionResult> UploadLogo(IFormFile arquivo)
    {
        // 1. Validações Básicas
        if (arquivo == null || arquivo.Length == 0)
            return BadRequest("Nenhum arquivo enviado.");

        var extensao = Path.GetExtension(arquivo.FileName).ToLower();
        var permitidos = new[] { ".jpg", ".jpeg", ".png", ".webp" }; // Apenas imagens
        
        if (!permitidos.Contains(extensao))
            return BadRequest("Formato inválido. Use JPG, PNG ou WEBP.");

        // 2. Identificar o Lab (para dar nome ao arquivo)
        var labIdClaim = User.FindFirst("laboratorioId")?.Value;
        if (string.IsNullOrEmpty(labIdClaim)) return Unauthorized();

        // 3. Preparar Pasta
        var pastaLogos = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "logos");
        if (!Directory.Exists(pastaLogos)) Directory.CreateDirectory(pastaLogos);

        // 4. Salvar Arquivo (Nome = ID do Lab + Extensão, assim substitui a antiga automaticamente)
        var nomeArquivo = $"{labIdClaim}_logo{extensao}";
        var caminhoCompleto = Path.Combine(pastaLogos, nomeArquivo);

        using (var stream = new FileStream(caminhoCompleto, FileMode.Create))
        {
            await arquivo.CopyToAsync(stream);
        }

        // 5. Retornar a URL Pública
        // Nota: O "/logos/" deve bater com a configuração de arquivos estáticos no Program.cs
        // Se ainda não mapeamos, vamos usar a pasta uploads mesmo ou configurar esta.
        var urlPublica = $"/logos/{nomeArquivo}";

        return Ok(new { url = urlPublica });
    }
}