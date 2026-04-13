import api from '../index';
import { ENDPOINTS } from '../endpoints';
import type { Rota, RotaEntregaCompleta } from '../../../domain/rotas/models';

export const rotasApiService = {
    /**
     * GET /rotas/{vendedor_id}
     * Retorna lista simplificada de rotas do vendedor
     */
    fetchRotasVendedor: async (vendedorId: number): Promise<Rota[]> => {
        const response = await api.get<Rota[]>(ENDPOINTS.rotasVendedor(vendedorId));
        return response.data;
    },

    /**
     * GET /rotas-entregas
     * Retorna clientes de TODAS as rotas do vendedor em uma única chamada (bulk).
     */
    fetchRotasEntregasBulk: async (): Promise<RotaEntregaCompleta[]> => {
        const response = await api.get<RotaEntregaCompleta[]>(ENDPOINTS.ROTAS_ENTREGAS_BULK);
        return response.data;
    },

    /**
     * GET /rotas-entregas/rota/{rota_id}
     * Retorna clientes de uma rota específica (usada sob demanda para 1 rota).
     */
    fetchRotasEntregasPorRota: async (rotaId: number): Promise<RotaEntregaCompleta[]> => {
        const response = await api.get<RotaEntregaCompleta[]>(
            ENDPOINTS.rotasEntregasRota(rotaId)
        );
        return response.data;
    },
};
