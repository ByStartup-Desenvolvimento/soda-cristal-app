import { create } from 'zustand';
import { userService, LoginRequest } from '../../shared/api/services/userService';
import type { User } from './models';
import { isTokenValid } from '../../shared/utils/tokenValidator';

interface UserState {
    isLoggedIn: boolean;
    user: User | null;
    vendedorId: number | null;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;
    login: (credentials: LoginRequest) => Promise<void>;
    logout: () => void;
    initialzedAuth: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
    isLoggedIn: false,
    user: null,
    vendedorId: null,
    isLoading: false,
    error: null,
    isInitialized: false,

    initialzedAuth: async () => {
        const token = localStorage.getItem('auth_token');
        const vendedorId = localStorage.getItem('vendedorId');
        const distribuidorId = localStorage.getItem('distribuidorId');
        const userStr = localStorage.getItem('user');



        if (token && vendedorId && distribuidorId && userStr) {
            // ✅ Valida o token JWT antes de restaurar a sessão
            if (!isTokenValid(token)) {
                console.warn('⚠️ Token JWT inválido ou expirado. Limpando sessão...');



                // Limpa dados inválidos
                localStorage.removeItem('auth_token');
                localStorage.removeItem('vendedorId');
                localStorage.removeItem('distribuidorId');
                localStorage.removeItem('user');

                set({
                    isLoggedIn: false,
                    user: null,
                    vendedorId: null,
                    isLoading: false,
                    isInitialized: true
                });
                return;
            }

            try {
                // Parse do usuário salvo no localStorage
                const user = JSON.parse(userStr);



                // Restaura o estado de autenticação
                // O interceptor do Axios lidará com erros 401 nas próximas requisições
                set({
                    isLoggedIn: true,
                    user: user,
                    vendedorId: vendedorId ? Number(vendedorId) : null,
                    isLoading: false,
                    isInitialized: true
                });

            } catch (error: any) {
                console.error('❌ Erro ao parsear dados do localStorage:', error);

                // Limpa dados corrompidos
                localStorage.removeItem('auth_token');
                localStorage.removeItem('vendedorId');
                localStorage.removeItem('distribuidorId');
                localStorage.removeItem('user');

                set({
                    isLoggedIn: false,
                    user: null,
                    vendedorId: null,
                    isLoading: false,
                    isInitialized: true
                });
            }
        } else {
            set({ isInitialized: true });
        }
    },

    login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
            const response = await userService.login(credentials);

            // ✅ Valida o token JWT recebido do backend
            if (!isTokenValid(response.access_token)) {
                console.error('❌ Token JWT recebido do backend é inválido!');

                throw new Error('Token JWT inválido recebido do servidor');
            }

            // Armazena token - idealmente usar um authService separado ou interceptor managing isso,
            // mas por enquanto simples:

            localStorage.setItem('auth_token', response.access_token);
            localStorage.setItem('vendedorId', response.vendedor.id.toString());
            localStorage.setItem('distribuidorId', response.distribuidor.id.toString());
            localStorage.setItem('user', JSON.stringify(response.user));

            set({
                isLoggedIn: true,
                user: response.user,// Fallback se backend não retornar user object ainda
                vendedorId: response.vendedor.id,
                isLoading: false,
            });
        } catch (error: any) {
            console.error('Login failed', error);
            set({
                error: error.response?.data?.message || error.message || 'Falha ao realizar login',
                isLoading: false,
                isLoggedIn: false
            });
            throw error; // Re-throw para componente poder reagir se quiser
        }
    },
    logout: () => {


        localStorage.removeItem('auth_token');
        localStorage.removeItem('vendedorId');
        localStorage.removeItem('distribuidorId');
        localStorage.removeItem('user');
        set({ isLoggedIn: false, user: null, vendedorId: null });
    },
}));
