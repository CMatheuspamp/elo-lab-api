using EloLab.API.Data;
using EloLab.API.DTOs;
using EloLab.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EloLab.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TrabalhosController : ControllerBase
{
    private readonly AppDbContext _context;

    public TrabalhosController(AppDbContext context)
    {
        _context = context;
    }

    // =============================================================
    // 1. LISTAGEM INTELIGENTE (Dashboard)
    // =============================================================
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Trabalho>>> GetTrabalhos()
    {
        // Tenta ler o ID do Laboratório direto do Token
        var labIdClaim = User.FindFirst("laboratorioId")?.Value;
        
        // Tenta ler o ID da Clínica direto do Token
        var clinicaIdClaim = User.FindFirst("clinicaId")?.Value;

        // CENÁRIO 1: É UM LABORATÓRIO
        if (!string.IsNullOrEmpty(labIdClaim) && Guid.TryParse(labIdClaim, out var labId))
        {
            return await _context.Trabalhos
                .Include(t => t.Clinica)
                .Include(t => t.Servico)
                .Where(t => t.LaboratorioId == labId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        // CENÁRIO 2: É UMA CLÍNICA
        if (!string.IsNullOrEmpty(clinicaIdClaim) && Guid.TryParse(clinicaIdClaim, out var clinicaId))
        {
            return await _context.Trabalhos
                .Include(t => t.Laboratorio)
                .Include(t => t.Servico)
                .Where(t => t.ClinicaId == clinicaId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        // Se não tiver nenhum ID no token (algo errado com o login), retorna vazio
        return Ok(new List<Trabalho>());
    }

    // =============================================================
    // 2. CRIAR PEDIDO
    // =============================================================
    [HttpPost]
    public async Task<IActionResult> CriarTrabalho([FromBody] CriarTrabalhoRequest request)
    {
        decimal valorFinalCalculado = 0;

        // Lógica de Preço
        if (request.ValorPersonalizado.HasValue)
        {
            valorFinalCalculado = request.ValorPersonalizado.Value;
        }
        else if (request.ServicoId.HasValue)
        {
            var servico = await _context.Servicos.FindAsync(request.ServicoId.Value);
            if (servico != null) valorFinalCalculado = servico.PrecoBase;
        }

        // Monta o objeto
        var trabalho = new Trabalho
        {
            // Se o ID vier na request, usa. Se não, tenta pegar do token (segurança extra)
            LaboratorioId = request.LaboratorioId, 
            ClinicaId = request.ClinicaId,
            ServicoId = request.ServicoId,
            PacienteNome = request.PacienteNome,
            Dentes = request.Dentes,
            CorDente = request.CorDente,
            DescricaoPersonalizada = request.Observacoes,
            DataEntregaPrevista = request.DataEntrega.ToUniversalTime(),
            ValorFinal = valorFinalCalculado,
            Status = "Pendente",
            CreatedAt = DateTime.UtcNow
        };

        _context.Trabalhos.Add(trabalho);
        await _context.SaveChangesAsync();

        return Ok(trabalho);
    }
    
    // =============================================================
    // 3. DETALHES
    // =============================================================
    [HttpGet("{id}")]
    public async Task<ActionResult<Trabalho>> GetTrabalho(Guid id)
    {
        var trabalho = await _context.Trabalhos
            .Include(t => t.Clinica)
            .Include(t => t.Laboratorio)
            .Include(t => t.Servico)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (trabalho == null) return NotFound();

        return Ok(trabalho);
    }
    
    // =============================================================
    // 4. MUDAR STATUS
    // =============================================================
    [HttpPatch("{trabalhoId}/status")]
    public async Task<IActionResult> AtualizarStatus(Guid trabalhoId, [FromBody] string novoStatus)
    {
        var trabalho = await _context.Trabalhos.FindAsync(trabalhoId);
        if (trabalho == null) return NotFound("Trabalho não encontrado.");

        trabalho.Status = novoStatus;
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Status atualizado", novoStatus = trabalho.Status });
    }
    
    // =============================================================
    // 5. UPLOAD DE ANEXOS (3D, Fotos, etc)
    // =============================================================
    [HttpPost("{id}/anexo")]
    public async Task<IActionResult> UploadAnexo(Guid id, IFormFile arquivo)
    {
        var trabalho = await _context.Trabalhos.FindAsync(id);
        if (trabalho == null) return NotFound("Trabalho não encontrado.");

        if (arquivo == null || arquivo.Length == 0) return BadRequest("Nenhum arquivo enviado.");

        var extensao = Path.GetExtension(arquivo.FileName).ToLower();
        var permitidos = new[] { ".stl", ".obj", ".ply", ".jpg", ".jpeg", ".png", ".pdf" };
        
        if (!permitidos.Contains(extensao)) return BadRequest($"Formato {extensao} não suportado.");

        // Salvar no Disco
        var pastaUploads = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        if (!Directory.Exists(pastaUploads)) Directory.CreateDirectory(pastaUploads);

        var nomeUnico = $"{id}_{Guid.NewGuid()}{extensao}";
        var caminhoCompleto = Path.Combine(pastaUploads, nomeUnico);

        using (var stream = new FileStream(caminhoCompleto, FileMode.Create))
        {
            await arquivo.CopyToAsync(stream);
        }

        var urlPublica = $"/uploads/{nomeUnico}"; // URL relativa

        // Criar registro no banco
        var anexo = new Anexo
        {
            Id = Guid.NewGuid(),
            TrabalhoId = id,
            NomeArquivo = arquivo.FileName,
            Url = urlPublica,
            TipoArquivo = extensao,
            TamanhoBytes = arquivo.Length,
            CreatedAt = DateTime.UtcNow
        };

        _context.Anexos.Add(anexo);
        
        // Define como "capa" se for STL/OBJ ou se for o primeiro arquivo
        if (string.IsNullOrEmpty(trabalho.ArquivoUrl) || extensao == ".stl" || extensao == ".obj")
        {
            trabalho.ArquivoUrl = urlPublica;
        }

        await _context.SaveChangesAsync();
        return Ok(anexo);
    }
    
    [HttpGet("{id}/anexos")]
    public async Task<IActionResult> GetAnexos(Guid id)
    {
        var anexos = await _context.Anexos
            .Where(a => a.TrabalhoId == id)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return Ok(anexos);
    }
}