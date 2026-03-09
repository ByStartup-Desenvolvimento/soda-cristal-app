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

    // Ações
    loadRotas: (vendedorId: number) => Promise<void>;
    loadTodaysRoutes: (vendedorId: number) => Promise<void>;
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


    // Carregar rotas do vendedor
    loadRotas: async (vendedorId: number) => {
        set({ isLoading: true, error: null });
        try {
            const rotas = await rotasService.getRotasVendedor(vendedorId);
            set({ rotas, isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro ao carregar rotas';
            set({ error: message, isLoading: false });
        }
    },

    // Carregar as rotas do dia de hoje e acumular todos os clientes
    loadTodaysRoutes: async (vendedorId: number) => {
        set({ isLoading: true, error: null, clientesRota: [] });
        try {
            const todaysRoutes = await rotasService.getTodaysRoutes(vendedorId);
            set({ rotasDeHoje: todaysRoutes });

            // Busca clientes de todas as rotas do dia em paralelo
            const results = await Promise.all(
                todaysRoutes.map(r => rotasService.getClientesPorRota(r.id))
            );

            // Achata e reordena por sequência
            const allClientes = results
                .flat()
                .sort((a, b) => a.rotaentrega.sequencia - b.rotaentrega.sequencia);

            set({ clientesRota: allClientes, isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro ao carregar rotas do dia';
            set({ error: message, isLoading: false });
        }
    },

    // Carregar deliveries de múltiplas rotas com batching sequencial (evita 429)
    loadDeliveriesPorRotas: async (rotaIds: number[]) => {
        // Evita recarregar se já temos dados
        const existing = get().deliveriesPorRota;
        const idsToLoad = rotaIds.filter(id => !existing[id]);
        if (idsToLoad.length === 0) return;

        set({ isLoadingDeliveries: true });

        const BATCH_SIZE = 2;
        const DELAY_MS = 400;
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
