import axios from 'axios';
import { notify } from '../utils/notify';

export const api = axios.create({
    baseURL: 'http://localhost:5036/api', // <--- CONFIRA SUA PORTA AQUI
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
        // Se deu sucesso, deixa passar direto
        return response;
    },
    (error) => {
        // Se deu erro, e NÃO for erro 401 (token expirado)
        if (error.response?.status !== 401) {
            // Tenta pegar a mensagem de erro que veio do C#
            const mensagem = error.response?.data?.erro || error.response?.data || "Ocorreu um erro no servidor.";

            // Dispara o toast de erro automaticamente!
            notify.error(typeof mensagem === 'string' ? mensagem : "Ocorreu um erro.");
        }
        return Promise.reject(error);
    }
);