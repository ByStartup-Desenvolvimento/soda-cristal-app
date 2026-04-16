import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import type { Rota, RotaEntregaCompleta } from './models';
import { rotasService } from './services';
import { isAbortError } from '../../shared/api/networkUtils';
import { useNetworkStore } from '../../shared/store/networkStore';

export const OFFLINE_CACHE_MESSAGE = 'Sem conexão — exibindo dados salvos';

/**
 * Deriva clientesRota a partir dos dados persistidos (deliveriesPorRota + rotasDeHoje).
 * Chamado após rehydration do IDB para reconstruir o estado sem duplicar no storage.
 */
export function deriveClientesRota(): void {
    const state = useRotasStore.getState();
    if (state.clientesRota.length > 0) return;
    const hasDeliveries = Object.keys(state.deliveriesPorRota).length > 0;
    if (state.rotasDeHoje.length === 0 || !hasDeliveries) return;

    const derived = state.rotasDeHoje
        .flatMap(r => state.deliveriesPorRota[r.id] ?? [])
        .sort((a, b) => a.rotaentrega.sequencia - b.rotaentrega.sequencia);
    useRotasStore.setState({ clientesRota: derived });
}

/**
 * Storage com debounce para evitar OOM durante sync.
 * Writes rápidos são coalescidos — apenas o último é persistido.
 * `flushRotasStorage` força a escrita imediata (chamar ao final de cada sync).
 */
let _pendingValue: string | null = null;
let _pendingName: string | null = null;
let _debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 2_000;

function schedulePersist() {
    if (_debounceTimer) clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => {
        if (_pendingName !== null && _pendingValue !== null) {
            void idbSet(_pendingName, _pendingValue);
            _pendingValue = null;
        }
    }, DEBOUNCE_MS);
}

export async function flushRotasStorage(): Promise<void> {
    if (_debounceTimer) clearTimeout(_debounceTimer);
    if (_pendingName !== null && _pendingValue !== null) {
        await idbSet(_pendingName, _pendingValue);
        _pendingValue = null;
    }
}

