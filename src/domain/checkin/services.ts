import { checkInApiService } from '../../shared/api/services/checkInServices';
import { useDeliveryStore } from '../deliveries/deliveryStore';
import { CheckInRequest, MotivoDescarteLabel } from './models';

export const checkInService = {
    /**
     * Realiza o check-in completo do atendimento
     */
    async realizarCheckIn(request: CheckInRequest): Promise<void> {
        try {
            // 1. Enviar para a API utilizando o endpoint unificado (objeto direto)
            await checkInApiService.postCheckIn(request.vendedor, {
                rota_entrega: request.rota_entrega,
                cliente_id: request.cliente_id,
                data_checkin: request.data_checkin,
                vendedor: request.vendedor,
                observacao: request.observacao,
                dentro_raio: request.dentro_raio,
                latitude: request.latitude,
                longitude: request.longitude,
                quantidade_garrafas: request.quantidade_garrafas,
                quantidade_vendida: request.quantidade_vendida,
                teve_venda: request.teve_venda ? 1 : 0
            });

            // 2. Atualizar o estado local (store)
            // Extraímos o status da observação ou mapeamos de volta se necessário
            // Por enquanto mantemos a lógica de UI baseada no que foi enviado
            useDeliveryStore.getState().updateDeliveryStatus(String(request.rota_entrega), {
                checkInStatus: request.status || (request.quantidade_vendida > 0 ? 'delivered' : 'no-sale'),
                hadSale: request.teve_venda,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Erro ao realizar check-in:', error);
            throw error;
        }
    },

    /**
     * Descarta um check-in realizado
     */
    async descartarCheckIn(vendedorId: number, rotaEntregaId: number, clienteId: number, motivo: MotivoDescarteLabel, data: string): Promise<void> {
        try {
            // Envia para a API com o campo observacao_descart preenchido
            await checkInApiService.postCheckIn(vendedorId, {
                rota_entrega: rotaEntregaId,
                cliente_id: clienteId,
                data_checkin: data,
                vendedor: vendedorId,
                observacao_descart: motivo,
                observacao: `Check-in descartado: ${motivo}`,
                dentro_raio: true
            });

            // Reseta o status na store local para permitir novo check-in
            useDeliveryStore.getState().resetDeliveryStatus(String(rotaEntregaId));

        } catch (error) {
            console.error('Erro ao descartar check-in:', error);
            throw error;
        }
    },

    /**
     * Realiza um check-in simples (apenas registro de presença)
     */
    async registrarPresenca(vendedorId: number, rotaEntregaId: number, clienteId: number, data: string, lat: number, lng: number): Promise<void> {
        try {
            await checkInApiService.postCheckIn(vendedorId, {
                rota_entrega: rotaEntregaId,
                cliente_id: clienteId,
                data_checkin: data,
                vendedor: vendedorId,
                latitude: lat,
                longitude: lng,
                dentro_raio: true,
                observacao: "Check-in inicial",
                observacao_descart: "",
                anotacoes: ""
            });
        } catch (error) {
            console.error('Erro ao registrar presença:', error);
            throw error;
        }
    }
};
