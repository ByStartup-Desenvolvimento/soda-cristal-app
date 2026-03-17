import { create } from 'zustand';
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

    // Ações
    loadRotas: (vendedorId: number, forceRefresh?: boolean) => Promise<void>;
    loadTodaysRoutes: (vendedorId: number, forceRefresh?: boolean) => Promise<void>;
    loadDeliveriesPorRotas: (rotaIds: number[]) => Promise<void>;
    selectRota: (rotaId: number) => void;
    loadClientesRota: (rotaId: number) => Promise<void>;
    clearError: () => void;
}

export const useRotasStore = create<RotasState>((set, get) => ({
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

    // Carregar rotas do vendedor
    loadRotas: async (vendedorId: number, forceRefresh = false) => {
        const CACHE_MINUTES = 5;
        const CACHE_MS = CACHE_MINUTES * 60 * 1000;
        const now = Date.now();
        const state = get();

        // Se tem cache e ainda tá válido, e não forçamos recarregamento, sai fora pra economizar rede
        if (!forceRefresh && state.lastFetchRotas && (now - state.lastFetchRotas < CACHE_MS)) {
            return;
        }

        set({ isLoading: true, error: null });
        try {
            const rotas = await rotasService.getRotasVendedor(vendedorId);
            set({ rotas, isLoading: false, lastFetchRotas: Date.now() });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro ao carregar rotas';
            set({ error: message, isLoading: false });
        }
    },

    // Carregar as rotas do dia de hoje e acumular todos os clientes
    loadTodaysRoutes: async (vendedorId: number, forceRefresh = false) => {
        const CACHE_MINUTES = 5;
        const CACHE_MS = CACHE_MINUTES * 60 * 1000;
        const now = Date.now();
        const state = get();

        // Se tem cache e ainda tá válido, e não forçamos recarregamento, sai fora pra economizar rede
        if (!forceRefresh && state.lastFetchTodaysRoutes && (now - state.lastFetchTodaysRoutes < CACHE_MS)) {
            // console.log(`[Cache Hit] Rotas de hoje já carregadas há menos de ${CACHE_MINUTES}min`);
            return;
        }

        set({ isLoading: true, error: null, clientesRota: [] });
        try {
            const todaysRoutes = await rotasService.getTodaysRoutes(vendedorId);
            set({ rotasDeHoje: todaysRoutes });

            // Busca clientes usando batching para evitar rate limit (429)
            const BATCH_SIZE = 1;
            const DELAY_MS = 300;
            const results = [];
            
            for (let i = 0; i < todaysRoutes.length; i += BATCH_SIZE) {
                const batch = todaysRoutes.slice(i, i + BATCH_SIZE);
                const batchResults = await Promise.all(
                    batch.map(r => rotasService.getClientesPorRota(r.id))
                );
                results.push(...batchResults);
                
                if (i + BATCH_SIZE < todaysRoutes.length) {
                    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
                }
            }

            // Achata e reordena por sequência
            const allClientes = results
                .flat()
                .sort((a, b) => a.rotaentrega.sequencia - b.rotaentrega.sequencia);

            set({ clientesRota: allClientes, isLoading: false, lastFetchTodaysRoutes: Date.now() });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro ao carregar rotas do dia';
            set({ error: message, isLoading: false });
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

        set({ isLoadingDeliveries: true });

        const BATCH_SIZE = 1; // Reduzido de 2 para 1 para garantir estabilidade
        const DELAY_MS = 300;
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
                set({ deliveriesPorRota: { ...accumulated } });

                // Aguarda antes do próximo batch (exceto no último)
                if (i + BATCH_SIZE < idsToLoad.length) {
                    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
                }
            }

            set({ isLoadingDeliveries: false });
        } catch (error: unknown) {
            console.error('Erro ao carregar deliveries por rota:', error);
            set({ deliveriesPorRota: { ...accumulated }, isLoadingDeliveries: false });
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
}));
