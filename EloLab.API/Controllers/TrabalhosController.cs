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
    // HELPER DE SEGURANÇA: Verifica se o utilizador logado é dono deste trabalho
    // =============================================================
    private bool TemPermissaoNoTrabalho(Trabalho trabalho)
    {
        var labIdClaim = User.FindFirst("laboratorioId")?.Value;
        var clinicaIdClaim = User.FindFirst("clinicaId")?.Value;

        bool isDonoLab = !string.IsNullOrEmpty(labIdClaim) && trabalho.LaboratorioId.ToString() == labIdClaim;
        bool isDonoClinica = !string.IsNullOrEmpty(clinicaIdClaim) && trabalho.ClinicaId.ToString() == clinicaIdClaim;

        return isDonoLab || isDonoClinica;
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
            DescricaoPersonalizada = request.DescricaoPersonalizada, 
            DataEntregaPrevista = request.DataEntrega.ToUniversalTime(),
            ValorFinal = valorFinalCalculado,
            Status = "Pendente",
            CreatedAt = DateTime.UtcNow
        };

        _context.Trabalhos.Add(trabalho);
        await _context.SaveChangesAsync();
        
        // DISPARAR NOTIFICAÇÃO DE NOVO PEDIDO (Clínica -> Lab)
        var tipoUser = User.FindFirst("tipo")?.Value;
        if (tipoUser == "Clinica")
        {
            var clinicaNotif = await _context.Clinicas.FindAsync(request.ClinicaId);
            var servicoNotif = request.ServicoId.HasValue ? await _context.Servicos.FindAsync(request.ServicoId.Value) : null;
    
            var novaNotificacao = new Notificacao
            {
                Id = Guid.NewGuid(),
                UsuarioId = request.LaboratorioId,
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

        // SEGURANÇA MÁXIMA: Apenas os envolvidos podem ver os detalhes!
        if (!TemPermissaoNoTrabalho(trabalho)) return Forbid();

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

        // SEGURANÇA MÁXIMA: Apenas o Laboratório dono deste trabalho pode mudar o status
        var labIdClaim = User.FindFirst("laboratorioId")?.Value;
        if (trabalho.LaboratorioId.ToString() != labIdClaim) return Forbid();

        trabalho.Status = novoStatus;
        await _context.SaveChangesAsync();
        
        // DISPARAR NOTIFICAÇÃO DE STATUS (Lab -> Clínica)
        var tipoUserStatus = User.FindFirst("tipo")?.Value;
        if (tipoUserStatus == "Laboratorio")
        {
            var trabCompleto = await _context.Trabalhos.Include(t => t.Servico).FirstOrDefaultAsync(t => t.Id == trabalhoId);
            if (trabCompleto != null)
            {
                var notificacaoStatus = new Notificacao
                {
                    Id = Guid.NewGuid(),
                    UsuarioId = trabCompleto.ClinicaId,
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

        // SEGURANÇA MÁXIMA: Só pode enviar arquivos se fizer parte do trabalho
        if (!TemPermissaoNoTrabalho(trabalho)) return Forbid();

        if (arquivo == null || arquivo.Length == 0) return BadRequest("Nenhum arquivo enviado.");

        var extensao = Path.GetExtension(arquivo.FileName).ToLower();
        var permitidos = new[] { ".stl", ".obj", ".ply", ".jpg", ".jpeg", ".png", ".pdf" };
        
        if (!permitidos.Contains(extensao)) return BadRequest($"Formato {extensao} não suportado.");

        // ATENÇÃO: LIGAÇÃO AO COFRE (PERSISTENT DISK)
        var pastaUploads = Environment.GetEnvironmentVariable("RENDER_UPLOADS_PATH") 
                           ?? Path.Combine(Directory.GetCurrentDirectory(), "uploads");
                   
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
        // 1. Validar se o trabalho existe e se o user tem permissão
        var trabalho = await _context.Trabalhos.FindAsync(id);
        if (trabalho == null) return NotFound();
        if (!TemPermissaoNoTrabalho(trabalho)) return Forbid();

        var anexos = await _context.Anexos
            .Where(a => a.TrabalhoId == id)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return Ok(anexos);
    }
    
    // =============================================================
    // 6. DELETAR TRABALHO (VERSÃO ROBUSTA E SEGURA)
    // =============================================================
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTrabalho(Guid id)
    {
        var trabalho = await _context.Trabalhos.FindAsync(id);
        if (trabalho == null) return NotFound();

        // SEGURANÇA MÁXIMA: Apenas quem está no trabalho o pode apagar
        if (!TemPermissaoNoTrabalho(trabalho)) return Forbid();

        try 
        {
            var mensagens = await _context.Mensagens.Where(m => m.TrabalhoId == id).ToListAsync();
            if (mensagens.Any()) _context.Mensagens.RemoveRange(mensagens);

            // --- INÍCIO DA LIMPEZA INTELIGENTE DE DISCO FÍSICO ---
            var pastaUploads = Environment.GetEnvironmentVariable("RENDER_UPLOADS_PATH") 
                               ?? Path.Combine(Directory.GetCurrentDirectory(), "uploads");

            var anexos = await _context.Anexos.Where(a => a.TrabalhoId == id).ToListAsync();
            if (anexos.Any()) 
            {
                foreach (var anexo in anexos)
                {
                    if (!string.IsNullOrEmpty(anexo.Url))
                    {
                        var nomeFicheiro = Path.GetFileName(anexo.Url);
                        var caminhoFisico = Path.Combine(pastaUploads, nomeFicheiro);
                        
                        // Apaga o ficheiro do disco para poupar espaço no servidor!
                        if (System.IO.File.Exists(caminhoFisico))
                        {
                            System.IO.File.Delete(caminhoFisico);
                        }
                    }
                }
                _context.Anexos.RemoveRange(anexos);
            }
            
            // Garante que o arquivo principal também é apagado fisicamente
            if (!string.IsNullOrEmpty(trabalho.ArquivoUrl))
            {
                var nomeArqTrabalho = Path.GetFileName(trabalho.ArquivoUrl);
                var caminhoArqFisico = Path.Combine(pastaUploads, nomeArqTrabalho);
                if (System.IO.File.Exists(caminhoArqFisico))
                {
                    System.IO.File.Delete(caminhoArqFisico);
                }
            }
            // --- FIM DA LIMPEZA DE DISCO FÍSICO ---

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
    
    // =============================================================
    // 7. ATUALIZAR PAGAMENTO
    // =============================================================
    [HttpPatch("{id}/pagamento")]
    public async Task<IActionResult> AtualizarPagamento(Guid id, [FromBody] AtualizarPagamentoRequest request)
    {
        var trabalho = await _context.Trabalhos.FindAsync(id);
        if (trabalho == null) return NotFound(new { mensagem = "Trabalho não encontrado." });

        // SEGURANÇA MÁXIMA: Apenas o laboratório que fez o trabalho pode dizer se foi pago!
        var labIdClaim = User.FindFirst("laboratorioId")?.Value;
        if (trabalho.LaboratorioId.ToString() != labIdClaim) return Forbid();

        trabalho.Pago = request.Pago;
        await _context.SaveChangesAsync();

        return Ok(new { mensagem = "Status financeiro atualizado com sucesso.", pago = trabalho.Pago });
    }
    
    // =============================================================
    // 8. DELETAR UM ANEXO ESPECÍFICO (FÍSICO E BD)
    // =============================================================
    [HttpDelete("anexo/{anexoId}")]
    public async Task<IActionResult> DeleteAnexoUnico(Guid anexoId)
    {
        var anexo = await _context.Anexos.Include(a => a.Trabalho).FirstOrDefaultAsync(a => a.Id == anexoId);
        if (anexo == null) return NotFound();

        // Só quem tem permissão no trabalho pode apagar o arquivo
        if (!TemPermissaoNoTrabalho(anexo.Trabalho)) return Forbid();

        var pastaUploads = Environment.GetEnvironmentVariable("RENDER_UPLOADS_PATH") 
                           ?? Path.Combine(Directory.GetCurrentDirectory(), "uploads");

        // Apaga o ficheiro do Disco Físico
        if (!string.IsNullOrEmpty(anexo.Url))
        {
            var nomeFicheiro = Path.GetFileName(anexo.Url);
            var caminhoFisico = Path.Combine(pastaUploads, nomeFicheiro);
            if (System.IO.File.Exists(caminhoFisico))
            {
                System.IO.File.Delete(caminhoFisico);
            }
        }

        // Apaga da Base de Dados
        _context.Anexos.Remove(anexo);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}