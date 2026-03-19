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
     * Realiza check-in (simples ou completo dependendo do payload)
     * Utiliza o endpoint que aceita um objeto direto (não array)
     */
    postCheckIn: async (vendedorId: number, data: any): Promise<any> => {
        const response = await api.post(ENDPOINTS.checkin(vendedorId), data);
        return response.data;
    },
};
