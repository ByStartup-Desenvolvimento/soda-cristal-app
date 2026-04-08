import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Rota, RotaEntregaCompleta } from './models';
import { rotasService } from './services';

interface RotasState {
    // Estado
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

    // Ações
    loadRotas: (vendedorId: number, forceRefresh?: boolean) => Promise<void>;
    loadTodaysRoutes: (vendedorId: number, forceRefresh?: boolean) => Promise<void>;
    loadDeliveriesPorRotas: (rotaIds: number[]) => Promise<void>;
    selectRota: (rotaId: number) => void;
    loadClientesRota: (rotaId: number) => Promise<void>;
    clearError: () => void;
}

export const useRotasStore = create<RotasState>()(
    persist(
        (set, get) => ({
    // Estado inicial
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

    // Carregar rotas do vendedor
    loadRotas: async (vendedorId: number, forceRefresh = false) => {
        const CACHE_MINUTES = 15;
        const STALE_HOURS = 8;
        const now = Date.now();
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        
        const isNewDay = state.lastFetchDate !== today;
        const cacheAge = state.lastFetchRotas ? now - state.lastFetchRotas : Infinity;

        const validCache = cacheAge < CACHE_MINUTES * 60 * 1000;
        const staleCache = cacheAge >= CACHE_MINUTES * 60 * 1000 && cacheAge < STALE_HOURS * 60 * 60 * 1000;

        // Se tem cache e ainda tá válido, e não forçamos recarregamento, sai fora pra economizar rede
        if (!forceRefresh && !isNewDay && validCache) {
            return;
        }

        const shouldShowLoading = forceRefresh || isNewDay || !staleCache;

        if (shouldShowLoading) {
            set({ isLoading: true, error: null });
        } else {
            set({ error: null });
        }
        
        try {
            const rotas = await rotasService.getRotasVendedor(vendedorId);
            set({ rotas, isLoading: false, lastFetchRotas: Date.now(), lastFetchDate: today });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro ao carregar rotas';
            set({ error: message, isLoading: false });
        }
    },

    // Carregar as rotas do dia de hoje e acumular todos os clientes
    loadTodaysRoutes: async (vendedorId: number, forceRefresh = false) => {
        const CACHE_MINUTES = 15;
        const STALE_HOURS = 8;
        const now = Date.now();
        const state = get();
        const today = new Date().toISOString().split('T')[0];

        const isNewDay = state.lastFetchDate !== today;
        const cacheAge = state.lastFetchTodaysRoutes ? now - state.lastFetchTodaysRoutes : Infinity;

        const validCache = cacheAge < CACHE_MINUTES * 60 * 1000;
        const staleCache = cacheAge >= CACHE_MINUTES * 60 * 1000 && cacheAge < STALE_HOURS * 60 * 60 * 1000;

        // Se tem cache e ainda tá válido, e não forçamos recarregamento, sai fora pra economizar rede
        if (!forceRefresh && !isNewDay && validCache) {
            // console.log(`[Cache Hit] Rotas de hoje já carregadas há menos de ${CACHE_MINUTES}min`);
            return;
        }

        const shouldShowLoading = forceRefresh || isNewDay || !staleCache;

        if (shouldShowLoading) {
            set({ isLoading: true, loadingStep: 'rotas', loadingProgress: null, error: null, clientesRota: [] });
        } else {
            set({ error: null });
        }

        try {
            const todaysRoutes = await rotasService.getTodaysRoutes(vendedorId);
            set({ rotasDeHoje: todaysRoutes });

            if (shouldShowLoading) {
                set({ loadingStep: 'clientes', loadingProgress: { current: 0, total: todaysRoutes.length } });
            }

            // Busca clientes usando batching para evitar rate limit (429)
            const BATCH_SIZE = 2;
            const DELAY_MS = 150;
            const results = [];
            
            for (let i = 0; i < todaysRoutes.length; i += BATCH_SIZE) {
                const batch = todaysRoutes.slice(i, i + BATCH_SIZE);
                const batchResults = await Promise.all(
                    batch.map(r => rotasService.getClientesPorRota(r.id))
                );
                results.push(...batchResults);
                
                if (shouldShowLoading) {
                    set({ loadingProgress: { current: Math.min(i + BATCH_SIZE, todaysRoutes.length), total: todaysRoutes.length } });
                }
                
                if (i + BATCH_SIZE < todaysRoutes.length) {
                    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
                }
            }

            // Achata e reordena por sequência
            const allClientes = results
                .flat()
                .sort((a, b) => a.rotaentrega.sequencia - b.rotaentrega.sequencia);

            set({ 
                clientesRota: allClientes, 
                isLoading: false, 
                loadingStep: null, 
                loadingProgress: null, 
                lastFetchTodaysRoutes: Date.now(),
                lastFetchDate: today 
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro ao carregar rotas do dia';
            set({ error: message, isLoading: false, loadingStep: null, loadingProgress: null });
        }
    },

    // Carregar deliveries de múltiplas rotas com batching sequencial (evita 429)
    loadDeliveriesPorRotas: async (rotaIds: number[]) => {
        const state = get();
        if (state.isLoadingDeliveries) return; // Evita dupla execução (React StrictMode)

        // Evita recarregar se já temos dados
        const existing = state.deliveriesPorRota;
        const idsToLoad = rotaIds.filter(id => !existing[id]);
        if (idsToLoad.length === 0) return;

        set({ isLoadingDeliveries: true, loadingStep: 'clientes', loadingProgress: { current: 0, total: idsToLoad.length } });

        const BATCH_SIZE = 2; 
        const DELAY_MS = 150;
        const accumulated: Record<number, RotaEntregaCompleta[]> = { ...existing };

        try {
            for (let i = 0; i < idsToLoad.length; i += BATCH_SIZE) {
                const batch = idsToLoad.slice(i, i + BATCH_SIZE);

                const results = await Promise.all(
                    batch.map(async (rotaId) => {
                        const clientes = await rotasService.getClientesPorRota(rotaId);
                        return { rotaId, clientes };
                    })
                );

                for (const { rotaId, clientes } of results) {
                    accumulated[rotaId] = clientes;
                }

                // Atualiza incrementalmente para a UI ir aparecendo
                set({ 
                    deliveriesPorRota: { ...accumulated },
                    loadingProgress: { current: Math.min(i + BATCH_SIZE, idsToLoad.length), total: idsToLoad.length }
                });

                // Aguarda antes do próximo batch (exceto no último)
                if (i + BATCH_SIZE < idsToLoad.length) {
                    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
                }
            }

            set({ isLoadingDeliveries: false, loadingStep: null, loadingProgress: null });
        } catch (error: unknown) {
            console.error('Erro ao carregar deliveries por rota:', error);
            set({ deliveriesPorRota: { ...accumulated }, isLoadingDeliveries: false, loadingStep: null, loadingProgress: null });
        }
    },

    // Selecionar rota atual
    selectRota: (rotaId: number) => {
        const rota = get().rotas.find(r => r.id === rotaId);
        set({ rotaAtual: rota || null });
    },

    // Carregar clientes da rota
    loadClientesRota: async (rotaId: number) => {
        set({ isLoading: true, error: null });
        try {
            const clientes = await rotasService.getClientesPorRota(rotaId);
            set({ clientesRota: clientes, isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro ao carregar clientes';
            set({ error: message, isLoading: false });
        }
    },

    clearError: () => set({ error: null }),
        }),
        {
            name: 'soda-rotas-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                rotas: state.rotas,
                rotasDeHoje: state.rotasDeHoje,
                lastFetchTodaysRoutes: state.lastFetchTodaysRoutes,
                lastFetchRotas: state.lastFetchRotas,
                lastFetchDate: state.lastFetchDate,
            }),
        }
    )
);
