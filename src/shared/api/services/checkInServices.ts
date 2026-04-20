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
     * POST /checkin/{vendedor_id}
     * Realiza check-in simples (presença/anulação) com objeto único.
     */
    postCheckIn: async (vendedorId: number, data: unknown): Promise<unknown> => {
        const response = await api.post(ENDPOINTS.checkin(vendedorId), data);
        return response.data;
    },

    /**
     * POST /checkin/full/{vendedor_id}
     * Realiza check-in completo de atendimento (payload em array).
     */
    postCheckInFull: async (vendedorId: number, data: unknown): Promise<unknown> => {
        const response = await api.post(ENDPOINTS.checkinFull(vendedorId), data);
        return response.data;
    },
};
