import { checkInApiService } from '../../shared/api/services/checkInServices';
import { isNetworkError } from '../../shared/api/networkUtils';
import { useDeliveryStore } from '../deliveries/deliveryStore';
import { useOutboxStore } from '../sync/outboxStore';
import { CheckInRequest, MotivoDescarteLabel } from './models';

function applyLocalDeliveryStatusFromRequest(request: CheckInRequest): void {
    useDeliveryStore.getState().updateDeliveryStatus(String(request.rota_entrega), {
        checkInStatus: request.status || (request.quantidade_vendida > 0 ? 'delivered' : 'no-sale'),
        hadSale: request.teve_venda,
        timestamp: new Date().toISOString(),
    });
}

export interface CheckInSendResult {
    /** Enviado com sucesso à API nesta tentativa. */
    sent: boolean;
    /** Enfileirado para envio quando a rede voltar. */
    queued: boolean;
}

export const checkInService = {
    /**
     * Realiza o check-in completo do atendimento
     */
    async realizarCheckIn(request: CheckInRequest): Promise<CheckInSendResult> {
        const body: any = {
            rota_entrega: request.rota_entrega,
            data_checkin: request.data_checkin,
            vendedor: String(request.vendedor),
            observacao: request.observacao,
            observacao_descart: request.observacao_descart,
            dentro_raio: request.dentro_raio,
            latitude: String(request.latitude),
            longitude: String(request.longitude),
            anotacoes: request.anotacoes,
            quantidade_garrafas: request.quantidade_garrafas,
            quantidade_vendida: request.quantidade_vendida,
        };

        if (request.contas_receber) {
            body.contas_receber = request.contas_receber;
        }

        try {
            await checkInApiService.postCheckInFull(Number(request.vendedor), [body]);
            applyLocalDeliveryStatusFromRequest(request);
            return { sent: true, queued: false };
        } catch (error: unknown) {
            if (isNetworkError(error)) {
                useOutboxStore.getState().enqueueCheckInFull({
                    vendedorId: Number(request.vendedor),
                    body,
                });
                applyLocalDeliveryStatusFromRequest(request);
                return { sent: false, queued: true };
            }
            console.error('Erro ao realizar check-in:', error);
            throw error;
        }
    },

    /**
     * Descarta um check-in realizado
     */
    async descartarCheckIn(vendedorId: number, rotaEntregaId: number, _clienteId: number, motivo: MotivoDescarteLabel, data: string): Promise<void> {
        try {
            // Envia para a API com o campo observacao_descart preenchido
            await checkInApiService.postCheckIn(vendedorId, {
                rota_entrega: rotaEntregaId,
                data_checkin: data,
                vendedor: String(vendedorId),
                observacao_descart: motivo,
                observacao: `Check-in descartado: ${motivo}`,
                dentro_raio: true,
                latitude: '0',
                longitude: '0'
            });

            // Reseta o status na store local para permitir novo check-in
            useDeliveryStore.getState().resetDeliveryStatus(String(rotaEntregaId));

        } catch (error) {
            console.error('Erro ao descartar check-in:', error);
            throw error;
        }
    },
};
