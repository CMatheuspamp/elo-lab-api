using EloLab.API.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace EloLab.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly Supabase.Client _supabaseClient;

    public AuthController(Supabase.Client supabaseClient)
    {
        _supabaseClient = supabaseClient;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            // O Supabase verifica o email e senha
            var session = await _supabaseClient.Auth.SignIn(request.Email, request.Password);

            // Se der certo, devolvemos o Token de Acesso (o nosso "crachá")
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
}