import { produtosApiService } from '../../shared/api/services/produtosServices';
import { Produto } from './models';

export const produtosService = {
    async getProdutos(vendedorId: number): Promise<Produto[]> {
        const produtos = await produtosApiService.fetchProdutos(vendedorId);
        if (!Array.isArray(produtos)) return [];
        // Filtrar apenas ativos
        return produtos.filter(p => p.ativo === 1);
    },

    /**
     * Converte preço string da API para número
     */
    parsePreco(preco: string): number {
        return parseFloat(preco);
    }
};
