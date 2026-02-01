using EloLab.API.Data;
using EloLab.API.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // Necessário para conversar com o Banco

namespace EloLab.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly Supabase.Client _supabaseClient;
    private readonly AppDbContext _context; // <--- NOVIDADE 1: O acesso ao Banco

    // NOVIDADE 2: Adicionamos o 'AppDbContext context' aqui para poder usar o banco
    public AuthController(Supabase.Client supabaseClient, AppDbContext context)
    {
        _supabaseClient = supabaseClient;
        _context = context;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var session = await _supabaseClient.Auth.SignIn(request.Email, request.Password);

            return Ok(new 
            { 
                token = session.AccessToken,
                usuarioId = session.User.Id,
                email = session.User.Email
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { erro = "Login falhou. Verifique email e senha." });
        }
    }
    
    // NOVIDADE 3: O método agora é 'async Task' e procura no banco
    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize] 
    public async Task<IActionResult> GetMe()
    {
        // 1. Pegamos o ID do token
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        // O Supabase as vezes manda o ID num campo chamado 'sub'
        if (string.IsNullOrEmpty(userId))
            userId = User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        // Convertemos o ID de string para Guid para poder pesquisar
        if (!Guid.TryParse(userId, out var usuarioGuid))
            return BadRequest("ID de usuário inválido.");

        // 2. Vamos ao banco ver se existe um Laboratório com este dono
        var laboratorio = await _context.Laboratorios
            .FirstOrDefaultAsync(l => l.UsuarioId == usuarioGuid);

        if (laboratorio != null)
        {
            return Ok(new 
            { 
                Tipo = "Laboratorio", 
                MeusDados = laboratorio,
                SeuId = userId
            });
        }

        // 3. Vamos ao banco ver se existe uma Clínica com este dono
        var clinica = await _context.Clinicas
            .FirstOrDefaultAsync(c => c.UsuarioId == usuarioGuid);

        if (clinica != null)
        {
            return Ok(new 
            { 
                Tipo = "Clinica", 
                MeusDados = clinica,
                SeuId = userId
            });
        }

        // 4. Se não achou nada (usuário novo que ainda não tem perfil)
        return Ok(new 
        { 
            Tipo = "Desconhecido", 
            Mensagem = "Você está logado, mas não tem Laboratório nem Clínica vinculados.",
            SeuId = userId
        });
    }
}