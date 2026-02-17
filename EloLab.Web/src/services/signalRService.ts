import * as signalR from '@microsoft/signalr';
import { api } from './api';
import { notify } from '../utils/notify'; // O nosso querido Toaster!

class SignalRService {
    public connection: signalR.HubConnection | null = null;

    public startConnection() {
        const token = localStorage.getItem('elolab_token');
        if (!token) return;

        const baseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5036';

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${baseUrl}/hubs/app`, {
                accessTokenFactory: () => token,
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
            })
            .withAutomaticReconnect()
            .build();

        // 1. INICIA A LIGAÇÃO
        this.connection.start()
            .then(() => {
                console.log('🟢 Túnel Tempo-Real Conectado!');
                this.registerListeners(); // <--- CHAMA OS OUVINTES DEPOIS DE LIGAR
            })
            .catch(err => console.error('🔴 Erro no SignalR: ', err));
    }

    // 2. REGISTA OS OUVINTES PARA OS EVENTOS DO C#
    private registerListeners() {
        if (!this.connection) return;

        // Ouve exatamente o evento "NovaNotificacao" que o C# envia
        this.connection.on("NovaNotificacao", (notificacao) => {
            console.log("📨 Nova notificação recebida em tempo real!", notificacao);

            // Dispara o alerta no canto superior direito usando o título e texto reais do banco de dados!
            notify.success(`${notificacao.titulo} \n ${notificacao.texto}`);

            // Dispara um evento global no navegador. 
            // O seu componente de Sidebar e a página de Notificações vão ouvir isto 
            // para atualizar a bolinha vermelha e a lista sem o utilizador dar F5!
            window.dispatchEvent(new CustomEvent('elolab_nova_notificacao', { detail: notificacao }));
        });
    }

    public stopConnection() {
        if (this.connection) {
            this.connection.stop();
            this.connection = null;
        }
    }
}

export const signalRService = new SignalRService();