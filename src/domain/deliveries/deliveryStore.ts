import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Delivery, DeliveryStatusData } from './models';

interface DeliveryState {
    selectedDelivery: Delivery | null;
    selectedRoute: any | null; // Route type to be defined strictly later if needed
    deliveryStatuses: Record<string, DeliveryStatusData>;

    setSelectedDelivery: (delivery: Delivery | null) => void;
    setSelectedRoute: (route: any | null) => void;
    updateDeliveryStatus: (id: string, status: DeliveryStatusData) => void;
    resetDeliveryStatus: (id: string) => void;
    clearDeliveryStatuses: () => void;
}

export const useDeliveryStore = create<DeliveryState>()(
    persist(
        (set) => ({
            selectedDelivery: null,
            selectedRoute: null,
            deliveryStatuses: {},

            setSelectedDelivery: (delivery) => set({ selectedDelivery: delivery }),
            setSelectedRoute: (route) => set({ selectedRoute: route }),
            updateDeliveryStatus: (id, status) => set((state) => ({
                deliveryStatuses: { ...state.deliveryStatuses, [id]: status }
            })),
            resetDeliveryStatus: (id) => set((state) => {
                const newStatuses = { ...state.deliveryStatuses };
                delete newStatuses[id];
                return { deliveryStatuses: newStatuses };
            }),
            clearDeliveryStatuses: () => set({ deliveryStatuses: {} }),
        }),
        {
            name: 'soda-delivery-storage',
        }
    )
);
