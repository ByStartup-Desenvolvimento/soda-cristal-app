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
     * Suporta também ranges como "Seg a sexta" ou "Segunda a sábado"
     */
    async getTodaysRoutes(vendedorId: number): Promise<Rota[]> {
        const allRoutes = await this.getRotasVendedor(vendedorId);
        const dayIndex = new Date().getDay(); // 0 a 6 (Domingo a Sábado)
        const today = this.getTodayWeekday();

        return allRoutes.filter(r => {
            const freq = r.frequencia?.toLowerCase() || '';

            // Se for string de intervalo "Seg a Sexta" ou similar (1 a 5)
            // ex: "Seg a sexta", "Segunda a Sexta-feira", etc.
            if (freq.includes('seg') && freq.includes('a') && (freq.includes('sex') || freq.includes('sexta'))) {
                // Se hoje é segunda(1), terça(2), quarta(3), quinta(4) ou sexta(5)
                if (dayIndex >= 1 && dayIndex <= 5) {
                    return true;
                }
            }

            // Se for string de intervalo "Segunda a Sábado" (1 a 6)
            if (freq.includes('seg') && freq.includes('a') && (freq.includes('sab') || freq.includes('sáb') || freq.includes('sábado'))) {
                // Se hoje é segunda(1) a sábado(6)
                if (dayIndex >= 1 && dayIndex <= 6) {
                    return true;
                }
            }

            // Fallback: suporta nomes completos ("Sexta-Feira") e curtos ("Sexta")
            // Ex: "Terça e Sexta", "Quarta-Feira", "Segunda, Quarta e Sexta-Feira"
            const todayLower = today.toLowerCase();
            const todayShort = todayLower.split('-')[0];
            return freq.includes(todayLower) || freq.includes(todayShort);
        });
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
        return clientes.filter(c => String(c.diassematendimento).includes(dia));
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
