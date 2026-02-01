import axios from 'axios';

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