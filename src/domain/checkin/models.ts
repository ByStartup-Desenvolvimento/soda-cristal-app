
export interface CheckInRequest {
    rota_entrega: number;
    data_checkin: string; // dd/MM/yyyy HH:mm:ss
    vendedor: number;
    observacao: string;
    dentro_raio: boolean;
    latitude: string;
    longitude: string;
    quantidade_garrafas: number;
    quantidade_vendida: number;
    teve_venda: boolean; // Usado internamente para decidir se envia 1 ou 0
}

export interface SimpleCheckInRequest {
    rota_entrega: number;
    data_checkin: string;
    vendedor: number;
    latitude: string;
    longitude: string;
    dentro_raio: boolean;
}
