import { clientesService } from '../../shared/api/services/clientesServices'
import { vendasService } from '../vendas/services'; // Importar serviço de vendas
import { Clientes, ClienteCadastroPayload, CadastroContratosPayload } from './model'
import { Venda } from '../vendas/model';

export const clientesServices = {
    async getClientesXarope(vendedorId?: number): Promise<Clientes[]> {
        // Busca Clientes e Vendas em Paralelo
        // Se não houver vendedorId (ex: modo distribuidor), não buscamos histórico de vendas para evitar erro 500
        const promises: [Promise<Clientes[]>, Promise<Venda[]>, Promise<Venda[]>] = [
            clientesService.getClientesXarope(),
            (vendedorId && vendedorId > 1)
                ? vendasService.getVendasVendedor(vendedorId).catch(() => [] as Venda[])
                : Promise.resolve([] as Venda[]),
            (vendedorId && vendedorId > 1)
                ? vendasService.getVendasPendentes(vendedorId).catch(() => [] as Venda[])
                : Promise.resolve([] as Venda[])
        ];

        const [clientes, vendasVendedor, vendasPendentes] = await Promise.all(promises);

        // Unifica todas as vendas para busca relacional
        const todasVendas = [...vendasVendedor, ...vendasPendentes];

        // Mapeia e injeta os dados MOCKADOS ou CALCULADOS para a UI
        return clientes
            .filter((cliente: Clientes) => cliente.ativo === 1 || cliente.ativo === 0)
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
                    produto_preferido: cliente.produto_preferido || (cliente.cf_agua ? 'Água com Gás 1,5 L' : 'Xarope de Cola'),
                };
            });
    },

    async cadastrarCliente(payload: ClienteCadastroPayload) {
        // Monta a estrutura complexa que a API exige
        const apiPayload: CadastroContratosPayload = {
            contratos: {
                novosContratos: [payload],
                alteracaoContrato: [],
                inativacoes: []
            }
        };

        return await clientesService.cadastrarCliente(apiPayload);
    },

    async alterarCliente(payload: ClienteCadastroPayload) {
        const apiPayload: CadastroContratosPayload = {
            contratos: {
                novosContratos: [],
                alteracaoContrato: [{ ...payload, tipo_cadastro: 2 }],
                inativacoes: []
            }
        };

        return await clientesService.cadastrarCliente(apiPayload);
    },

    async inativarCliente(payload: ClienteCadastroPayload) {
        const apiPayload: CadastroContratosPayload = {
            contratos: {
                novosContratos: [],
                alteracaoContrato: [],
                inativacoes: [{ ...payload, tipo_cadastro: 2 }] // Reutilizando a mesma lógica do original, a API deve diferenciar pelo array inativacoes
            }
        };

        return await clientesService.cadastrarCliente(apiPayload);
    }
}   