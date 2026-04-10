import { checkInApiService } from '../../shared/api/services/checkInServices';
import { isNetworkError } from '../../shared/api/networkUtils';
import type { OutboxItem } from './outboxTypes';
import { isCheckInPresencaPayload } from './outboxTypes';
import { useOutboxStore } from './outboxStore';

let flushInFlight = false;

const MAX_ATTEMPTS = 8;

async function sendItem(item: OutboxItem): Promise<void> {
    if (item.type === 'CHECK_IN_PRESENCA') {
        const p = item.payload;
        if (!isCheckInPresencaPayload(p)) throw new Error('Payload inválido para CHECK_IN_PRESENCA');
        await checkInApiService.postCheckIn(p.vendedorId, {
            rota_entrega: p.rota_entrega,
            cliente_id: p.cliente_id,
            data_checkin: p.data_checkin,
            vendedor: p.vendedorId,
            latitude: p.latitude,
            longitude: p.longitude,
            dentro_raio: true,
            observacao: 'Check-in inicial',
            observacao_descart: '',
            anotacoes: '',
        });
        return;
    }

    const p = item.payload;
    if (isCheckInPresencaPayload(p)) throw new Error('Payload inválido para CHECK_IN_FULL');
    await checkInApiService.postCheckIn(p.vendedorId, p.body);
}

/**
 * Envia mutações pendentes em ordem (FIFO por `createdAt`).
 * Para em erro de rede (retry no próximo online/focus).
 */
export async function flushOutbox(): Promise<void> {
    if (flushInFlight) return;
    flushInFlight = true;
    try {
        // Reavalia a fila a cada item (estado pode mudar)
        while (useOutboxStore.getState().items.length > 0) {
            const sorted = [...useOutboxStore.getState().items].sort((a, b) => a.createdAt - b.createdAt);
            const item = sorted[0];
            if (!item) break;

            try {
                await sendItem(item);
                useOutboxStore.getState().removeItem(item.id);
            } catch (error: unknown) {
                if (isNetworkError(error)) break;

                const message =
                    error instanceof Error ? error.message : 'Erro ao enviar mutação';
                const attempts = item.attempts + 1;
                if (attempts >= MAX_ATTEMPTS) {
                    useOutboxStore.getState().removeItem(item.id);
                    console.error('[outbox] Descartado após várias falhas:', item.id, message);
                    break;
                }
                useOutboxStore.getState().patchItem(item.id, { attempts, lastError: message });
                break;
            }
        }
    } finally {
        flushInFlight = false;
    }
}
