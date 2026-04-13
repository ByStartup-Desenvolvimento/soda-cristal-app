import { create } from 'zustand';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

interface NetworkState {
    isOnline: boolean;
}

export const useNetworkStore = create<NetworkState>(() => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
}));

export function syncNetworkFromNavigator(): void {
    if (typeof navigator === 'undefined') return;
    useNetworkStore.setState({ isOnline: navigator.onLine });
}

let listenerRegistered = false;

/**
 * Inicializa detecção de rede confiável via @capacitor/network no nativo
 * e fallback para navigator.onLine + eventos no web.
 * Deve ser chamada UMA vez no App.tsx após login.
 */
export async function initNetworkListener(): Promise<() => void> {
    if (listenerRegistered) return () => {};
    listenerRegistered = true;

    if (Capacitor.isNativePlatform()) {
        const status = await Network.getStatus();
        useNetworkStore.setState({ isOnline: status.connected });

        const handle = await Network.addListener('networkStatusChange', (s) => {
            useNetworkStore.setState({ isOnline: s.connected });
        });

        return () => {
            handle.remove();
            listenerRegistered = false;
        };
    }

    syncNetworkFromNavigator();
    const onChange = () => syncNetworkFromNavigator();
    window.addEventListener('online', onChange);
    window.addEventListener('offline', onChange);

    return () => {
        window.removeEventListener('online', onChange);
        window.removeEventListener('offline', onChange);
        listenerRegistered = false;
    };
}
