import axios from 'axios';
import { notify } from '../utils/notify';

// Lógica Inteligente de URL:
// 1. Tenta pegar a variável de ambiente (Vercel injeta isso)
// 2. Se não existir, usa localhost para desenvolvimento
const baseURL = 'https://elolab.onrender.com/api;

export const api = axios.create({
    baseURL: baseURL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('elolab_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status !== 401) {
            const mensagem = error.response?.data?.erro || error.response?.data || "Ocorreu um erro no servidor.";
            // Evita mostrar [Object object] se o erro for complexo
            const textoFinal = typeof mensagem === 'string' ? mensagem : "Erro de processamento.";
            notify.error(textoFinal);
        }
        return Promise.reject(error);
    }
);