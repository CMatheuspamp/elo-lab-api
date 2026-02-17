using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace EloLab.API.Hubs;

[Authorize] // Só utilizadores logados podem ligar-se ao túnel
public class AppHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        // Quando um utilizador entra no site, ligamos ele a uma "sala" (Group) com o ID do laboratório ou clínica dele.
        // Assim, quando quisermos avisar o laboratório X, avisamos só a sala dele, e não o país inteiro!
        
        var userType = Context.User?.FindFirst("tipo")?.Value;
        var labId = Context.User?.FindFirst("laboratorioId")?.Value;
        var clinicaId = Context.User?.FindFirst("clinicaId")?.Value;

        if (userType == "Laboratorio" && !string.IsNullOrEmpty(labId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Lab_{labId}");
        }
        else if (userType == "Clinica" && !string.IsNullOrEmpty(clinicaId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Clinica_{clinicaId}");
        }

        await base.OnConnectedAsync();
    }
}