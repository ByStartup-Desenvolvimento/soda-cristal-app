import { rotasApiService } from '../../shared/api/services/rotasServices';
import type {
    Rota,
    RotaEntregaCompleta,
    ClienteCardView,
    RotaStats,
    PrioridadeCliente
} from './models';

export const rotasService = {
    /**
     * Retorna o nome do dia da semana atual em pt-BR (ex: "Sexta-Feira")
     */
    getTodayWeekday(): string {
        const days = [
            'Domingo',
            'Segunda-Feira',
            'Terça-Feira',
            'Quarta-Feira',
            'Quinta-Feira',
            'Sexta-Feira',
            'Sábado',
        ];
        return days[new Date().getDay()];
    },

    /**
     * Busca todas as rotas do vendedor logado
     */
    async getRotasVendedor(vendedorId: number): Promise<Rota[]> {
        const rotas = await rotasApiService.fetchRotasVendedor(vendedorId);
        // Filtrar apenas rotas ativas
        return rotas.filter(r => r.ativo === 1);
    },

    /**
     * Busca as rotas do vendedor que correspondem ao dia de hoje
     * Suporta frequências compostas como "Quarta-Feira e Sábado"
     */
    async getTodaysRoutes(vendedorId: number): Promise<Rota[]> {
        const allRoutes = await this.getRotasVendedor(vendedorId);
        const today = this.getTodayWeekday();
        return allRoutes.filter(r => r.frequencia.includes(today));
    },

    /**
     * Busca todos os clientes de todas as rotas (sincronização completa)
     */
    async getRotasEntregasCompletas(): Promise<RotaEntregaCompleta[]> {
        return await rotasApiService.fetchRotasEntregas();
    },

    /**
     * Busca clientes de uma rota específica
     */
    async getClientesPorRota(rotaId: number): Promise<RotaEntregaCompleta[]> {
        const clientes = await rotasApiService.fetchRotasEntregasPorRota(rotaId);
        // Ordenar por sequência
        return clientes.sort((a, b) => a.rotaentrega.sequencia - b.rotaentrega.sequencia);
    },

    /**
     * Filtra clientes por dia da semana de atendimento
     */
    filterClientesPorDia(
        clientes: RotaEntregaCompleta[],
        dia: string
    ): RotaEntregaCompleta[] {
        return clientes.filter(c => c.diassematendimento.includes(dia));
    },

    /**
     * Calcula estatísticas de uma rota
     */
    calcularEstatisticas(clientes: RotaEntregaCompleta[]): RotaStats {
        const concluidas = clientes.filter(_ => {
            // TODO: Integrar com deliveryStore para verificar status real
            return false; // Por enquanto, nenhuma concluída
        }).length;

        return {
            totalClientes: clientes.length,
            pendentes: clientes.length - concluidas,
            concluidas,
            totalGarrafas: clientes.reduce((sum, c) => sum + c.rotaentrega.num_garrafas, 0),
        };
    },

    /**
     * Determina prioridade do cliente baseado em regras de negócio
     */
    calcularPrioridade(cliente: RotaEntregaCompleta): PrioridadeCliente {
        // Lógica de prioridade (pode ser ajustada conforme regras de negócio)
        const garrafas = cliente.rotaentrega.num_garrafas;
        const observacao = cliente.cliente.observacao?.toLowerCase() || '';

        if (observacao.includes('urgente') || observacao.includes('prioridade')) {
            return 'urgente';
        }

        if (garrafas >= 10) {
            return 'normal';
        }

        return 'baixa';
    },

    /**
     * Transforma RotaEntregaCompleta em ClienteCardView para exibição
     */
    toClienteCardView(cliente: RotaEntregaCompleta): ClienteCardView {
        const { rotaentrega, cliente: clienteData, rota } = cliente;

        return {
            id: clienteData.id,
            sequencia: rotaentrega.sequencia,
            nome: clienteData.nome,
            rotaNome: rota.nome,
            horario: '09:00', // TODO: Calcular horário baseado em sequência ou dados da API
            endereco: `${clienteData.endereco}, ${clienteData.numero} - ${clienteData.bairro}`,
            telefone: clienteData.telefone,
            garrafas: rotaentrega.num_garrafas,
            observacao: clienteData.observacao,
            prioridade: this.calcularPrioridade(cliente),
            status: 'pendente', // TODO: Integrar com deliveryStore
            latitude: clienteData.latitude,
            longitude: clienteData.longitude,
        };
    },

    /**
     * Abre GPS com coordenadas do cliente
     */
    abrirGPS(latitude: string, longitude: string): void {
        // Google Maps URL scheme
        const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        window.open(url, '_blank');
    },
};
