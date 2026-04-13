import axios from 'axios';
import { toast } from 'sonner';
import { API_CONFIG } from './config';
import { isNetworkError, isAbortError } from './networkUtils';
import { getDataSignal } from './fetchController';
import { ENDPOINTS } from './endpoints';

const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT.DEFAULT,
    headers: {
        'Content-Type': API_CONFIG.HEADERS.CONTENT_TYPE,
    },
});

const LOGIN_PATH = ENDPOINTS.LOGIN;

api.interceptors.request.use(
    (config) => {
        config.headers['versaoApp'] = API_CONFIG.APP_VERSION;

        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        const isLoginCall = config.url === LOGIN_PATH;
        if (!isLoginCall && !config.signal) {
            config.signal = getDataSignal();
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
        if (isAbortError(error)) return Promise.reject(error);

        if (isNetworkError(error)) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401) {
            const mensagemErro = error.response?.data?.message || 'Sua sessão expirou.';

            // Exibe toast de erro para melhor UX
            toast.error('Sessão Encerrada', {
                description: `${mensagemErro}. Redirecionando...`,
                duration: 4000,
            });

            console.warn('⚠️ 401 Unauthorized:', mensagemErro);

            // Limpa o localStorage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('vendedorId');
            localStorage.removeItem('distribuidorId');
            localStorage.removeItem('user');

            // Aguarda brevemente o usuário ler o toast antes de redirecionar
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        }

        return Promise.reject(error);
    }
);

export default api;
