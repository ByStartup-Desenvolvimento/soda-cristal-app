import axios from 'axios';
import { toast } from 'sonner';
import { API_CONFIG } from './config';
import { isNetworkError } from './networkUtils';

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
        // Sem resposta HTTP: não tratar como sessão inválida
        if (isNetworkError(error)) {
            return Promise.reject(error);
        }

        // Se receber 401 (Unauthorized), o token pode ter expirado ou usuário inativo
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
