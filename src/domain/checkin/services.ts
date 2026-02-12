import { checkInApiService } from '../../shared/api/services/checkInServices';
import { useDeliveryStore } from '../deliveries/deliveryStore';
import { CheckInRequest } from './models';

export const checkInService = {
    /**
     * Realiza o check-in completo do atendimento
     */
    async realizarCheckIn(request: CheckInRequest): Promise<void> {
        try {
            // 1. Enviar para a API
            await checkInApiService.postCheckInFull(request.vendedor, [
                {
                    rota_entrega: request.rota_entrega,
                    data_checkin: request.data_checkin,
                    vendedor: request.vendedor,
                    observacao: request.observacao,
                    dentro_raio: request.dentro_raio,
                    latitude: request.latitude,
                    longitude: request.longitude,
                    quantidade_garrafas: request.quantidade_garrafas,
                    quantidade_vendida: request.quantidade_vendida,
                    teve_venda: request.teve_venda ? 1 : 0
                }
            ]);

            // 2. Atualizar o estado local (store)
            // Extraímos o status da observação ou mapeamos de volta se necessário
            // Por enquanto mantemos a lógica de UI baseada no que foi enviado
            useDeliveryStore.getState().updateDeliveryStatus(`del-${request.rota_entrega}`, {
                checkInStatus: request.quantidade_vendida > 0 ? 'delivered' : 'no-sale',
                hadSale: request.teve_venda,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro ao realizar check-in:', error);
            throw error;
        }
    },

    /**
     * Realiza um check-in simples (apenas registro de presença)
     */
    async registrarPresenca(vendedorId: number, rotaEntregaId: number, data: string, lat: string, lng: string): Promise<void> {
        try {
            await checkInApiService.postCheckIn(vendedorId, {
                rota_entrega: rotaEntregaId,
                data_checkin: data,
                vendedor: vendedorId,
                latitude: lat,
                longitude: lng,
                dentro_raio: true
            } as any);
        } catch (error) {
            console.error('Erro ao registrar presença:', error);
            throw error;
        }
    }
};
