import api from '../index';
import { ENDPOINTS } from '../endpoints';
import type { Clientes, CadastroContratosPayload } from '../../../domain/clientes/model'; // Seu modelo

export const clientesService = {
    getClientesXarope: async (vendedorId: number): Promise<Clientes[]> => {
        const response = await api.get<Clientes[]>(ENDPOINTS.clientesXarope(vendedorId));
        return response.data;
    },

    cadastrarCliente: async (payload: CadastroContratosPayload) => {
        const response = await api.post(ENDPOINTS.contratosV2CadastroClientes, payload);
        return response.data;
    }
};