import api from '../index';
import { ENDPOINTS } from '../endpoints';
import { API_CONFIG } from '../config';
import { isNetworkError } from '../networkUtils';
import type { User } from '../../../domain/auth/models';

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    user: User;
    vendedor: {
        id: number;
    };
    distribuidor: {
        id: number;
    };
}

const LOGIN_MAX_RETRIES = 2;
const LOGIN_BASE_DELAY_MS = 2_000;

async function loginWithRetry(credentials: LoginRequest): Promise<LoginResponse> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= LOGIN_MAX_RETRIES; attempt++) {
        try {
            const response = await api.post<LoginResponse>(ENDPOINTS.LOGIN, credentials, {
                timeout: API_CONFIG.TIMEOUT.LOGIN,
            });
            return response.data;
        } catch (error) {
            lastError = error;

            const isLastAttempt = attempt === LOGIN_MAX_RETRIES;
            if (isLastAttempt || !isNetworkError(error)) throw error;

            const delay = LOGIN_BASE_DELAY_MS * Math.pow(2, attempt);
            console.warn(`Login tentativa ${attempt + 1} falhou (rede). Retentando em ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

export const userService = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        return loginWithRetry(credentials);
    },
    getCurrentUser: async (): Promise<User> => {
        // Pega os dados do localStorage
        const vendedorIdStr = localStorage.getItem('vendedorId');
        const userStr = localStorage.getItem('user');


        if (!vendedorIdStr || !userStr) {
            throw new Error('Dados de autenticação não encontrados');
        }

        const vendedorId = Number(vendedorIdStr);
        const user: User = JSON.parse(userStr);

        try {
            // Faz uma chamada leve apenas para validar se o token ainda é válido
            // Usa um endpoint que você sabe que existe (ex: rotas do vendedor)
            const endpoint = ENDPOINTS.rotasVendedor(vendedorId);

            await api.get(endpoint);

            // Se chegou aqui, o token é válido
            // Retorna o user que estava no localStorage
            return user;

        } catch (error: any) {


            // Verifica se é erro 401 (não autorizado = token inválido)
            if (error.response?.status === 401) {
                console.warn('Token inválido ou expirado');
            }
            throw error;
        }
    },
};
