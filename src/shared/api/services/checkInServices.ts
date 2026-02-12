import api from '../index';
import { ENDPOINTS } from '../endpoints';

export interface CheckInPayload {
    vendedor_id: number;
    cliente_id: number;
    latitude: string;
    longitude: string;
    status: string;
    observacao?: string;
}

export const checkInApiService = {
    /**
     * POST /checkin/full/{vendedor_id}
     * Realiza check-in completo com status e detalhes
     */
    postCheckInFull: async (vendedorId: number, data: any): Promise<any> => {
        const response = await api.post(ENDPOINTS.checkinFull(vendedorId), data);
        return response.data;
    },

    /**
     * POST /checkin/{vendedor_id}
     * Realiza check-in simples (apenas registro de presença/localização)
     */
    postCheckIn: async (vendedorId: number, data: { cliente_id: number; latitude: string; longitude: string }): Promise<any> => {
        const response = await api.post(ENDPOINTS.checkin(vendedorId), data);
        return response.data;
    },
};
