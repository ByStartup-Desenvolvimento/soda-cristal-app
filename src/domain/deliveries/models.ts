
export type CheckInStatus = 'delivered' | 'no-sale' | 'absent-return' | 'absent-no-return';

export interface Delivery {
    id: string;
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
}

export interface DeliveryStatusData {
    checkInStatus?: CheckInStatus;
    hadSale?: boolean;
    timestamp?: string;
}
