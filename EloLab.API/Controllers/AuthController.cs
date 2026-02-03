using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EloLab.API.Data;
using EloLab.API.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens; // Para SecurityTokenDescriptor

namespace EloLab.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly Supabase.Client _supabaseClient;
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(Supabase.Client supabaseClient, AppDbContext context, IConfiguration configuration)
    {
        _supabaseClient = supabaseClient;
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            // 1. Autenticar no Supabase (verifica se a senha bate)
            var session = await _supabaseClient.Auth.SignIn(request.Email, request.Password);

            if (session == null || session.User == null)
                return BadRequest(new { erro = "Credenciais inválidas." });

            // ID do usuário no Supabase
            if (!Guid.TryParse(session.User.Id, out var userId))
                return BadRequest(new { erro = "ID de usuário inválido." });

            // 2. Descobrir QUEM é este usuário nas nossas tabelas
            string tipo = "Desconhecido";
            string nome = session.User.Email; // Nome padrão caso não tenha perfil
            Guid? laboratorioId = null;
            Guid? clinicaId = null;

            // Procura na tabela de Laboratórios
            var lab = await _context.Laboratorios.FirstOrDefaultAsync(l => l.UsuarioId == userId);
            if (lab != null)
            {
                tipo = "Laboratorio";
                nome = lab.Nome;
                laboratorioId = lab.Id;
            }
            else
            {
                // Se não for Lab, procura na tabela de Clínicas
                var clinica = await _context.Clinicas.FirstOrDefaultAsync(c => c.UsuarioId == userId);
                if (clinica != null)
                {
                    tipo = "Clinica";
                    nome = clinica.Nome;
                    clinicaId = clinica.Id;
                }
            }

            // 3. Criar o "Token Inteligente" (Com os IDs lá dentro)
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Email, session.User.Email ?? ""),
                new Claim("tipo", tipo)
            };

            // Aqui está o segredo: Colocamos o ID do Lab/Clinica direto no token
            if (laboratorioId != null) claims.Add(new Claim("laboratorioId", laboratorioId.ToString()));
            if (clinicaId != null) claims.Add(new Claim("clinicaId", clinicaId.ToString()));

            // Assinar o token
            var jwtSecret = _configuration["SupabaseSettings:JwtSecret"];
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7), // Dura 7 dias
                SigningCredentials = creds,
                Issuer = $"{_configuration["SupabaseSettings:Url"]}/auth/v1",
                Audience = "authenticated"
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var jwtString = tokenHandler.WriteToken(token);

            // 4. Retornar tudo pronto para o Frontend
            return Ok(new 
            { 
                token = jwtString,
                usuarioId = userId,
                email = session.User.Email,
                tipo = tipo,
                nome = nome
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro Login: {ex.Message}");
            return BadRequest(new { erro = "Falha no login. Verifique as credenciais." });
        }
    }
    
    // Mantemos o /me para compatibilidade, mas agora ele é mais robusto
    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize] 
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
}