/** Tipos de mutação enfileirada para envio quando a rede voltar. */
export type OutboxMutationType = 'CHECK_IN_FULL';

/** Corpo do POST completo de check-in (finalização do atendimento). */

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

export interface OutboxItem {
    id: string;
    type: OutboxMutationType;
    payload: CheckInFullPayload;
    /** Para idempotência futura no backend; hoje espelha `id`. */
    clientRequestId: string;
    createdAt: number;
    attempts: number;
    lastError: string | null;
}
