import { clientesService } from '../../shared/api/services/clientesServices'
import { vendasService } from '../vendas/services'; // Importar serviço de vendas
import { Clientes } from './model'
import { Venda } from '../vendas/model';

export const clientesServices = {
    async getClientesXarope(vendedorId: number): Promise<Clientes[]> {
        // Busca Clientes e Vendas em Paralelo
        const [clientes, vendasVendedor, vendasPendentes] = await Promise.all([
            clientesService.getClientesXarope(vendedorId),
            vendasService.getVendasVendedor(vendedorId).catch(() => [] as Venda[]), // Fallback para array vazio em caso de erro
            vendasService.getVendasPendentes(vendedorId).catch(() => [] as Venda[])
        ]);

        // Unifica todas as vendas para busca relacional
        const todasVendas = [...vendasVendedor, ...vendasPendentes];

        // Mapeia e injeta os dados MOCKADOS ou CALCULADOS para a UI
        return clientes
            .filter((cliente: Clientes) => cliente.ativo === 1)
            .map(cliente => {
                // Lógica de Data de Entrega
                let ultimaEntrega = cliente.ultima_entrega;

                if (!ultimaEntrega) {
                    // Tenta achar a venda mais recente deste cliente
                    // Ordena descrescente por data (assumindo que string ISO permite sort direto ou via Date)
                    const vendasCliente = todasVendas
                        .filter(v => v.cliente_id === cliente.id)
                        .sort((a, b) => new Date(b.data_venda).getTime() - new Date(a.data_venda).getTime());

                    if (vendasCliente.length > 0) {
                        ultimaEntrega = vendasCliente[0].data_venda;
                    }
                }

                return {
                    ...cliente,
                    // Prioriza o que vem do BANCO (API) ou Calculado via Vendas
                    ultima_entrega: ultimaEntrega || 'Não temos ultima entrega',
                    proxima_entrega: cliente.proxima_entrega || 'Não temos proxima entrega',

                    tipo_contrato: cliente.tipo_contrato || (cliente.observacao?.includes('Semanal') ? 'Comodato Semanal' : 'Comodato Quinzenal'),
                    produto_preferido: cliente.produto_preferido || (cliente.cf_agua ? 'Água com Gás 20L' : 'Xarope de Cola'),
                };
            });
    }
}   