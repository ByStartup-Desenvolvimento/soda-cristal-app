import api from '../index';
import { ENDPOINTS } from '../endpoints';
import { Promocao } from '../../../domain/promocoes/models';

export const promocoesApiService = {
  fetchPromocoes: async (vendedorId: number): Promise<Promocao[]> => {
    const response = await api.get<Promocao[]>(ENDPOINTS.promocoes(vendedorId));
    return response.data || [];
  },
};
