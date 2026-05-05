
export type CheckInStatus = 'delivered' | 'no-sale' | 'absent-return' | 'absent-no-return';

export type TipoCliente = 'normal' | 'revendedor' | 'revendedor-especial';

export interface Delivery {
    id: string;
    clienteId: number;
    orderId: string;
    orderCode: string;
    customerName: string;
    customerPhone: string;
    address: string;
    bottles: {
        quantity: number;
        size: string;
    };
    status: 'pending' | 'completed' | 'failed';
    priority: 'high' | 'medium' | 'low';
    estimatedTime: string;
    completedAt?: string;
    routeName: string;
    notes?: string;
    latitude?: string;
    longitude?: string;
    diasSemAtendimento?: number;
    diasSemConsumo?: number;
    tipoCliente: TipoCliente;
}

export interface DeliveryStatusData {
    checkInStatus?: CheckInStatus;
    hadSale?: boolean;
    timestamp?: string;
    reposicaoQty?: number;
}
