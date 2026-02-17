import * as signalR from '@microsoft/signalr';
import { notify } from '../utils/notify'; // O nosso querido Toaster!

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
            // === NOVIDADE: CALA OS LOGS DE INFORMAÇÃO DO SIGNALR ===
            // Oculta o token do console. Só mostra erros críticos (vermelhos).
            .configureLogging(signalR.LogLevel.Error)
            .withAutomaticReconnect()
            .build();

        this.connection.start()
            .then(() => {
                // Mantemos apenas um aviso discreto de que está a funcionar
                console.log('🟢 Tempo-Real OK');
                this.registerListeners();
            })
            .catch(() => { // Correção: removido o 'err' não utilizado
                this.retryWithDefault(hubUrl, token);
            });
    }

    private retryWithDefault(hubUrl: string, token: string) {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, { accessTokenFactory: () => token })
            .configureLogging(signalR.LogLevel.Error) // Cala o fallback também
            .withAutomaticReconnect()
            .build();

        this.connection.start()
            .then(() => {
                console.log('🟢 Tempo-Real OK (Fallback)');
                this.registerListeners();
            })
            .catch((e) => console.error('🔴 Falha na conexão de Tempo-Real:', e)); // Correção: agora o 'e' é lido e impresso no console
    }

    private registerListeners() {
        if (!this.connection) return;

        this.connection.on("NovaNotificacao", (notificacao) => {
            // 1. O nosso Toaster dentro do site
            notify.success(`${notificacao.titulo} \n ${notificacao.texto}`);

            // 2. Tocar o som de notificação (O ficheiro notificacao.mp3 tem de estar na pasta public)
            try {
                const audio = new Audio('/notificacao.mp3');
                // O .catch evita que o console dê erro caso o navegador bloqueie o som 
                // (alguns navegadores exigem que o utilizador clique no site antes de permitir som)
                audio.play().catch(() => console.log("Som bloqueado temporariamente pelo navegador."));
            } catch {
                // Correção: removido o parâmetro 'error' (funcionalidade moderna do JS/TS)
            }

            // 3. Notificação Push do Sistema Operativo (Windows/Mac/Android)
            // Se já tem permissão, mostra o alerta.
            if (Notification.permission === "granted") {
                new Notification(notificacao.titulo, {
                    body: notificacao.texto,
                    icon: '/logo.png' // Mostra a vossa logo no alerta do Windows!
                });
            }
            // Se ainda não perguntou, pede permissão ao utilizador
            else if (Notification.permission !== "denied") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        new Notification(notificacao.titulo, { body: notificacao.texto, icon: '/logo.png' });
                    }
                });
            }

            // 4. Atualizar o site
            window.dispatchEvent(new CustomEvent('elolab_nova_notificacao', { detail: notificacao }));
            window.dispatchEvent(new CustomEvent('elolab_notificacoes_atualizar'));
        });
    }
}

export const signalRService = new SignalRService();