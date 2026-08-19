import api from '../../shared/api';
import { ENDPOINTS } from '../../shared/api/endpoints';
import { Venda, VendaVendedor } from './model';
import { isNetworkError } from '../../shared/api/networkUtils';
import { useOutboxStore } from '../sync/outboxStore';

/** Venda que chegou ao servidor e foi recusada por ele (não é falha de rede). */
export class VendaXaropeRecusadaError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'VendaXaropeRecusadaError';
    }
}

/**
 * O endpoint `/vendaxarope/v2` responde SEMPRE HTTP 200, com o resultado real
 * dentro do corpo (`{ result: [{ success, message, vendaID }] }`). Sem checar o
 * corpo, uma venda recusada pelo servidor era exibida como "sucesso" ao vendedor
 * e sumia. Aqui a recusa vira erro de verdade.
 */
function assertVendaXaropeAceita(data: unknown): void {
    const result = (data as { result?: Array<{ success?: boolean; message?: string }> } | null)
        ?.result;
    if (!Array.isArray(result)) return; // formato inesperado: não bloqueia o fluxo
    const falha = result.find((r) => r?.success === false);
    if (falha) {
        throw new VendaXaropeRecusadaError(falha.message?.trim() || 'Venda recusada pelo servidor');
    }
}

export interface VendaXaropeEnvioResultado {
    /** Servidor confirmou o registro. */
    sent: boolean;
    /** Sem rede: ficou na fila para sincronizar depois. */
    queued: boolean;
    /** Chegou ao servidor e foi recusada (não será reenviada sozinha). */
    rejected: boolean;
    /** Motivo devolvido pelo servidor quando `rejected`. */
    message?: string;
}

export const vendasService = {
    getVendasVendedor: async (vendedorId: number): Promise<Venda[]> => {
        const response = await api.get<Venda[]>(ENDPOINTS.vendasVendedor(vendedorId));
        return response.data;
    },

    getVendasVendedorHistorico: async (vendedorId: number): Promise<VendaVendedor[]> => {
        const response = await api.get<VendaVendedor[]>(ENDPOINTS.vendasVendedor(vendedorId));
        return response.data;
    },

    getVendasPendentes: async (vendedorId: number): Promise<Venda[]> => {
        const response = await api.get<Venda[]>(ENDPOINTS.vendasPendentes(vendedorId));
        return response.data;
    },

    criarVendaXarope: async (vendas: Venda[]): Promise<void> => {
        const response = await api.post(ENDPOINTS.vendaXaropeV2, { vendas });
        assertVendaXaropeAceita(response.data);
    },

    /**
     * Envia a venda de xarope com fallback offline (mesmo padrão do check-in):
     * tenta postar; em erro de rede, enfileira no outbox para sincronizar quando
     * a conexão voltar. Evita a perda silenciosa da venda em rota sem sinal.
     *
     * Reenviar é seguro: o servidor tem UNIQUE (data_venda, vendedor_id) e a
     * `data_venda` é congelada no momento da venda — reenvio não duplica registro.
     *
     * Recusa do servidor NÃO interrompe o atendimento: volta `rejected` para a
     * tela avisar o vendedor sem travar o check-in da rota.
     */
    enviarVendaXarope: async (
        venda: Venda,
        vendedorId: number,
        rotaEntregaId: number | null
    ): Promise<VendaXaropeEnvioResultado> => {
        try {
            const response = await api.post(ENDPOINTS.vendaXaropeV2, { vendas: [venda] });
            assertVendaXaropeAceita(response.data);
            return { sent: true, queued: false, rejected: false };
        } catch (error: unknown) {
            if (isNetworkError(error)) {
                useOutboxStore.getState().enqueueVendaXarope({ vendedorId, rotaEntregaId, venda });
                return { sent: false, queued: true, rejected: false };
            }
            if (error instanceof VendaXaropeRecusadaError) {
                return { sent: false, queued: false, rejected: true, message: error.message };
            }
            throw error;
        }
    },

    criarPedidoXarope: async (vendas: Venda[]): Promise<void> => {
        await api.post(ENDPOINTS.pedidoXaropeV2, { vendas });
    },

    finalizarVenda: async (vendaId: number): Promise<void> => {
        await api.post(ENDPOINTS.finalizarVenda(vendaId));
    }
};
