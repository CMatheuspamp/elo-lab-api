import * as signalR from '@microsoft/signalr';
import { notify } from '../utils/notify';

class SignalRService {
    public connection: signalR.HubConnection | null = null;

    public startConnection() {
        const token = localStorage.getItem('elolab_token');
        if (!token) return;

        const apiUrl = import.meta.env.VITE_API_URL;
        if (!apiUrl) return;

        // Garante que a URL é absoluta e troca /api por /hubs/app de forma segura
        const rootUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
        const hubUrl = `${rootUrl}/hubs/app`;

        console.log('🔗 Tentando conectar ao Hub:', hubUrl);

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => token,
                // skipNegotiation: true obriga a usar WebSockets direto. 
                // Se o Render/Vercel der erro 405, mude para false.
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .withAutomaticReconnect()
            .build();

        this.connection.start()
            .then(() => {
                console.log('🟢 Túnel Tempo-Real Conectado!');
                this.registerListeners(); // <--- ISTO FALTA NO TEU ARQUIVO ATUAL
            })
            .catch(err => {
                console.error('🔴 Erro no SignalR (tentando fallback): ', err);
                // Fallback: Tenta novamente com negociação padrão se o WebSocket direto falhar
                this.retryWithDefault(hubUrl, token);
            });
    }

    private retryWithDefault(hubUrl: string, token: string) {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, { accessTokenFactory: () => token })
            .withAutomaticReconnect()
            .build();

        this.connection.start()
            .then(() => {
                console.log('🟢 Túnel Conectado via Fallback!');
                this.registerListeners();
            })
            .catch(e => console.error('🔴 Falha total:', e));
    }

    private registerListeners() {
        if (!this.connection) return;

        this.connection.on("NovaNotificacao", (notificacao) => {
            console.log("📨 Nova notificação recebida!", notificacao);
            notify.success(`${notificacao.titulo} \n ${notificacao.texto}`);
            window.dispatchEvent(new CustomEvent('elolab_nova_notificacao', { detail: notificacao }));
            // Avisa a sidebar para atualizar o contador
            window.dispatchEvent(new CustomEvent('elolab_notificacoes_atualizar'));
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