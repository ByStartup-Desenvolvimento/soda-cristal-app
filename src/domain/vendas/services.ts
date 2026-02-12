import api from '../../shared/api';
import { ENDPOINTS } from '../../shared/api/endpoints';
import { Venda } from './model';

export const vendasService = {
    getVendasVendedor: async (vendedorId: number): Promise<Venda[]> => {
        const response = await api.get<Venda[]>(ENDPOINTS.vendasVendedor(vendedorId));
        return response.data;
    },

    getVendasPendentes: async (vendedorId: number): Promise<Venda[]> => {
        const response = await api.get<Venda[]>(ENDPOINTS.vendasPendentes(vendedorId));
        return response.data;
    },

    criarVendaXarope: async (vendas: Venda[]): Promise<void> => {
        await api.post(ENDPOINTS.vendaXaropeV2, { vendas });
    },

    criarPedidoXarope: async (vendas: Venda[]): Promise<void> => {
        await api.post(ENDPOINTS.pedidoXaropeV2, { vendas });
    },

    finalizarVenda: async (vendaId: number): Promise<void> => {
        await api.post(ENDPOINTS.finalizarVenda(vendaId));
    }
};
