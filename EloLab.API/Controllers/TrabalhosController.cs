using EloLab.API.Data;
using EloLab.API.DTOs;
using EloLab.API.Models;
using EloLab.API.Models.Enums; // Certifique-se que seu Enum está aqui ou remova se estiver em Models
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
    // 1. LISTAR MEUS TRABALHOS (Com dados completos)
    // =============================================================
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Trabalho>>> GetTrabalhos()
    {
        // A. Quem está a chamar?
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) userId = User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        var usuarioGuid = Guid.Parse(userId);

        // B. Verificação: É um LABORATÓRIO?
        var meuLab = await _context.Laboratorios
            .FirstOrDefaultAsync(l => l.UsuarioId == usuarioGuid);

        if (meuLab != null)
        {
            return await _context.Trabalhos
                .Where(t => t.LaboratorioId == meuLab.Id)
                .Include(t => t.Clinica) // Traz o nome da Clínica
                .Include(t => t.Servico) // Traz o nome do Serviço (Coroa, Faceta, etc)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        // C. Verificação: É uma CLÍNICA?
        var minhaClinica = await _context.Clinicas
            .FirstOrDefaultAsync(c => c.UsuarioId == usuarioGuid);

        if (minhaClinica != null)
        {
            return await _context.Trabalhos
                .Where(t => t.ClinicaId == minhaClinica.Id)
                .Include(t => t.Laboratorio) // Traz o nome do Lab
                .Include(t => t.Servico)     // Traz o nome do Serviço
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        // D. Nada encontrado (Usuário sem perfil vinculado)
        return Ok(new List<Trabalho>());
    }

    // =============================================================
    // 2. CRIAR PEDIDO
    // =============================================================
    [HttpPost]
    public async Task<IActionResult> CriarTrabalho([FromBody] CriarTrabalhoRequest request)
    {
        decimal valorFinalCalculado = 0;

        // Lógica de Preço: Se enviou valor manual, usa ele. Se não, pega da tabela.
        if (request.ValorPersonalizado.HasValue)
        {
            valorFinalCalculado = request.ValorPersonalizado.Value;
        }
        else if (request.ServicoId.HasValue)
        {
            var servico = await _context.Servicos.FindAsync(request.ServicoId.Value);
            if (servico != null)
            {
                valorFinalCalculado = servico.PrecoBase;
            }
        }

        var trabalho = new Trabalho
        {
            LaboratorioId = request.LaboratorioId,
            ClinicaId = request.ClinicaId,
            ServicoId = request.ServicoId,
            PacienteNome = request.PacienteNome,
            Dentes = request.Dentes,
            CorDente = request.CorDente,
            DescricaoPersonalizada = request.Observacoes,
            DataEntregaPrevista = request.DataEntrega.ToUniversalTime(), // Sempre salvar em UTC
            ValorFinal = valorFinalCalculado,
            Status = "Pendente", // Hardcoded ou StatusTrabalho.Pendente.ToString()
            CreatedAt = DateTime.UtcNow
        };

        _context.Trabalhos.Add(trabalho);
        await _context.SaveChangesAsync();

        // Retorna o trabalho criado
        return Ok(trabalho);
    }
    
    // =============================================================
    // [NOVO] 4. BUSCAR UM TRABALHO ESPECÍFICO (Detalhes)
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
    // 3. MUDAR STATUS
    // =============================================================
    [HttpPatch("{trabalhoId}/status")]
    public async Task<IActionResult> AtualizarStatus(Guid trabalhoId, [FromBody] string novoStatus)
    {
        var trabalho = await _context.Trabalhos.FindAsync(trabalhoId);
        if (trabalho == null) return NotFound("Trabalho não encontrado.");

        // Validação simples se o status existe no Enum (opcional, mas recomendado)
        if (!Enum.TryParse<StatusTrabalho>(novoStatus, true, out _))
        {
           // Se quiser ser estrito, descomente a linha abaixo. 
           // Por enquanto aceitamos string para facilitar o teste.
           // return BadRequest("Status inválido.");
        }

        trabalho.Status = novoStatus;
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Status atualizado", novoStatus = trabalho.Status });
    }
    
    // POST: api/Trabalhos/{id}/anexo
    [HttpPost("{id}/anexo")]
    public async Task<IActionResult> UploadAnexo(Guid id, IFormFile arquivo)
    {
        // 1. Validar se o trabalho existe
        var trabalho = await _context.Trabalhos.FindAsync(id);
        if (trabalho == null) return NotFound("Trabalho não encontrado.");

        if (arquivo == null || arquivo.Length == 0)
            return BadRequest("Nenhum arquivo enviado.");

        // 2. Validar extensões
        var extensao = Path.GetExtension(arquivo.FileName).ToLower();
        var permitidos = new[] { ".stl", ".obj", ".ply", ".jpg", ".jpeg", ".png", ".pdf" };
        
        if (!permitidos.Contains(extensao))
            return BadRequest($"Formato {extensao} não suportado.");

        // 3. Salvar no Disco
        var pastaUploads = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        if (!Directory.Exists(pastaUploads)) Directory.CreateDirectory(pastaUploads);

        var nomeUnico = $"{id}_{Guid.NewGuid()}{extensao}";
        var caminhoCompleto = Path.Combine(pastaUploads, nomeUnico);

        using (var stream = new FileStream(caminhoCompleto, FileMode.Create))
        {
            await arquivo.CopyToAsync(stream);
        }

        var urlPublica = $"/uploads/{nomeUnico}";

        // 4. Criar o objeto Anexo (usando o TEU modelo existente)
        var anexo = new Anexo
        {
            Id = Guid.NewGuid(),
            TrabalhoId = id,
            NomeArquivo = arquivo.FileName,
            Url = urlPublica,
            TipoArquivo = extensao,    // Preenchendo o campo que já existe
            TamanhoBytes = arquivo.Length, // Preenchendo o tamanho
            CreatedAt = DateTime.UtcNow
        };

        _context.Anexos.Add(anexo);
        
        // Atualiza a "capa" do trabalho se for o primeiro arquivo ou um arquivo 3D
        if (string.IsNullOrEmpty(trabalho.ArquivoUrl) || extensao == ".stl" || extensao == ".obj")
        {
            trabalho.ArquivoUrl = urlPublica;
        }

        await _context.SaveChangesAsync();

        return Ok(anexo);
    }
    
    // GET: api/Trabalhos/{id}/anexos
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