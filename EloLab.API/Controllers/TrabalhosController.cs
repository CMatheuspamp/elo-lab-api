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
        var labIdClaim = User.FindFirst("laboratorioId")?.Value;
        var clinicaIdClaim = User.FindFirst("clinicaId")?.Value;

        if (!string.IsNullOrEmpty(labIdClaim) && Guid.TryParse(labIdClaim, out var labId))
        {
            return await _context.Trabalhos
                .Include(t => t.Clinica)
                .Include(t => t.Servico)
                .Where(t => t.LaboratorioId == labId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        if (!string.IsNullOrEmpty(clinicaIdClaim) && Guid.TryParse(clinicaIdClaim, out var clinicaId))
        {
            return await _context.Trabalhos
                .Include(t => t.Laboratorio)
                .Include(t => t.Servico)
                .Where(t => t.ClinicaId == clinicaId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        return Ok(new List<Trabalho>());
    }

    // =============================================================
    // 2. CRIAR PEDIDO
    // =============================================================
    [HttpPost]
    public async Task<IActionResult> CriarTrabalho([FromBody] CriarTrabalhoRequest request)
    {
        decimal valorFinalCalculado = 0;

        if (request.ValorPersonalizado.HasValue)
        {
            valorFinalCalculado = request.ValorPersonalizado.Value;
        }
        else if (request.ServicoId.HasValue)
        {
            var servico = await _context.Servicos.FindAsync(request.ServicoId.Value);
            if (servico != null) valorFinalCalculado = servico.PrecoBase;
        }

        var trabalho = new Trabalho
        {
            LaboratorioId = request.LaboratorioId, 
            ClinicaId = request.ClinicaId,
            ServicoId = request.ServicoId,
            PacienteNome = request.PacienteNome,
            Dentes = request.Dentes,
            CorDente = request.CorDente,
            // CORREÇÃO AQUI: Agora lê da propriedade correta do request
            DescricaoPersonalizada = request.DescricaoPersonalizada, 
            DataEntregaPrevista = request.DataEntrega.ToUniversalTime(),
            ValorFinal = valorFinalCalculado,
            Status = "Pendente",
            CreatedAt = DateTime.UtcNow
        };

        _context.Trabalhos.Add(trabalho);
        await _context.SaveChangesAsync();
        
        // === DISPARAR NOTIFICAÇÃO DE NOVO PEDIDO (Clínica -> Lab) ===
        var tipoUser = User.FindFirst("tipo")?.Value;
        if (tipoUser == "Clinica")
        {
            var clinicaNotif = await _context.Clinicas.FindAsync(request.ClinicaId);
            var servicoNotif = request.ServicoId.HasValue ? await _context.Servicos.FindAsync(request.ServicoId.Value) : null;
    
            var novaNotificacao = new Notificacao
            {
                Id = Guid.NewGuid(),
                UsuarioId = request.LaboratorioId, // Vai para o dono do Laboratório
                Titulo = "Novo Pedido Recebido 📦",
                Texto = $"{clinicaNotif?.Nome} enviou um novo trabalho para {request.PacienteNome} ({(servicoNotif?.Nome ?? "Personalizado")}).",
                LinkAction = $"/trabalhos/{trabalho.Id}",
                CreatedAt = DateTime.UtcNow,
                Lida = false
            };
            _context.Notificacoes.Add(novaNotificacao);
            await _context.SaveChangesAsync();
        }

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
        
        // === DISPARAR NOTIFICAÇÃO DE STATUS (Lab -> Clínica) ===
        var tipoUserStatus = User.FindFirst("tipo")?.Value;
        if (tipoUserStatus == "Laboratorio")
        {
            var trabCompleto = await _context.Trabalhos.Include(t => t.Servico).FirstOrDefaultAsync(t => t.Id == trabalhoId);
            if (trabCompleto != null)
            {
                var notificacaoStatus = new Notificacao
                {
                    Id = Guid.NewGuid(),
                    UsuarioId = trabCompleto.ClinicaId, // Vai para a Clínica
                    Titulo = "Status Atualizado ✨",
                    Texto = $"O trabalho de {trabCompleto.PacienteNome} ({(trabCompleto.Servico?.Nome ?? "Personalizado")}) mudou para: {novoStatus}",
                    LinkAction = $"/trabalhos/{trabCompleto.Id}",
                    CreatedAt = DateTime.UtcNow,
                    Lida = false
                };
                _context.Notificacoes.Add(notificacaoStatus);
                await _context.SaveChangesAsync();
            }
        }

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

        var pastaUploads = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        if (!Directory.Exists(pastaUploads)) Directory.CreateDirectory(pastaUploads);

        var nomeUnico = $"{id}_{Guid.NewGuid()}{extensao}";
        var caminhoCompleto = Path.Combine(pastaUploads, nomeUnico);

        using (var stream = new FileStream(caminhoCompleto, FileMode.Create))
        {
            await arquivo.CopyToAsync(stream);
        }

        var urlPublica = $"/uploads/{nomeUnico}";

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
    
    // =============================================================
    // 6. DELETAR TRABALHO (VERSÃO ROBUSTA)
    // =============================================================
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTrabalho(Guid id)
    {
        var trabalho = await _context.Trabalhos.FindAsync(id);
        if (trabalho == null) return NotFound();

        try 
        {
            var mensagens = await _context.Mensagens
                .Where(m => m.TrabalhoId == id)
                .ToListAsync();
            
            if (mensagens.Any())
                _context.Mensagens.RemoveRange(mensagens);

            var anexos = await _context.Anexos
                .Where(a => a.TrabalhoId == id)
                .ToListAsync();

            if (anexos.Any())
            {
                _context.Anexos.RemoveRange(anexos);
            }

            _context.Trabalhos.Remove(trabalho);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (DbUpdateException dbEx)
        {
            var innerMessage = dbEx.InnerException?.Message ?? dbEx.Message;
            return StatusCode(500, new { erro = "Erro de banco de dados ao excluir", detalhe = innerMessage });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { erro = "Erro interno ao excluir", detalhe = ex.Message });
        }
    }
    
    [HttpPatch("{id}/pagamento")]
    [Authorize]
    public async Task<IActionResult> AtualizarPagamento(Guid id, [FromBody] AtualizarPagamentoRequest request)
    {
        // Garante que é o dono do laboratório a fazer a alteração
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

        var trabalho = await _context.Trabalhos
            .Include(t => t.Laboratorio)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (trabalho == null) 
            return NotFound(new { mensagem = "Trabalho não encontrado." });

        if (trabalho.Laboratorio.UsuarioId != userId) 
            return Forbid();

        // Atualiza o estado de pagamento real na Base de Dados
        trabalho.Pago = request.Pago;
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Status financeiro atualizado com sucesso.", pago = trabalho.Pago });
    }
}