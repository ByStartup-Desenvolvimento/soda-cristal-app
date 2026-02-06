import { Clientes } from './model';
import { clientesServices } from './services';
import { create } from 'zustand';

interface ClientesState {
    clientes: Clientes[];
    isLoading: boolean;
    error: string | null;
    filteredClientes: Clientes[];
    filtraClientes: (termo: string) => void;

    loadClientes: (vendedorId: number) => Promise<void>;
    clearError: () => void;
}

export const useClientesStore = create<ClientesState>((set, get) => ({
    clientes: [],
    filteredClientes: [],
    isLoading: false,
    error: null,

    loadClientes: async (vendedorId: number) => {
        set({ isLoading: true, error: null });
        try {
            const clientes = await clientesServices.getClientesXarope(vendedorId);
            set({ clientes, filteredClientes: clientes, isLoading: false });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro ao carregar clientes';
            set({ error: message, isLoading: false });
        }
    },

    clearError: () => set({ error: null }),

    // Filtrar Clientes
    filtraClientes: (termo: string) => {
        const { clientes } = get();
        const termoLower = termo.toLowerCase();

        const filtrados = clientes.filter(cliente => {
            return (
                cliente.nome?.toLowerCase().includes(termoLower) ||
                cliente.razaosocial?.toLowerCase().includes(termoLower) ||
                cliente.fone?.toString().includes(termoLower) ||
                cliente.celular2?.toString().includes(termoLower) ||
                cliente.rua?.toLowerCase().includes(termoLower) ||
                cliente.bairro?.toLowerCase().includes(termoLower)
            );
        });

        set({ filteredClientes: filtrados });
    },
}));
