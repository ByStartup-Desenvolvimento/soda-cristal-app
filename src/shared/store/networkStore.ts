import { create } from 'zustand';

/**
 * Estado de conectividade para UI (banner offline, etc.).
 * Hoje: `navigator.onLine` + eventos `online`/`offline`.
 *
 * Ao integrar a branch com Capacitor, instale `@capacitor/network` e, no mesmo
 * efeito onde `syncNetworkFromNavigator` é chamado (ex.: App.tsx), adicione
 * `Network.getStatus()` e `Network.addListener('networkStatusChange', …)`
 * atualizando `useNetworkStore.setState({ isOnline: status.connected })`.
 */
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
