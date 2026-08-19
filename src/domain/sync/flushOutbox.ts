import { toast } from 'sonner';
import { checkInApiService } from '../../shared/api/services/checkInServices';
import { isNetworkError } from '../../shared/api/networkUtils';
import type { OutboxItem } from './outboxTypes';
import { useOutboxStore } from './outboxStore';
import { vendasService } from '../vendas/services';
import type { Venda } from '../vendas/model';

let flushInFlight = false;

const MAX_ATTEMPTS = 8;

export function getRotaEntregaIdFromItem(item: OutboxItem): number | null {
    if (item.type === 'VENDA_XAROPE') return item.payload.rotaEntregaId;
    return item.payload.body.rota_entrega;
}

/**
 * Item descartado depois de esgotar as tentativas. Venda não pode sumir calada:
 * o vendedor precisa saber para relançar.
 */
function notificarDescarte(item: OutboxItem, message: string): void {
    console.error('[outbox] Descartado após várias falhas:', item.id, message);
    if (item.type === 'VENDA_XAROPE') {
        toast.error(
            `Uma venda de xarope não foi aceita pelo servidor e não será reenviada (${message}). Lance a venda novamente.`,
            { duration: 15000 },
        );
    }
}

async function sendItem(item: OutboxItem): Promise<void> {
    if (item.type === 'VENDA_XAROPE') {
        await vendasService.criarVendaXarope([item.payload.venda as Venda]);
        return;
    }
    const p = item.payload;
    await checkInApiService.postCheckInFull(p.vendedorId, [p.body]);
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
                    notificarDescarte(item, message);
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

/**
 * Envia mutações pendentes filtrando por `rota_entrega`.
 * Útil para o fluxo manual de "Enviar Check-in" por rotas selecionadas.
 */
export async function flushOutboxByRotaEntregaIds(rotaEntregaIds: number[]): Promise<number> {
    if (flushInFlight) return 0;
    if (rotaEntregaIds.length === 0) return 0;

    const allowedIds = new Set(rotaEntregaIds);
    let sentCount = 0;

    flushInFlight = true;
    try {
        while (true) {
            const candidate = [...useOutboxStore.getState().items]
                .sort((a, b) => a.createdAt - b.createdAt)
                .find((item) => {
                    const rotaEntregaId = getRotaEntregaIdFromItem(item);
                    return rotaEntregaId !== null && allowedIds.has(rotaEntregaId);
                });

            if (!candidate) break;

            try {
                await sendItem(candidate);
                useOutboxStore.getState().removeItem(candidate.id);
                sentCount += 1;
            } catch (error: unknown) {
                if (isNetworkError(error)) break;

                const message =
                    error instanceof Error ? error.message : 'Erro ao enviar mutação';
                const attempts = candidate.attempts + 1;
                if (attempts >= MAX_ATTEMPTS) {
                    useOutboxStore.getState().removeItem(candidate.id);
                    notificarDescarte(candidate, message);
                    break;
                }
                useOutboxStore.getState().patchItem(candidate.id, { attempts, lastError: message });
                break;
            }
        }
    } finally {
        flushInFlight = false;
    }

    return sentCount;
}
