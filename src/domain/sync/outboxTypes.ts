/** Tipos de mutação enfileirada para envio quando a rede voltar. */
export type OutboxMutationType = 'CHECK_IN_PRESENCA' | 'CHECK_IN_FULL';

/** Payload do POST inicial de presença (check-in inicial). */
export interface CheckInPresencaPayload {
    vendedorId: number;
    rota_entrega: number;
    cliente_id: number;
    data_checkin: string;
    latitude: number;
    longitude: number;
}

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
    payload: CheckInPresencaPayload | CheckInFullPayload;
    /** Para idempotência futura no backend; hoje espelha `id`. */
    clientRequestId: string;
    createdAt: number;
    attempts: number;
    lastError: string | null;
}

export function isCheckInPresencaPayload(
    p: CheckInPresencaPayload | CheckInFullPayload
): p is CheckInPresencaPayload {
    return 'vendedorId' in p && !('body' in p);
}
