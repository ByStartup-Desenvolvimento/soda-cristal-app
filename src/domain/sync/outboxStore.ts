import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import type { CheckInFullPayload, OutboxItem } from './outboxTypes';

interface OutboxState {
    items: OutboxItem[];
    enqueueCheckInFull: (payload: CheckInFullPayload) => string;
    removeItem: (id: string) => void;
    patchItem: (id: string, patch: Pick<OutboxItem, 'attempts' | 'lastError'>) => void;
    clearAll: () => void;
}

function newId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `ob-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export const useOutboxStore = create<OutboxState>()(
    persist(
        (set) => ({
            items: [],

            enqueueCheckInFull: (payload: CheckInFullPayload) => {
                const id = newId();
                const item: OutboxItem = {
                    id,
                    type: 'CHECK_IN_FULL',
                    payload,
                    clientRequestId: id,
                    createdAt: Date.now(),
                    attempts: 0,
                    lastError: null,
                };
                set((s) => ({ items: [...s.items, item] }));
                return id;
            },

            removeItem: (id: string) =>
                set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

            patchItem: (id: string, patch) =>
                set((s) => ({
                    items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
                })),

            clearAll: () => set({ items: [] }),
        }),
        {
            name: 'soda-outbox-storage',
            storage: createJSONStorage(() => ({
                getItem: async (name: string) => (await idbGet(name)) ?? null,
                setItem: async (name: string, value: string) => await idbSet(name, value),
                removeItem: async (name: string) => await idbDel(name),
            })),
            partialize: (state) => ({ items: state.items }),
            skipHydration: true,
        }
    )
);

