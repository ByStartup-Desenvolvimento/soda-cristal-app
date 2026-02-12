import api from '../index';
import { ENDPOINTS } from '../endpoints';
import { Produto } from '../../../domain/produtos/models';

export const produtosApiService = {
    fetchProdutos: async (vendedorId: number): Promise<Produto[]> => {
        const response = await api.get<Produto[]>(ENDPOINTS.produtos(vendedorId));
        return response.data || [];
    },
};
