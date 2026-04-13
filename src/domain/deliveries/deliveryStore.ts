import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { Delivery, DeliveryStatusData } from './models';

interface DeliveryState {
    selectedDelivery: Delivery | null;
    selectedRoute: any | null;
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
            storage: createJSONStorage(() => ({
                getItem: async (name: string) => (await idbGet(name)) ?? null,
                setItem: async (name: string, value: string) => await idbSet(name, value),
                removeItem: async (name: string) => await idbDel(name),
            })),
            partialize: (state) => ({
                deliveryStatuses: state.deliveryStatuses,
            }),
            skipHydration: true,
        }
    )
);
