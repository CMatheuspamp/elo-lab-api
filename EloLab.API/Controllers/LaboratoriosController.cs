using System.Security.Claims;
using EloLab.API.Data;
using EloLab.API.Models;
using EloLab.API.DTOs;
using EloLab.API.Hubs; // <--- NOVO: Importa o túnel
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR; // <--- NOVO: Ferramentas do túnel

namespace EloLab.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")] 
public class LaboratoriosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHubContext<AppHub> _hubContext; // <--- O MEGAFONE DO ADMIN

    // Injetamos o megafone no construtor
    public LaboratoriosController(AppDbContext context, IHubContext<AppHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    private bool IsSuperAdmin()
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        return email != null && email.ToLower() == "matheuspamp4@outlook.com"; 
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetLaboratorios()
    {
        if (IsSuperAdmin())
        {
            var todosLabs = await _context.Laboratorios.OrderByDescending(l => l.CreatedAt).ToListAsync();
            return Ok(todosLabs);
        }

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var uid)) return Unauthorized();

        var clinica = await _context.Clinicas.FirstOrDefaultAsync(c => c.UsuarioId == uid);
        if (clinica != null)
        {
            var labsParceiros = await _context.LaboratorioClinicas
                .Where(lc => lc.ClinicaId == clinica.Id)
                .Join(_context.Laboratorios, vinculo => vinculo.LaboratorioId, lab => lab.Id, (vinculo, lab) => lab)
                .ToListAsync();
            return Ok(labsParceiros);
        }

        var laboratorio = await _context.Laboratorios.FirstOrDefaultAsync(l => l.UsuarioId == uid);
        if (laboratorio != null) return Ok(new List<Laboratorio> { laboratorio });

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

        lab.Nome = request.Nome;
        lab.EmailContato = request.EmailContato;
        lab.Telefone = request.Telefone;
        lab.Nif = request.Nif; 
        lab.Endereco = request.Endereco;
        
        if (!string.IsNullOrEmpty(request.CorPrimaria)) lab.CorPrimaria = request.CorPrimaria;
        if (!string.IsNullOrEmpty(request.LogoUrl)) lab.LogoUrl = request.LogoUrl;

        await _context.SaveChangesAsync();
        return Ok(lab);
    }
    
    [HttpPost("logo")]
    public async Task<IActionResult> UploadLogo(IFormFile arquivo)
    {
        if (arquivo == null || arquivo.Length == 0) return BadRequest("Nenhum arquivo enviado.");
        var extensao = Path.GetExtension(arquivo.FileName).ToLower();
        var permitidos = new[] { ".jpg", ".jpeg", ".png", ".webp" }; 
        if (!permitidos.Contains(extensao)) return BadRequest("Formato inválido.");

        var labIdClaim = User.FindFirst("laboratorioId")?.Value;
        if (string.IsNullOrEmpty(labIdClaim)) return Unauthorized();

        var pastaUploads = Environment.GetEnvironmentVariable("RENDER_UPLOADS_PATH") ?? Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        if (!Directory.Exists(pastaUploads)) Directory.CreateDirectory(pastaUploads);

        var nomeArquivo = $"{labIdClaim}_{Guid.NewGuid():N}{extensao}";
        var caminhoCompleto = Path.Combine(pastaUploads, nomeArquivo);
        using (var stream = new FileStream(caminhoCompleto, FileMode.Create)) { await arquivo.CopyToAsync(stream); }

        return Ok(new { url = $"/uploads/{nomeArquivo}" });
    }

    // ==========================================================
    // === PODERES EXCLUSIVOS DE ADMIN COM SIGNALR MÁGICO ===
    // ==========================================================

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> ToggleStatus(Guid id, [FromBody] AlterarStatusRequest request)
    {
        if (!IsSuperAdmin()) return Forbid("Apenas o Super Admin pode fazer isto.");

        var lab = await _context.Laboratorios.FindAsync(id);
        if (lab == null) return NotFound("Laboratório não encontrado.");

        lab.Ativo = request.Ativo;
        await _context.SaveChangesAsync();

        // === MAGIA: FORÇA O LOGOUT NA HORA SE FOI BLOQUEADO ===
        if (!lab.Ativo)
        {
            await _hubContext.Clients.Group($"Lab_{id}").SendAsync("ForcarLogout");
        }

        return Ok(new { mensagem = "Status atualizado com sucesso!", ativo = lab.Ativo });
    }

    [HttpPut("{id}/aparencia")]
    public async Task<IActionResult> AtualizarAparencia(Guid id, [FromForm] string corPrimaria, IFormFile? logo)
    {
        if (!IsSuperAdmin()) return Forbid("Apenas o Super Admin pode fazer isto.");

        var lab = await _context.Laboratorios.FindAsync(id);
        if (lab == null) return NotFound("Laboratório não encontrado.");

        if (!string.IsNullOrEmpty(corPrimaria)) lab.CorPrimaria = corPrimaria;

        if (logo != null && logo.Length > 0)
        {
            var extensao = Path.GetExtension(logo.FileName).ToLower();
            var permitidos = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            if (!permitidos.Contains(extensao)) return BadRequest("Formato de imagem inválido.");

            var pastaUploads = Environment.GetEnvironmentVariable("RENDER_UPLOADS_PATH") ?? Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            if (!Directory.Exists(pastaUploads)) Directory.CreateDirectory(pastaUploads);

            var nomeUnico = $"logo_{id}_{Guid.NewGuid().ToString().Substring(0,8)}{extensao}";
            var caminhoCompleto = Path.Combine(pastaUploads, nomeUnico);
            using (var stream = new FileStream(caminhoCompleto, FileMode.Create)) { await logo.CopyToAsync(stream); }

            lab.LogoUrl = $"/uploads/{nomeUnico}";
        }
        await _context.SaveChangesAsync();

        // === MAGIA: FORÇA O F5 DO CLIENTE PARA APLICAR A COR NOVA ===
        await _hubContext.Clients.Group($"Lab_{id}").SendAsync("AtualizarAparencia", new { 
            corPrimaria = lab.CorPrimaria, 
            logoUrl = lab.LogoUrl 
        });

        return Ok(new { mensagem = "Aparência atualizada!", logo = lab.LogoUrl, cor = lab.CorPrimaria });
    }
    
    // ==========================================================
    // === CONCIERGE: GESTÃO DE SERVIÇOS (SUPER ADMIN) ===
    // ==========================================================

    [HttpGet("{id}/servicos")]
    public async Task<IActionResult> GetServicosDoLab(Guid id)
    {
        if (!IsSuperAdmin()) return Forbid("Apenas o Super Admin pode fazer isto.");
        
        // Vai à tabela de Serviços e procura todos os que pertencem a este laboratório
        var servicos = await _context.Servicos
            .Where(s => s.LaboratorioId == id)
            .OrderBy(s => s.Nome)
            .ToListAsync();
            
        return Ok(servicos);
    }

    [HttpPost("{id}/servicos")]
    public async Task<IActionResult> CriarServicoParaLab(Guid id, [FromBody] Servico request)
    {
        if (!IsSuperAdmin()) return Forbid("Apenas o Super Admin pode fazer isto.");

        // 1. Garante os IDs corretos
        request.Id = Guid.NewGuid();
        request.LaboratorioId = id;
        request.CreatedAt = DateTime.UtcNow;

        // 2. MÁGICA DO MATERIAL: Verifica se o material já existe na tabela 'materiais' desse lab
        if (!string.IsNullOrWhiteSpace(request.Material))
        {
            var materialExiste = await _context.Materiais
                .AnyAsync(m => m.LaboratorioId == id && m.Nome.ToLower() == request.Material.ToLower());

            if (!materialExiste)
            {
                // Se o Admin escreveu um material que não existe na lista do lab, nós criamos agora!
                var novoMaterial = new Material
                {
                    Id = Guid.NewGuid(),
                    LaboratorioId = id,
                    Nome = request.Material // Mantém a grafia que o Admin escreveu
                };
                _context.Materiais.Add(novoMaterial);
                // O SaveChangesAsync lá em baixo vai gravar os dois ao mesmo tempo (Serviço e Material)
            }
        }

        _context.Servicos.Add(request);
        await _context.SaveChangesAsync();

        return Ok(request);
    }

    [HttpDelete("{id}/servicos/{servicoId}")]
    public async Task<IActionResult> DeletarServicoDoLab(Guid id, Guid servicoId)
    {
        if (!IsSuperAdmin()) return Forbid("Apenas o Super Admin pode fazer isto.");

        var servico = await _context.Servicos.FirstOrDefaultAsync(s => s.Id == servicoId && s.LaboratorioId == id);
        if (servico == null) return NotFound("Serviço não encontrado.");

        _context.Servicos.Remove(servico);
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Serviço apagado com sucesso!" });
    }
}

public class AlterarStatusRequest 
{
    public bool Ativo { get; set; }
}