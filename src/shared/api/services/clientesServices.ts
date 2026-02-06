import api from '../index';
import { ENDPOINTS } from '../endpoints';
import type { Clientes } from '../../../domain/clientes/model'; // Seu modelo

export const clientesService = {
    getClientesXarope: async (vendedorId: number): Promise<Clientes[]> => {
        const response = await api.get<Clientes[]>(ENDPOINTS.clientesXarope(vendedorId));
        return response.data;
    }
};