import api from '../index';
import { ENDPOINTS } from '../endpoints';
import { MeioPagamento } from '../../../domain/pagamentos/models';

export const pagamentosApiService = {
    fetchMeiosPagamento: async (distribuidorId: number): Promise<MeioPagamento[]> => {
        const response = await api.get<MeioPagamento[]>(ENDPOINTS.meiosPagamento(distribuidorId));
        return response.data || [];
    },
};
