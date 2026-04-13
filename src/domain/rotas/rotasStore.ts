import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import type { Rota, RotaEntregaCompleta } from './models';
import { rotasService } from './services';
import { isNetworkError, isAbortError } from '../../shared/api/networkUtils';
import { useNetworkStore } from '../../shared/store/networkStore';

export const OFFLINE_CACHE_MESSAGE = 'Sem conexão — exibindo dados salvos';

interface RotasState {
    /** Só true após `persist.rehydrate()` (evita fetch antes do cache do IDB). Não persistido. */
    hasHydratedFromStorage: boolean;
    /** Aviso não-bloqueante quando há cache após falha de rede. Não persistido. */
    offlineModeHint: string | null;
    rotas: Rota[];
    rotasDeHoje: Rota[];
    rotaAtual: Rota | null;
    clientesRota: RotaEntregaCompleta[];
    deliveriesPorRota: Record<number, RotaEntregaCompleta[]>;
    isLoading: boolean;
    isLoadingDeliveries: boolean;
    error: string | null;
    lastFetchTodaysRoutes: number | null; // Data do último fetch (timestamp)
    lastFetchRotas: number | null;
    lastFetchDate: string | null;
    loadingStep: 'rotas' | 'clientes' | null;
    loadingProgress: { current: number; total: number } | null;

    loadRotas: (vendedorId: number, forceRefresh?: boolean) => Promise<void>;
    loadTodaysRoutes: (vendedorId: number, forceRefresh?: boolean) => Promise<void>;
    loadDeliveriesPorRotas: (rotaIds: number[]) => Promise<void>;
    selectRota: (rotaId: number) => void;
    loadClientesRota: (rotaId: number) => Promise<void>;
    clearError: () => void;
    clearOfflineModeHint: () => void;
    setHasHydratedFromStorage: (value: boolean) => void;
}

