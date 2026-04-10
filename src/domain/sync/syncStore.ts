import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { useNetworkStore } from '../../shared/store/networkStore';
import { useRotasStore } from '../rotas/rotasStore';

interface SyncState {
    /** Primeiro sync completo bem-sucedido após login (persistido). */
    lastFullSyncAt: number | null;
    isSyncing: boolean;
    /**
     * Primeira sincronização após instalar / novo login (lastFullSyncAt === null).
     * Só roda com rede; usa `loadRotas` + `loadTodaysRoutes` com refresh forçado.
     */
    runBootstrapIfNeeded: (vendedorId: number) => Promise<void>;
    resetForLogout: () => void;
}

let bootstrapLocked = false;

export const useSyncStore = create<SyncState>()(
    persist(
        (set, get) => ({
            lastFullSyncAt: null,
            isSyncing: false,

            runBootstrapIfNeeded: async (vendedorId: number) => {
                if (!useNetworkStore.getState().isOnline) return;
                if (get().lastFullSyncAt !== null) return;
                if (bootstrapLocked) return;
                if (!useRotasStore.getState().hasHydratedFromStorage) return;

                bootstrapLocked = true;
                set({ isSyncing: true });
                try {
                    await useRotasStore.getState().loadRotas(vendedorId, true);
                    await useRotasStore.getState().loadTodaysRoutes(vendedorId, true);
                    set({ lastFullSyncAt: Date.now(), isSyncing: false });
                } catch {
                    set({ isSyncing: false });
                } finally {
                    bootstrapLocked = false;
                }
            },

            resetForLogout: () => set({ lastFullSyncAt: null, isSyncing: false }),
        }),
        {
            name: 'soda-sync-storage',
            storage: createJSONStorage(() => ({
                getItem: async (name: string) => (await idbGet(name)) ?? null,
                setItem: async (name: string, value: string) => await idbSet(name, value),
                removeItem: async (name: string) => await idbDel(name),
            })),
            partialize: (state) => ({ lastFullSyncAt: state.lastFullSyncAt }),
            skipHydration: true,
        }
    )
);

/**
 * Pull leve ao reconectar: respeita TTL/cache do `rotasStore` (sem `forceRefresh`).
 */
export async function pullCriticalDataAfterReconnect(vendedorId: number): Promise<void> {
    if (!useNetworkStore.getState().isOnline) return;
    if (!useRotasStore.getState().hasHydratedFromStorage) return;
    await useRotasStore.getState().loadRotas(vendedorId, false);
    await useRotasStore.getState().loadTodaysRoutes(vendedorId, false);
}
