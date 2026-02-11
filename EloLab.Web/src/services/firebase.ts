// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Substitua com os SEUS dados do Firebase Console
const firebaseConfig = { 
    apiKey: "AIzaSyCG8u2HizyUS6usJ6fScw3CM8ZErAh1hHk", 
    authDomain: "elolab-ad6a0.firebaseapp.com", 
    projectId: "elolab-ad6a0", 
    storageBucket: "elolab-ad6a0.firebasestorage.app", 
    messagingSenderId: "1098483361740", 
    appId: "1:1098483361740:web:be3b6029ed3955add8df69" 
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// Função para pedir permissão e gerar o Token do Dispositivo
export const requestForToken = async () => {
    try {
        const currentToken = await getToken(messaging, {
            // Substitua com a VAPID KEY que gerou no passo 7 da Fase 1
            vapidKey: 'BE_6OXxtDdqqQR5UmkhQgNhNh5KEXU419gs1c7NRuvFajYX2Fix5tgCkZeOB6Faf0R0wTYZhaVmFLpWTa-Pzg-E'
        });

        if (currentToken) {
            console.log('FCM Token gerado:', currentToken);
            return currentToken;
        } else {
            console.log('Permissão negada ou token não disponível.');
            return null;
        }
    } catch (err) {
        console.error('Erro ao gerar FCM token:', err);
        return null;
    }
};

// Listener para notificações quando o utilizador está com o site ABERTO
export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });