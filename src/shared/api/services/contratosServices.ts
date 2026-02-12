import api from '../index';
import { ENDPOINTS } from '../endpoints';

/**
 * Interface mínima para Pendência de Contrato
 * Ref: GET /pendencia-contrato/{vendedorId}
 * 
 * IMPORTANTE: Esta estrutura precisa ser validada com teste real da API.
 * A documentação menciona "contratos enviados pelo app que foram rejeitados 
 * ou precisam de correção", mas não especifica campos exatos.
 */
export interface PendenciaContrato {
    id: number;
    cliente_nome?: string;
    motivo_rejeicao?: string;
    data_criacao?: string;
    tipo_contrato?: string;
    status?: string;
    // Adicionar mais campos após validação com API real
}

export const contratosApiService = {
    fetchPendenciasContrato: async (vendedorId: number): Promise<PendenciaContrato[]> => {
        const response = await api.get<PendenciaContrato[]>(ENDPOINTS.pendenciaContrato(vendedorId));
        return response.data || [];
    }
};
