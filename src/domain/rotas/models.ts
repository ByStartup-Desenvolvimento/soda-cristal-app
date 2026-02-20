// Modelo simplificado de Rota (GET /rotas/{vendedor_id})
export interface Rota {
    id: number;
    nome: string;
    frequencia: string;
    observacao: string;
    ativo: number;
    checkin_fechado: number;
    cidade_id: number;
}

// Modelo de Cliente (estrutura da API)
export interface Cliente {
    id: number;
    nome: string;
    cpf_cnpj: string;
    celular: string;
    celular2?: string;
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cep: string;
    observacao?: string;
    ativo: number;
    // Coordenadas para GPS
    latitude?: string;
    longitude?: string;
    // Perfil comercial
    revendedor_agua: boolean | string;
    revendedor_xarope: boolean | string;
    cf_agua: boolean;
    cf_xarope: boolean;
    precoespecial_agua: boolean;
    precoespecial_xarope: boolean;
}

// Modelo de RotaEntrega (relacionamento entre rota e cliente)
export interface RotaEntrega {
    id: number;
    sequencia: number;
    num_garrafas: number;
    num_garrafas_comprada: number;
    rota_id: number;
    cliente_id: number;
}

// Modelo combinado retornado pela API em /rotas-entregas
export interface RotaEntregaCompleta {
    rotaentrega: RotaEntrega;
    cliente: Cliente;
    rota: Rota;
    diassematendimento: string[];
    diassemconsumo: string[];
}

// Estatísticas da rota (calculadas no front)
export interface RotaStats {
    totalClientes: number;
    pendentes: number;
    concluidas: number;
    totalGarrafas: number;
}

// Prioridade do cliente (baseada em urgência)
export type PrioridadeCliente = 'urgente' | 'normal' | 'baixa';

// Status de entrega (para integração com deliveries)
export type StatusEntrega = 'pendente' | 'concluida' | 'falhou';

// Modelo para exibição em card (view model)
export interface ClienteCardView {
    id: number;
    sequencia: number;
    nome: string;
    rotaNome: string;
    horario: string;
    endereco: string;
    telefone: string;
    garrafas: number;
    observacao?: string;
    prioridade: PrioridadeCliente;
    status: StatusEntrega;
    latitude?: string;
    longitude?: string;
}

// Dias da semana para atendimento/consumo
export type DiaSemana = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';
