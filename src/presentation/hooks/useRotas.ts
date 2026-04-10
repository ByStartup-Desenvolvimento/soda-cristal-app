import { useEffect } from 'react';
import { useRotasStore } from '../../domain/rotas/rotasStore';

/**
 * Hook para gerenciar rotas do vendedor
 * Carrega rotas e, em seguida, busca deliveries de cada rota para enriquecer os cards
 */
export function useRotas() {
    const {
        rotas,
        isLoading,
        isLoadingDeliveries,
        error,
        deliveriesPorRota,
        loadRotas,
        loadDeliveriesPorRotas,
        clearError,
        loadingStep,
        loadingProgress,
        hasHydratedFromStorage,
        offlineModeHint,
    } = useRotasStore();

    // Busca vendedorId do localStorage
    const vendedorIdStr = localStorage.getItem('vendedorId');
    const vendedorId = vendedorIdStr ? Number(vendedorIdStr) : null;

    useEffect(() => {
        if (!hasHydratedFromStorage || !vendedorId) return;
        loadRotas(vendedorId);
    }, [vendedorId, loadRotas, hasHydratedFromStorage]);

    // Após carregar as rotas, busca deliveries de cada uma em paralelo
    useEffect(() => {
        if (!hasHydratedFromStorage || rotas.length === 0) return;
        const rotaIds = rotas.map(r => r.id);
        loadDeliveriesPorRotas(rotaIds);
    }, [rotas, loadDeliveriesPorRotas, hasHydratedFromStorage]);

    return {
        rotas,
        isLoading,
        isLoadingDeliveries,
        error,
        deliveriesPorRota,
        reload: () => vendedorId ? loadRotas(vendedorId, true) : undefined,
        clearError,
        loadingStep,
        loadingProgress,
        offlineModeHint,
    };
}

/**
 * Hook para gerenciar a rota atual e seus clientes
 */
export function useRotaAtual(rotaId: number | null) {
    const { rotaAtual, clientesRota, isLoading, selectRota, loadClientesRota } = useRotasStore();

    useEffect(() => {
        if (rotaId) {
            selectRota(rotaId);
            loadClientesRota(rotaId);
        }
    }, [rotaId, selectRota, loadClientesRota]);

    return {
        rota: rotaAtual,
        clientes: clientesRota,
        isLoading,
    };
}
