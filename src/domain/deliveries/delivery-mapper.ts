import { RotaEntregaCompleta, PrioridadeCliente } from '../rotas/models';
import { Delivery } from './models';
import { rotasService } from '../rotas/services';
import { formatApiDate } from '@/shared/utils/formatters';

export const mapPrioridade = (prioridade: PrioridadeCliente): 'high' | 'medium' | 'low' => {
  switch (prioridade) {
    case 'urgente': return 'high';
    case 'normal': return 'medium';
    case 'baixa': return 'low';
    default: return 'medium';
  }
};

export const mapClienteToDelivery = (item: RotaEntregaCompleta): Delivery => {
  return {
    id: item.rotaentrega.id.toString(),
    clienteId: item.cliente.id,
    orderId: `PED-${item.rotaentrega.id}`,
    orderCode: `SCT-${item.cliente.id}`,
    customerName: item.cliente.nome,
    customerPhone: item.cliente.celular || item.cliente.celular2 || '',
    address: `${item.cliente.rua}, ${item.cliente.numero} - ${item.cliente.bairro}`,
    bottles: {
      quantity: item.rotaentrega.num_garrafas || 0,
      size: '1,5 L'
    },
    status: 'pending',
    priority: mapPrioridade(rotasService.calcularPrioridade(item)),
    estimatedTime: formatApiDate(new Date()),
    routeName: item.rota.nome,
    notes: item.cliente.observacao || '',
    latitude: item.cliente.latitude,
    longitude: item.cliente.longitude,
    diasSemAtendimento: Number(item.diassematendimento) || 0,
    diasSemConsumo: Number(item.diassemconsumo) || 0,
  };
};
