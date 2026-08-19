/** Tipos de mutação enfileirada para envio quando a rede voltar. */
export type OutboxMutationType = 'CHECK_IN_FULL' | 'VENDA_XAROPE';

/** Corpo do POST completo de check-in (finalização do atendimento). */
export interface CheckInFullPayload {
    vendedorId: number;
    body: {
        rota_entrega: number;
        cliente_id: number;
        data_checkin: string;
        vendedor: number;
        observacao: string;
        dentro_raio: boolean;
        latitude: number;
        longitude: number;
        quantidade_garrafas: number;
        quantidade_vendida: number;
        teve_venda: number;
    };
}

/**
 * Venda de xarope (POST /vendaxarope/v2) enfileirada para envio offline.
 * Espelha o padrão do check-in: se cair a rede na hora da venda, a venda
 * fica na fila e é sincronizada quando a conexão voltar (nada de perder venda).
 */
export interface VendaXaropePayload {
    vendedorId: number;
    /** rota_entrega associada (para o flush por rota); null em PDV avulso. */
    rotaEntregaId: number | null;
    /** Objeto Venda enviado ao endpoint; genérico p/ evitar dependência circular de tipos. */
    venda: unknown;
}

interface OutboxItemBase {
    id: string;
    /** Para idempotência futura no backend; hoje espelha `id`. */
    clientRequestId: string;
    createdAt: number;
    attempts: number;
    lastError: string | null;
}

export interface CheckInFullOutboxItem extends OutboxItemBase {
    type: 'CHECK_IN_FULL';
    payload: CheckInFullPayload;
}

export interface VendaXaropeOutboxItem extends OutboxItemBase {
    type: 'VENDA_XAROPE';
    payload: VendaXaropePayload;
}

export type OutboxItem = CheckInFullOutboxItem | VendaXaropeOutboxItem;
