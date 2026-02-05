import axios from 'axios';
import { API_CONFIG } from './config';

const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    headers: {
        'Content-Type': API_CONFIG.HEADERS.CONTENT_TYPE,
    },
});

api.interceptors.request.use(
    (config) => {
        // Adiciona o header de versão do app (obrigatório)
        config.headers['versaoApp'] = API_CONFIG.APP_VERSION;

        // Recupera o token do localStorage (se existir)
        const token = localStorage.getItem('auth_token'); // TODO: Ajustar chave do token conforme padrão do projeto
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Se receber 401 (Unauthorized), o token pode ter expirado
        if (error.response?.status === 401) {
            console.warn('⚠️ Token expirado ou inválido (401). Fazendo logout automático...');

            // Limpa o localStorage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('vendedorId');
            localStorage.removeItem('distribuidorId');
            localStorage.removeItem('user');

            // Redireciona para a tela de login
            // Nota: Isso funcionará se a aplicação verificar isLoggedIn no próximo render
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default api;
