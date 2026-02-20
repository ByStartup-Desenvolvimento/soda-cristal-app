import { create } from 'zustand';
import type { Rota, RotaEntregaCompleta } from './models';
import { rotasService } from './services';

interface RotasState {
    // Estado
    rotas: Rota[];
    rotasDeHoje: Rota[];
    rotaAtual: Rota | null;
    clientesRota: RotaEntregaCompleta[];
    isLoading: boolean;
    error: string | null;

    // Ações
    loadRotas: (vendedorId: number) => Promise<void>;
    loadTodaysRoutes: (vendedorId: number) => Promise<void>;
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
    isLoading: false,
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