export const useRotasStore = create<RotasState>()(
    persist(
        (set, get) => ({
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

    setHasHydratedFromStorage: (value: boolean) => set({ hasHydratedFromStorage: value }),

    clearOfflineModeHint: () => set({ offlineModeHint: null }),

    // Carregar rotas do vendedor
    loadRotas: async (vendedorId: number, forceRefresh = false) => {
        if (!get().hasHydratedFromStorage) return;

        if (!useNetworkStore.getState().isOnline) {
            const s = get();
            if (s.rotas.length > 0) {
                set({ isLoading: false, offlineModeHint: OFFLINE_CACHE_MESSAGE, error: null });
                return;
            }
            set({
                isLoading: false,
                error: 'Sem conexão. Não há rotas salvas para exibir.',
                offlineModeHint: null,
            });
            return;
        }

        const CACHE_MINUTES = 480; // 8h — rotas mudam ~1x/mês, cache agressivo para economizar rede
        const STALE_HOURS = 8;
        const now = Date.now();
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        
        const isNewDay = state.lastFetchDate !== today;
        const cacheAge = state.lastFetchRotas ? now - state.lastFetchRotas : Infinity;

        const validCache = cacheAge < CACHE_MINUTES * 60 * 1000;
        const staleCache = cacheAge >= CACHE_MINUTES * 60 * 1000 && cacheAge < STALE_HOURS * 60 * 60 * 1000;

        // Se tem cache válido E dados na memória, sai fora pra economizar rede
        const hasData = state.rotas.length > 0;
        if (!forceRefresh && !isNewDay && validCache && hasData) {
            return;
        }

        const shouldShowLoading = forceRefresh || isNewDay || !staleCache;

        if (shouldShowLoading) {
            set({ isLoading: true, error: null, offlineModeHint: null });
        } else {
            set({ error: null });
        }

        try {
            const rotas = await rotasService.getRotasVendedor(vendedorId);
            set({
                rotas,
                isLoading: false,
                lastFetchRotas: Date.now(),
                lastFetchDate: today,
                offlineModeHint: null,
                error: null,
            });
        } catch (error: unknown) {
            if (isAbortError(error)) {
                set({ isLoading: false });
                return;
            }
            const state = get();
            if (isNetworkError(error) && state.rotas.length > 0) {
                set({
                    isLoading: false,
                    error: null,
                    offlineModeHint: OFFLINE_CACHE_MESSAGE,
                });
                return;
            }
            const message = error instanceof Error ? error.message : 'Erro ao carregar rotas';
            set({ error: message, isLoading: false });
        }
    },

    // Carregar as rotas do dia de hoje e acumular todos os clientes
    loadTodaysRoutes: async (vendedorId: number, forceRefresh = false) => {
        if (!get().hasHydratedFromStorage) return;

        const CACHE_MINUTES = 480; // 8h — clientes mudam ~1x/mês, cache agressivo para economizar rede
        const STALE_HOURS = 8;
        const now = Date.now();
        const state = get();
        const today = new Date().toISOString().split('T')[0];

        const isNewDay = state.lastFetchDate !== today;
        const cacheAge = state.lastFetchTodaysRoutes ? now - state.lastFetchTodaysRoutes : Infinity;

        const validCache = cacheAge < CACHE_MINUTES * 60 * 1000;
        const staleCache = cacheAge >= CACHE_MINUTES * 60 * 1000 && cacheAge < STALE_HOURS * 60 * 60 * 1000;

        // Se tem cache válido E dados na memória, sai fora pra economizar rede
        const hasData = state.clientesRota.length > 0;
        if (!forceRefresh && !isNewDay && validCache && hasData) {
            return;
        }

        const shouldShowLoading = forceRefresh || isNewDay || !staleCache;

        if (!useNetworkStore.getState().isOnline) {
            const hasData = state.clientesRota.length > 0 || state.rotasDeHoje.length > 0;
            if (hasData) {
                set({
                    isLoading: false,
                    loadingStep: null,
                    loadingProgress: null,
                    offlineModeHint: OFFLINE_CACHE_MESSAGE,
                    error: null,
                });
                return;
            }
            set({
                isLoading: false,
                loadingStep: null,
                loadingProgress: null,
                error: 'Sem conexão. Sincronize com a internet para baixar as entregas do dia.',
                offlineModeHint: null,
            });
            return;
        }

        if (shouldShowLoading) {
            // Mantém snapshot local até o novo payload chegar (offline / refresh)
            set({ isLoading: true, loadingStep: 'rotas', loadingProgress: null, error: null, offlineModeHint: null });
        } else {
            set({ error: null });
        }

        try {
            const cachedRotas = get().rotas;
            const todaysRoutes = await rotasService.getTodaysRoutes(vendedorId, cachedRotas);
            set({ rotasDeHoje: todaysRoutes, offlineModeHint: null });

            if (shouldShowLoading) {
                set({ loadingStep: 'clientes', loadingProgress: { current: 0, total: 1 } });
            }

            const rotaIds = todaysRoutes.map(r => r.id);
            const { flat: allClientes, porRota } = await rotasService.getClientesParaRotas(rotaIds);

            if (shouldShowLoading) {
                set({ loadingProgress: { current: 1, total: 1 } });
            }

            set({ 
                clientesRota: allClientes,
                deliveriesPorRota: { ...get().deliveriesPorRota, ...porRota },
                isLoading: false, 
                loadingStep: null, 
                loadingProgress: null, 
                lastFetchTodaysRoutes: Date.now(),
                lastFetchDate: today,
                offlineModeHint: null,
                error: null,
            });
        } catch (error: unknown) {
            if (isAbortError(error)) {
                set({ isLoading: false, loadingStep: null, loadingProgress: null });
                return;
            }
            const state = get();
            const hasCache =
                state.clientesRota.length > 0 || state.rotasDeHoje.length > 0;
            if (isNetworkError(error) && hasCache) {
                set({
                    isLoading: false,
                    loadingStep: null,
                    loadingProgress: null,
                    error: null,
                    offlineModeHint: OFFLINE_CACHE_MESSAGE,
                });
                return;
            }
            const message = error instanceof Error ? error.message : 'Erro ao carregar rotas do dia';
            set({ error: message, isLoading: false, loadingStep: null, loadingProgress: null });
        }
    },

    loadDeliveriesPorRotas: async (rotaIds: number[]) => {
        const state = get();
        if (!state.hasHydratedFromStorage) return;
        if (state.isLoadingDeliveries) return;

        const existing = state.deliveriesPorRota;
        const idsToLoad = rotaIds.filter(id => !existing[id]);
        if (idsToLoad.length === 0) return;

        if (!useNetworkStore.getState().isOnline) {
            set({
                isLoadingDeliveries: false,
                loadingStep: null,
                loadingProgress: null,
                offlineModeHint: OFFLINE_CACHE_MESSAGE,
            });
            return;
        }

        set({ isLoadingDeliveries: true, loadingStep: 'clientes', loadingProgress: { current: 0, total: 1 } });

        try {
            const { porRota } = await rotasService.getClientesParaRotas(idsToLoad);
            const accumulated = { ...existing, ...porRota };

            set({
                deliveriesPorRota: accumulated,
                isLoadingDeliveries: false,
                loadingStep: null,
                loadingProgress: null,
                offlineModeHint: null,
            });
        } catch (error: unknown) {
            if (isAbortError(error)) {
                set({ isLoadingDeliveries: false, loadingStep: null, loadingProgress: null });
                return;
            }
            console.error('Erro ao carregar deliveries por rota:', error);
            const hasPartial = Object.keys(existing).length > 0;
            set({
                isLoadingDeliveries: false,
                loadingStep: null,
                loadingProgress: null,
                ...(isNetworkError(error) && hasPartial
                    ? { offlineModeHint: OFFLINE_CACHE_MESSAGE, error: null }
                    : {}),
            });
        }
    },

    // Selecionar rota atual
    selectRota: (rotaId: number) => {
        const rota = get().rotas.find(r => r.id === rotaId);
        set({ rotaAtual: rota || null });
    },

    // Carregar clientes da rota
    loadClientesRota: async (rotaId: number) => {
        if (!get().hasHydratedFromStorage) return;

        const cached = get().deliveriesPorRota[rotaId];
        if (!useNetworkStore.getState().isOnline) {
            if (cached && cached.length > 0) {
                set({
                    clientesRota: cached,
                    isLoading: false,
                    offlineModeHint: OFFLINE_CACHE_MESSAGE,
                    error: null,
                });
                return;
            }
            set({
                isLoading: false,
                error: 'Sem conexão. Não há clientes salvos desta rota.',
                offlineModeHint: null,
            });
            return;
        }

        set({ isLoading: true, error: null });
        try {
            const clientes = await rotasService.getClientesPorRota(rotaId);
            set({ clientesRota: clientes, isLoading: false, offlineModeHint: null, error: null });
        } catch (error: unknown) {
            if (isAbortError(error)) {
                set({ isLoading: false });
                return;
            }
            if (isNetworkError(error) && cached && cached.length > 0) {
                set({
                    clientesRota: cached,
                    isLoading: false,
                    error: null,
                    offlineModeHint: OFFLINE_CACHE_MESSAGE,
                });
                return;
            }
            const message = error instanceof Error ? error.message : 'Erro ao carregar clientes';
            set({ error: message, isLoading: false });
        }
    },

    clearError: () => set({ error: null }),
        }),
        {
            name: 'soda-rotas-storage',
            storage: createJSONStorage(() => ({
                getItem: async (name: string) => (await idbGet(name)) ?? null,
                setItem: async (name: string, value: string) => await idbSet(name, value),
                removeItem: async (name: string) => await idbDel(name),
            })),
            partialize: (state) => ({
                rotas: state.rotas,
                rotasDeHoje: state.rotasDeHoje,
                clientesRota: state.clientesRota,
                deliveriesPorRota: state.deliveriesPorRota,
                lastFetchTodaysRoutes: state.lastFetchTodaysRoutes,
                lastFetchRotas: state.lastFetchRotas,
                lastFetchDate: state.lastFetchDate,
            }),
            skipHydration: true,
        }
    )
);
