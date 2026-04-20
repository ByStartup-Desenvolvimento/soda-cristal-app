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
     * Filtra rotas pelo dia de hoje (função pura, sem fetch).
     * Suporta frequências compostas e ranges.
     */
    filterByToday(rotas: Rota[]): Rota[] {
        const dayIndex = new Date().getDay();
        const today = this.getTodayWeekday();

        return rotas.filter(r => {
            const freq = r.frequencia?.toLowerCase() || '';

            if (freq.includes('seg') && freq.includes('a') && (freq.includes('sex') || freq.includes('sexta'))) {
                if (dayIndex >= 1 && dayIndex <= 5) return true;
            }

            if (freq.includes('seg') && freq.includes('a') && (freq.includes('sab') || freq.includes('sáb') || freq.includes('sábado'))) {
                if (dayIndex >= 1 && dayIndex <= 6) return true;
            }

            const todayLower = today.toLowerCase();
            const todayShort = todayLower.split('-')[0];
            return freq.includes(todayLower) || freq.includes(todayShort);
        });
    },

    /**
     * Busca as rotas do dia. Se já houver rotas em memória, filtra localmente
     * (zero requests). Caso contrário, faz fetch e filtra.
     */
    async getTodaysRoutes(vendedorId: number, cachedRotas?: Rota[]): Promise<Rota[]> {
        const allRoutes = cachedRotas && cachedRotas.length > 0
            ? cachedRotas
            : await this.getRotasVendedor(vendedorId);

        return this.filterByToday(allRoutes);
    },

    /**
     * Busca clientes de múltiplas rotas em paralelo com limite de concorrência.
     * Dispara callback `onRotaLoaded` a cada rota concluída para renderização progressiva.
     */
    async getClientesParaRotas(
        rotaIds: number[],
        options?: {
            concurrency?: number;
            onProgress?: (current: number, total: number) => void;
            onRotaLoaded?: (rotaId: number, clientes: RotaEntregaCompleta[]) => void;
        },
    ): Promise<{
        flat: RotaEntregaCompleta[];
        porRota: Record<number, RotaEntregaCompleta[]>;
    }> {
        const { concurrency = 3, onProgress, onRotaLoaded } = options ?? {};
        const porRota: Record<number, RotaEntregaCompleta[]> = {};
        const total = rotaIds.length;
        let completed = 0;

        const loadRota = async (rotaId: number) => {
            try {
                const clientesBrutos = await rotasApiService.fetchRotasEntregasPorRota(rotaId);
                const clientes = clientesBrutos.filter(c => c.cliente.ativo === 1);
                const sorted = clientes.sort(
                    (a, b) => a.rotaentrega.sequencia - b.rotaentrega.sequencia
                );
                porRota[rotaId] = sorted;
            } catch (err) {
                console.error(`[sync] Falha ao carregar rota ${rotaId}:`, err);
            } finally {
                completed++;
                onRotaLoaded?.(rotaId, porRota[rotaId] ?? []);
                onProgress?.(completed, total);
            }
        };

        const executing: Promise<void>[] = [];
        for (const rotaId of rotaIds) {
            const p = loadRota(rotaId).then(() => {
                executing.splice(executing.indexOf(p), 1);
            });
            executing.push(p);
            if (executing.length >= concurrency) {
                await Promise.race(executing);
            }
        }
        await Promise.all(executing);

        const flat = Object.values(porRota)
            .flat()
            .sort((a, b) => a.rotaentrega.sequencia - b.rotaentrega.sequencia);

        return { flat, porRota };
    },

    /**
     * Busca clientes de uma rota específica (chamada individual, usada sob demanda)
     */
    async getClientesPorRota(rotaId: number): Promise<RotaEntregaCompleta[]> {
        const clientesBrutos = await rotasApiService.fetchRotasEntregasPorRota(rotaId);
        const clientesAtivos = clientesBrutos.filter(c => c.cliente.ativo === 1);
        return clientesAtivos.sort((a, b) => a.rotaentrega.sequencia - b.rotaentrega.sequencia);
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
