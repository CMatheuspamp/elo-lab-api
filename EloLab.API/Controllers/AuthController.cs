using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using EloLab.API.Data;
using EloLab.API.DTOs;
using EloLab.API.Models; 
using EloLab.API.Hubs; 
using Microsoft.AspNetCore.Authorization; 
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR; 
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace EloLab.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly Supabase.Client _supabaseClient;
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IHubContext<AppHub> _hubContext; 

    public AuthController(Supabase.Client supabaseClient, AppDbContext context, IConfiguration configuration, IHubContext<AppHub> hubContext)
    {
        _supabaseClient = supabaseClient;
        _context = context;
        _configuration = configuration;
        _hubContext = hubContext; 
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var session = await _supabaseClient.Auth.SignIn(request.Email, request.Password);

            if (session == null || session.User == null)
                return BadRequest(new { erro = "Credenciais inválidas." });

            if (!Guid.TryParse(session.User.Id, out var userId))
                return BadRequest(new { erro = "ID de usuário inválido." });

            string tipo = "Desconhecido";
            string nome = session.User.Email ?? "Sem Nome";
            Guid? laboratorioId = null;
            Guid? clinicaId = null;
            bool isAtivo = false;
            
            string cor = "#2563EB"; 
            string? logo = null;

            var lab = await _context.Laboratorios.FirstOrDefaultAsync(l => l.UsuarioId == userId);
            if (lab != null)
            {
                tipo = "Laboratorio";
                nome = lab.Nome;
                laboratorioId = lab.Id;
                isAtivo = lab.Ativo;
                
                cor = lab.CorPrimaria;
                logo = lab.LogoUrl;
            }
            else
            {
                var clinica = await _context.Clinicas.FirstOrDefaultAsync(c => c.UsuarioId == userId);
                if (clinica != null)
                {
                    tipo = "Clinica";
                    nome = clinica.Nome;
                    clinicaId = clinica.Id;
                    isAtivo = clinica.Ativo;
                }
            }
            
            // Verifica a autorização de Super Admin 
            string emailLogado = session.User.Email ?? "";
            bool isSuperAdmin = emailLogado.ToLower() == "matheuspamp4@outlook.com";

            // Só bloqueia a entrada se NÃO for o super admin e estiver inativo
            if (tipo == "Laboratorio" && !isAtivo && !isSuperAdmin)
            {
                return StatusCode(403, new { erro = "PENDENTE", mensagem = "A conta do laboratório está em análise." });
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Email, emailLogado),
                new Claim("tipo", tipo)
            };

            if (laboratorioId != null) claims.Add(new Claim("laboratorioId", laboratorioId.ToString()));
            if (clinicaId != null) claims.Add(new Claim("clinicaId", clinicaId.ToString()));

            var jwtSecret = Environment.GetEnvironmentVariable("JWT_KEY") ?? _configuration["SupabaseSettings:JwtSecret"];
            if (string.IsNullOrEmpty(jwtSecret))
                return StatusCode(500, new { erro = "Configuração do JWT ausente." });

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            
            var supaUrl = Environment.GetEnvironmentVariable("SUPABASE_URL") ?? _configuration["SupabaseSettings:Url"];

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = creds,
                Issuer = $"{supaUrl}/auth/v1",
                Audience = "authenticated"
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var jwtString = tokenHandler.WriteToken(token);

            return Ok(new 
            { 
                token = jwtString,
                usuarioId = userId,
                email = emailLogado,
                tipo = tipo,
                nome = nome,
                corPrimaria = cor,
                logoUrl = logo,
                ativo = isAtivo,
                isAdmin = isSuperAdmin // <--- VARIÁVEL MESTRA
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro Login: {ex.Message}");
            return BadRequest(new { erro = "Falha no login. Verifique suas credenciais." });
        }
    }
    
    [HttpGet("me")]
    [Authorize] 
    public async Task<IActionResult> GetMe()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var uid)) 
            return Unauthorized();

        var lab = await _context.Laboratorios.FirstOrDefaultAsync(l => l.UsuarioId == uid);
        if (lab != null) 
            return Ok(new { id = lab.Id, tipo = "Laboratorio", meusDados = lab });

        var clinica = await _context.Clinicas.FirstOrDefaultAsync(c => c.UsuarioId == uid);
        if (clinica != null) 
            return Ok(new { id = clinica.Id, tipo = "Clinica", meusDados = clinica });

        return Ok(new { Tipo = "Desconhecido", Mensagem = "Sem perfil." });
    }
    
    [HttpPost("register/laboratorio")]
    [AllowAnonymous]
    public async Task<IActionResult> RegisterLaboratorio([FromBody] RegistroLaboratorioDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        Supabase.Gotrue.Session session;
        try
        {
            session = await _supabaseClient.Auth.SignUp(request.Email, request.Senha);
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensagem = $"Erro ao criar conta no Supabase: {ex.Message}" });
        }

        if (session == null || session.User == null)
            return BadRequest(new { mensagem = "Não foi possível criar a conta. Este email já pode estar em uso." });

        if (!Guid.TryParse(session.User.Id, out var supabaseUserId))
            return BadRequest(new { mensagem = "ID de usuário inválido gerado pelo Supabase." });

        using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            string nomeLimpo = request.NomeLaboratorio ?? "lab";
            string baseSlug = nomeLimpo.ToLower().Replace(" ", "-");
            baseSlug = System.Text.RegularExpressions.Regex.Replace(baseSlug, @"[^a-z0-9\-]", "");
            string slugUnico = $"{baseSlug}-{Guid.NewGuid().ToString().Substring(0, 6)}";

            var novoLaboratorio = new Laboratorio
            {
                Id = Guid.NewGuid(),
                UsuarioId = supabaseUserId,
                Nome = request.NomeLaboratorio,
                Slug = slugUnico, 
                EmailContato = request.Email,
                Nif = request.Nif,
                Telefone = request.Telefone,
                Rua = request.Rua,                 
                Cidade = request.Cidade,           
                CodigoPostal = request.CodigoPostal,
                CorPrimaria = "#2563EB", 
                StatusAssinatura = "Pendente",
                Ativo = false, // Conta nasce pendente de aprovação
                CreatedAt = DateTime.UtcNow
            };
            
            _context.Laboratorios.Add(novoLaboratorio);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return StatusCode(201, new { mensagem = "Laboratório registado com sucesso." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            Console.WriteLine($"Erro ao gravar Laboratorio no BD: {ex.InnerException?.Message ?? ex.Message}");
            return StatusCode(500, new { mensagem = "Erro interno ao gravar os dados do laboratório." });
        }
    }
    
    [HttpPost("convite/gerar")]
    [Authorize] 
    public async Task<IActionResult> GerarConviteEndpoint([FromBody] GerarConvite request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var uid))
            return Unauthorized(new { mensagem = "Usuário não autenticado." });

        var lab = await _context.Laboratorios.FirstOrDefaultAsync(l => l.UsuarioId == uid);
        if (lab == null)
            return Forbid(); 

        var novoConvite = new ConviteClinica
        {
            Id = Guid.NewGuid(),
            LaboratorioId = lab.Id,
            EmailConvidado = request.EmailConvidado,
            DataCriacao = DateTime.UtcNow,
            DataExpiracao = DateTime.UtcNow.AddDays(7), 
            Usado = false
        };

        _context.ConvitesClinicas.Add(novoConvite);
        await _context.SaveChangesAsync();

        var frontendUrl = _configuration["FrontendUrl"] ?? Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:5173";
        var linkFrontend = $"{frontendUrl}/registro-clinica?token={novoConvite.Id}";

        return Ok(new 
        { 
            mensagem = "Convite gerado com sucesso.", 
            token = novoConvite.Id,
            link = linkFrontend
        });
    }
    
    [HttpPost("register/clinica")]
    [AllowAnonymous]
    public async Task<IActionResult> RegisterClinica([FromBody] RegistroClinica request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        ConviteClinica? convite = null;
        if (request.TokenConvite.HasValue)
        {
            convite = await _context.ConvitesClinicas
                .FirstOrDefaultAsync(c => c.Id == request.TokenConvite.Value && !c.Usado && c.DataExpiracao > DateTime.UtcNow);
                
            if (convite == null)
                return BadRequest(new { mensagem = "Convite inválido, expirado ou já utilizado." });
        }

        Supabase.Gotrue.Session session;
        try { session = await _supabaseClient.Auth.SignUp(request.Email, request.Senha); }
        catch (Exception ex) { return BadRequest(new { mensagem = $"Erro no Auth: {ex.Message}" }); }

        if (session == null || session.User == null)
            return BadRequest(new { mensagem = "Não foi possível criar a conta. Email já em uso?" });

        if (!Guid.TryParse(session.User.Id, out var supabaseUserId))
            return BadRequest(new { mensagem = "Erro de ID." });

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var novaClinica = new Clinica
            {
                Id = Guid.NewGuid(),
                UsuarioId = supabaseUserId,
                Nome = request.NomeClinica,
                EmailContato = request.Email,
                Nif = request.Nif,
                Telefone = request.Telefone,
                Rua = request.Rua,                 
                Cidade = request.Cidade,           
                CodigoPostal = request.CodigoPostal,
                CreatedAt = DateTime.UtcNow
            };
            _context.Clinicas.Add(novaClinica);

            if (convite != null)
            {
                var novoVinculo = new LaboratorioClinica
                {
                    Id = Guid.NewGuid(),
                    LaboratorioId = convite.LaboratorioId,
                    ClinicaId = novaClinica.Id
                };
                _context.LaboratorioClinicas.Add(novoVinculo);

                convite.Usado = true;
                _context.ConvitesClinicas.Update(convite);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            if (convite != null)
            {
                var novaNotificacao = new Notificacao
                {
                    Id = Guid.NewGuid(),
                    UsuarioId = convite.LaboratorioId,
                    Titulo = "Novo Parceiro Registado!",
                    Texto = $"A clínica {novaClinica.Nome} acabou de criar conta e aceitou o seu convite.",
                    Lida = false,
                    CreatedAt = DateTime.UtcNow
                    // REMOVIDO: Tipo = "Convite"
                };
                _context.Notificacoes.Add(novaNotificacao);
                await _context.SaveChangesAsync();

                await _hubContext.Clients.Group($"Lab_{convite.LaboratorioId}").SendAsync("NovaNotificacao", novaNotificacao);
            }

            return StatusCode(201, new { mensagem = "Clínica registada com sucesso." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            Console.WriteLine($"Erro ao gravar Clinica: {ex.InnerException?.Message ?? ex.Message}");
            return StatusCode(500, new { mensagem = "Erro ao gravar a clínica no banco." });
        }
    }
    
    [HttpPost("convite/aceitar/{token}")]
    [Authorize] 
    public async Task<IActionResult> AceitarConvite(Guid token)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var uid))
            return Unauthorized();

        var clinica = await _context.Clinicas.FirstOrDefaultAsync(c => c.UsuarioId == uid);
        if (clinica == null)
            return BadRequest(new { mensagem = "Apenas clínicas podem aceitar este convite." });

        var convite = await _context.ConvitesClinicas
            .FirstOrDefaultAsync(c => c.Id == token && !c.Usado && c.DataExpiracao > DateTime.UtcNow);

        if (convite == null)
            return BadRequest(new { mensagem = "Convite inválido, expirado ou já utilizado." });

        var vinculoExiste = await _context.LaboratorioClinicas
            .AnyAsync(lc => lc.LaboratorioId == convite.LaboratorioId && lc.ClinicaId == clinica.Id);

        if (vinculoExiste)
            return BadRequest(new { mensagem = "Você já está vinculado a este laboratório." });

        var novoVinculo = new LaboratorioClinica
        {
            Id = Guid.NewGuid(),
            LaboratorioId = convite.LaboratorioId,
            ClinicaId = clinica.Id
        };

        _context.LaboratorioClinicas.Add(novoVinculo);
        
        convite.Usado = true;
        _context.ConvitesClinicas.Update(convite);

        await _context.SaveChangesAsync();

        var novaNotificacao = new Notificacao
        {
            Id = Guid.NewGuid(),
            UsuarioId = convite.LaboratorioId,
            Titulo = "Novo Vínculo!",
            Texto = $"A clínica {clinica.Nome} acabou de aceitar o seu convite.",
            Lida = false,
            CreatedAt = DateTime.UtcNow
            // REMOVIDO: Tipo = "Convite"
        };
        _context.Notificacoes.Add(novaNotificacao);
        await _context.SaveChangesAsync();

        await _hubContext.Clients.Group($"Lab_{convite.LaboratorioId}").SendAsync("NovaNotificacao", novaNotificacao);

        return Ok(new { mensagem = "Vínculo criado com sucesso! Agora você faz parte deste laboratório." });
    }
    
    [HttpPost("recuperar-senha")]
    [AllowAnonymous]
    public async Task<IActionResult> RecuperarSenha([FromBody] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(new { mensagem = "O e-mail é obrigatório." });

        try
        {
            await _supabaseClient.Auth.ResetPasswordForEmail(email);
            return Ok(new { mensagem = "Se o e-mail existir no nosso sistema, receberá um link de recuperação em breve." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao pedir recuperação de senha: {ex.Message}");
            return Ok(new { mensagem = "Se o e-mail existir no nosso sistema, receberá um link de recuperação em breve." });
        }
    }
}