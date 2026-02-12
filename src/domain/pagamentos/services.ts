import { pagamentosApiService } from '../../shared/api/services/pagamentosServices';
import { MeioPagamento } from './models';

export const pagamentosService = {
    getMeiosPagamento: async (distribuidorId: number): Promise<MeioPagamento[]> => {
        const pagamentos = await pagamentosApiService.fetchMeiosPagamento(distribuidorId);
        return Array.isArray(pagamentos) ? pagamentos : [];
    }
};
