import { CheckInStatus } from '../deliveries/models';

export type MotivoDescarteLabel = 'Retorno' | 'Erro';

export interface CheckInRequest {
    rota_entrega: number;
    cliente_id: number;
    data_checkin: string; // dd/MM/yyyy HH:mm:ss
    vendedor: string;
    observacao: string;
    observacao_descart: string;
    dentro_raio: boolean;
    latitude: string;
    longitude: string;
    anotacoes: string;
    quantidade_garrafas: number;
    quantidade_vendida: number;
    teve_venda: boolean; // Usado internamente para decidir se envia 1 ou 0
    status?: CheckInStatus; 
    contas_receber?: {
        valor: string;
        parcelas: {
            recebido: boolean;
            valor: string;
            meio_pagamento_id: number;
        }[];
    };
}

export interface SimpleCheckInRequest {
    rota_entrega: number;
    data_checkin: string;
    vendedor: string;
    latitude: string;
    longitude: string;
    dentro_raio: boolean;
}