const debouncedStorage = {
    getItem: async (name: string) => (await idbGet(name)) ?? null,
    setItem: async (name: string, value: string) => {
        _pendingName = name;
        _pendingValue = value;
        schedulePersist();
    },
    removeItem: async (name: string) => {
        if (_debounceTimer) clearTimeout(_debounceTimer);
        _pendingValue = null;
        _pendingName = null;
        await idbDel(name);
    },
};

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
    searchTermByRoute: Record<string, string>;
    setSearchTerm: (routeId: string, term: string) => void;
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
    searchTermByRoute: {},
    setSearchTerm: (routeId: string, term: string) =>
        set((state) => ({
            searchTermByRoute: { ...state.searchTermByRoute, [routeId]: term },
        })),

    setHasHydratedFromStorage: (value: boolean) => set({ hasHydratedFromStorage: value }),

    clearOfflineModeHint: () => set({ offlineModeHint: null }),

    loadRotas: async (vendedorId: number, forceRefresh = false) => {
        if (!get().hasHydratedFromStorage) return;

        const state = get();
        const isOnline = useNetworkStore.getState().isOnline;

        if (!isOnline) {
            if (state.rotas.length > 0) {
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

        const CACHE_MINUTES = 480;
        const STALE_HOURS = 8;
        const now = Date.now();
        const today = new Date().toISOString().split('T')[0];

        const isNewDay = state.lastFetchDate !== today;
        const cacheAge = state.lastFetchRotas ? now - state.lastFetchRotas : Infinity;

        const validCache = cacheAge < CACHE_MINUTES * 60 * 1000;
        const staleCache = cacheAge >= CACHE_MINUTES * 60 * 1000 && cacheAge < STALE_HOURS * 60 * 60 * 1000;

        const hasData = state.rotas.length > 0;
        if (!forceRefresh && !isNewDay && validCache && hasData) {
            if (state.offlineModeHint) set({ offlineModeHint: null });
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
            await flushRotasStorage();
        } catch (error: unknown) {
            if (isAbortError(error)) {
                set({ isLoading: false });
                return;
            }
            const current = get();
            if (current.rotas.length > 0) {
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

    loadTodaysRoutes: async (vendedorId: number, forceRefresh = false) => {
        if (!get().hasHydratedFromStorage) return;

        const CACHE_MINUTES = 480;
        const STALE_HOURS = 8;
        const now = Date.now();
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        const isOnline = useNetworkStore.getState().isOnline;

        const isNewDay = state.lastFetchDate !== today;
        const cacheAge = state.lastFetchTodaysRoutes ? now - state.lastFetchTodaysRoutes : Infinity;

        const validCache = cacheAge < CACHE_MINUTES * 60 * 1000;
        const staleCache = cacheAge >= CACHE_MINUTES * 60 * 1000 && cacheAge < STALE_HOURS * 60 * 60 * 1000;

        const hasData = state.clientesRota.length > 0;
        if (!forceRefresh && !isNewDay && validCache && hasData) {
            if (state.offlineModeHint) set({ offlineModeHint: null });
            return;
        }

        if (!isOnline) {
            const hasCachedData = state.clientesRota.length > 0 || state.rotasDeHoje.length > 0;
            if (hasCachedData) {
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

        const shouldShowLoading = forceRefresh || isNewDay || !staleCache;

        if (shouldShowLoading) {
            set({ isLoading: true, loadingStep: 'rotas', loadingProgress: null, error: null, offlineModeHint: null });
        } else {
            set({ error: null });
        }

        try {
            const cachedRotas = get().rotas;
            const todaysRoutes = await rotasService.getTodaysRoutes(vendedorId, cachedRotas);

            const rotaIds = todaysRoutes.map(r => r.id);

            if (shouldShowLoading) {
                set({ loadingStep: 'clientes', loadingProgress: { current: 0, total: rotaIds.length } });
            }

            const progressInterval = Math.max(1, Math.floor(rotaIds.length / 10));
            const { flat: allClientes, porRota } = await rotasService.getClientesParaRotas(rotaIds, {
                concurrency: 3,
                onProgress: (current, total) => {
                    if (shouldShowLoading && (current % progressInterval === 0 || current === total)) {
                        set({ loadingProgress: { current, total } });
                    }
                },
            });

            set({
                rotasDeHoje: todaysRoutes,
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
            await flushRotasStorage();
        } catch (error: unknown) {
            if (isAbortError(error)) {
                set({ isLoading: false, loadingStep: null, loadingProgress: null });
                return;
            }
            const current = get();
            const hasCache =
                current.clientesRota.length > 0 || current.rotasDeHoje.length > 0;
            if (hasCache) {
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

        const alreadyLoaded = rotaIds.length - idsToLoad.length;
        set({ isLoadingDeliveries: true, loadingStep: 'clientes', loadingProgress: { current: alreadyLoaded, total: rotaIds.length } });

        try {
            const progressInterval = Math.max(1, Math.floor(idsToLoad.length / 10));
            const { porRota } = await rotasService.getClientesParaRotas(idsToLoad, {
                concurrency: 3,
                onProgress: (current) => {
                    if (current % progressInterval === 0 || current === idsToLoad.length) {
                        set({ loadingProgress: { current: alreadyLoaded + current, total: rotaIds.length } });
                    }
                },
            });

            set({
                deliveriesPorRota: { ...get().deliveriesPorRota, ...porRota },
                isLoadingDeliveries: false,
                loadingStep: null,
                loadingProgress: null,
                offlineModeHint: null,
            });
            await flushRotasStorage();
        } catch (error: unknown) {
            if (isAbortError(error)) {
                set({ isLoadingDeliveries: false, loadingStep: null, loadingProgress: null });
                return;
            }
            console.error('Erro ao carregar deliveries por rota:', error);
            const currentExisting = get().deliveriesPorRota;
            set({
                isLoadingDeliveries: false,
                loadingStep: null,
                loadingProgress: null,
                ...(Object.keys(currentExisting).length > 0
                    ? { offlineModeHint: OFFLINE_CACHE_MESSAGE, error: null }
                    : {}),
            });
            await flushRotasStorage();
        }
    },

    // Selecionar rota atual
    selectRota: (rotaId: number) => {
        const rota = get().rotas.find(r => r.id === rotaId);
        set({ rotaAtual: rota || null });
    },

    loadClientesRota: async (rotaId: number) => {
        if (!get().hasHydratedFromStorage) return;

        const cached = get().deliveriesPorRota[rotaId];
        if (!useNetworkStore.getState().isOnline) {
            if (cached && cached.length > 0) {
                set({ isLoading: false, offlineModeHint: OFFLINE_CACHE_MESSAGE, error: null });
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
            set({
                deliveriesPorRota: { ...get().deliveriesPorRota, [rotaId]: clientes },
                isLoading: false,
                offlineModeHint: null,
                error: null,
            });
        } catch (error: unknown) {
            if (isAbortError(error)) {
                set({ isLoading: false });
                return;
            }
            if (cached && cached.length > 0) {
                set({ isLoading: false, error: null, offlineModeHint: OFFLINE_CACHE_MESSAGE });
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
            storage: createJSONStorage(() => debouncedStorage),
            partialize: (state) => ({
                rotas: state.rotas,
                rotasDeHoje: state.rotasDeHoje,
                deliveriesPorRota: state.deliveriesPorRota,
                lastFetchTodaysRoutes: state.lastFetchTodaysRoutes,
                lastFetchRotas: state.lastFetchRotas,
                lastFetchDate: state.lastFetchDate,
            }),
            skipHydration: true,
        }
    )
);
