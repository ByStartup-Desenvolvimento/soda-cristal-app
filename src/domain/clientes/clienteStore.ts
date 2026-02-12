import { Clientes } from './model';
import { clientesServices } from './services';
import { create } from 'zustand';

interface ClientesState {
    clientes: Clientes[];
    isLoading: boolean;
    isSubmitting: boolean; // Novo estado para cadastro
    error: string | null;
    filteredClientes: Clientes[];
    filtraClientes: (termo: string) => void;

    loadClientes: (vendedorId: number) => Promise<void>;
    cadastrarCliente: (payload: import('./model').ClienteCadastroPayload) => Promise<boolean>; // Nova action
    clearError: () => void;
}

export const useClientesStore = create<ClientesState>((set, get) => ({
    clientes: [],
    filteredClientes: [],
    isLoading: false,
    isSubmitting: false,
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

    cadastrarCliente: async (payload) => {
        set({ isSubmitting: true, error: null });
        try {
            await clientesServices.cadastrarCliente(payload);
            set({ isSubmitting: false });
            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro ao cadastrar cliente';
            set({ error: message, isSubmitting: false });
            return false;
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
