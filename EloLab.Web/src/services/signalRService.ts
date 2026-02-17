import * as signalR from '@microsoft/signalr';
import { notify } from '../utils/notify';

class SignalRService {
    public connection: signalR.HubConnection | null = null;

    public startConnection() {
        const token = localStorage.getItem('elolab_token');
        if (!token) return;

        const apiUrl = import.meta.env.VITE_API_URL;
        if (!apiUrl) return;

        const rootUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
        const hubUrl = `${rootUrl}/hubs/app`;

        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => token,
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .configureLogging(signalR.LogLevel.Error)
            .withAutomaticReconnect()
            .build();

        this.connection.start()
            .then(() => {
                console.log('🟢 Tempo-Real OK');
                this.registerListeners();
            })
            .catch(() => {
                this.retryWithDefault(hubUrl, token);
            });
    }

    private retryWithDefault(hubUrl: string, token: string) {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, { accessTokenFactory: () => token })
            .configureLogging(signalR.LogLevel.Error)
            .withAutomaticReconnect()
            .build();

        this.connection.start()
            .then(() => {
                console.log('🟢 Tempo-Real OK (Fallback)');
                this.registerListeners();
            })
            .catch((e) => console.error('🔴 Falha na conexão de Tempo-Real:', e));
    }

    private registerListeners() {
        if (!this.connection) return;

        this.connection.on("NovaNotificacao", (notificacao) => {
            notify.success(`${notificacao.titulo} \n ${notificacao.texto}`);

            try {
                const audio = new Audio('/notificacao.mp3');
                audio.play().catch(() => console.log("Som bloqueado temporariamente pelo navegador."));
            } catch {
            }

            if (Notification.permission === "granted") {
                new Notification(notificacao.titulo, {
                    body: notificacao.texto,
                    icon: '/logo.png'
                });
            }
            else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        new Notification(notificacao.titulo, { body: notificacao.texto, icon: '/logo.png' });
                    }
                });
            }

            window.dispatchEvent(new CustomEvent('elolab_nova_notificacao', { detail: notificacao }));
            window.dispatchEvent(new CustomEvent('elolab_notificacoes_atualizar'));
        });
    }

    // === ESTA É A PARTE QUE FALTAVA PARA O VERCEL PASSAR ===
    public stopConnection() {
        if (this.connection) {
            this.connection.stop();
            this.connection = null;
        }
    }
}

export const signalRService = new SignalRService();