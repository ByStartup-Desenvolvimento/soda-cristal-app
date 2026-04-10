import { create } from 'zustand';
import { userService, LoginRequest } from '../../shared/api/services/userService';
import type { User } from './models';
import { isTokenValid } from '../../shared/utils/tokenValidator';
import { useRotasStore } from '../rotas/rotasStore';
import { useDeliveryStore } from '../deliveries/deliveryStore';
import { useOutboxStore } from '../sync/outboxStore';
import { useSyncStore } from '../sync/syncStore';

const AUTH_STORAGE_KEYS = ['auth_token', 'vendedorId', 'distribuidorId', 'user', 'soda-delivery-storage', 'soda-rotas-storage'] as const;

function clearAuthStorage() {
    AUTH_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
}

interface UserState {
    isLoggedIn: boolean;
    user: User | null;
    vendedorId: number | null;
    distribuidorId: number | null;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;
    login: (credentials: LoginRequest) => Promise<void>;
    logout: () => void;
    initializeAuth: () => void;
}

export const useUserStore = create<UserState>((set) => ({
    isLoggedIn: false,
    user: null,
    vendedorId: null,
    distribuidorId: null,
    isLoading: false,
    error: null,
    isInitialized: false,

    initializeAuth: () => {
        const token = localStorage.getItem('auth_token');
        const vendedorId = localStorage.getItem('vendedorId');
        const distribuidorId = localStorage.getItem('distribuidorId');
        const userStr = localStorage.getItem('user');

        if (!token || !vendedorId || !distribuidorId || !userStr) {
            set({ isInitialized: true });
            return;
        }

        isTokenValid(token);

        try {
            const user: User = JSON.parse(userStr);

            set({
                isLoggedIn: true,
                user,
                vendedorId: Number(vendedorId),
                distribuidorId: Number(distribuidorId),
                isLoading: false,
                isInitialized: true
            });
        } catch (error: unknown) {
            console.error('Erro ao parsear dados do localStorage:', error);
            clearAuthStorage();
            set({ isLoggedIn: false, user: null, vendedorId: null, distribuidorId: null, isLoading: false, isInitialized: true });
        }
    },

    login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
            const response = await userService.login(credentials);

            if (!response.access_token) {
                throw new Error('Token não recebido do servidor');
            }

            localStorage.setItem('auth_token', response.access_token);
            localStorage.setItem('vendedorId', response.vendedor.id.toString());
            localStorage.setItem('distribuidorId', response.distribuidor.id.toString());
            localStorage.setItem('user', JSON.stringify(response.user));

            set({
                isLoggedIn: true,
                user: response.user,
                vendedorId: response.vendedor.id,
                distribuidorId: response.distribuidor.id,
                isLoading: false,
            });
        } catch (error: unknown) {
            console.error('Login failed', error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            set({
                error: err.response?.data?.message || err.message || 'Falha ao realizar login',
                isLoading: false,
                isLoggedIn: false
            });
            throw error;
        }
    },

    logout: () => {
        useOutboxStore.setState({ items: [] });
        useSyncStore.getState().resetForLogout();
        useRotasStore.setState({
            hasHydratedFromStorage: false,
            offlineModeHint: null,
            rotas: [],
            rotasDeHoje: [],
            rotaAtual: null,
            clientesRota: [],
            deliveriesPorRota: {},
            isLoading: false,
            isLoadingDeliveries: false,
            error: null,
            lastFetchTodaysRoutes: null,
            lastFetchRotas: null,
            lastFetchDate: null,
            loadingStep: null,
            loadingProgress: null,
        });
        useDeliveryStore.setState({
            selectedDelivery: null,
            selectedRoute: null,
            deliveryStatuses: {},
        });

        clearAuthStorage();

        void Promise.all([
            useOutboxStore.persist.clearStorage(),
            useRotasStore.persist.clearStorage(),
            useSyncStore.persist.clearStorage(),
            useDeliveryStore.persist.clearStorage(),
        ]);

        set({ isLoggedIn: false, user: null, vendedorId: null, distribuidorId: null });
    },
}));
