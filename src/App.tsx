import { useUserStore } from "./domain/auth/userStore";
import { useUiStore } from "./shared/store/uiStore";
import { useDeliveryStore } from "./domain/deliveries/deliveryStore";
import { useRotasStore } from "./domain/rotas/rotasStore";
import { useOutboxStore } from "./domain/sync/outboxStore";
import { useSyncStore, pullCriticalDataAfterReconnect } from "./domain/sync/syncStore";
import { flushOutbox } from "./domain/sync/flushOutbox";
import { syncNetworkFromNavigator } from "./shared/store/networkStore";
import { PendingSyncBanner } from "./presentation/components/PendingSyncBanner";
import { Toaster } from "./shared/ui/sonner";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import React, { useEffect, lazy, Suspense } from "react";
import { LoginScreen } from "./presentation/pages/LoginScreen";
import { BottomNavigation } from "./presentation/components/BottomNavigation";
import { PageLoader } from "./presentation/components/ui/PageLoader";
import { Delivery, CheckInStatus } from "./domain/deliveries/models";

// Recarrega a página automaticamente quando um chunk falha por deploy novo (hashes stale)
function lazyWithChunkRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch((err: unknown) => {
      const isChunkError =
        err instanceof Error &&
        (err.message.includes('Failed to fetch dynamically imported module') ||
          err.message.includes('Importing a module script failed'));
      if (isChunkError) {
        window.location.reload();
        return new Promise<never>(() => {});
      }
      return Promise.reject(err);
    })
  );
}

// Lazy loading pages
const Dashboard = lazyWithChunkRetry(() => import("./presentation/pages/Dashboard").then(m => ({ default: m.Dashboard })));
const CheckInScreen = lazyWithChunkRetry(() => import("./presentation/pages/CheckInScreen").then(m => ({ default: m.CheckInScreen })));
const CustomerRegistration = lazyWithChunkRetry(() => import("./presentation/pages/CustomerRegistration").then(m => ({ default: m.CustomerRegistration })));
const CustomerList = lazyWithChunkRetry(() => import("./presentation/pages/CustomerList").then(m => ({ default: m.CustomerList })));
const CustomerHistory = lazyWithChunkRetry(() => import("./presentation/pages/CustomerHistory").then(m => ({ default: m.CustomerHistory })));
const PendingContracts = lazyWithChunkRetry(() => import("./presentation/pages/PendingContracts").then(m => ({ default: m.PendingContracts })));
const PDVStandalone = lazyWithChunkRetry(() => import("./presentation/pages/PDVStandalone").then(m => ({ default: m.PDVStandalone })));
const RoutesScreen = lazyWithChunkRetry(() => import("./presentation/pages/RoutesScreen").then(m => ({ default: m.RoutesScreen })));
const RouteDetails = lazyWithChunkRetry(() => import("./presentation/pages/RouteDetails").then(m => ({ default: m.RouteDetails })));
const DeliveriesOverview = lazyWithChunkRetry(() => import("./presentation/pages/DeliveriesOverview").then(m => ({ default: m.DeliveriesOverview })));

export default function App() {
  // Seletores granulares evitam re-renders do componente raiz por mudanças irrelevantes
  const isLoggedIn = useUserStore(s => s.isLoggedIn);
  const initializeAuth = useUserStore(s => s.initializeAuth);
  const isInitialized = useUserStore(s => s.isInitialized);
  const vendedorId = useUserStore(s => s.vendedorId);
  const setHasHydratedFromStorage = useRotasStore(s => s.setHasHydratedFromStorage);
  const hasHydratedFromStorage = useRotasStore(s => s.hasHydratedFromStorage);

  const selectedCustomer = useUiStore(s => s.selectedCustomer);
  const setSelectedCustomer = useUiStore(s => s.setSelectedCustomer);

  const selectedDelivery = useDeliveryStore(s => s.selectedDelivery);
  const selectedRoute = useDeliveryStore(s => s.selectedRoute);
  const deliveryStatuses = useDeliveryStore(s => s.deliveryStatuses);
  const setSelectedDelivery = useDeliveryStore(s => s.setSelectedDelivery);
  const setSelectedRoute = useDeliveryStore(s => s.setSelectedRoute);
  const updateDeliveryStatus = useDeliveryStore(s => s.updateDeliveryStatus);

  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitialized) {
      initializeAuth();
    }
  }, [initializeAuth, isInitialized]);

  // Hidrata rotas, outbox e sync do IndexedDB após auth; libera loads da API só com rotas reidratadas.
  useEffect(() => {
    if (!isInitialized || !isLoggedIn) {
      setHasHydratedFromStorage(false);
      return;
    }
    let cancelled = false;
    void Promise.all([
      useRotasStore.persist.rehydrate(),
      useOutboxStore.persist.rehydrate(),
      useSyncStore.persist.rehydrate(),
    ]).then(() => {
      if (!cancelled) setHasHydratedFromStorage(true);
    });
    return () => {
      cancelled = true;
    };
  }, [isInitialized, isLoggedIn, setHasHydratedFromStorage]);

  // Primeiro sync completo (bootstrap) quando ainda não há lastFullSyncAt e há rede.
  useEffect(() => {
    if (!isInitialized || !isLoggedIn || !vendedorId || !hasHydratedFromStorage) return;
    void useSyncStore.getState().runBootstrapIfNeeded(vendedorId);
  }, [isInitialized, isLoggedIn, vendedorId, hasHydratedFromStorage]);

  // Ao voltar online ou focar o app: envia outbox e puxa dados críticos (TTL do rotasStore).
  useEffect(() => {
    if (!isLoggedIn || !vendedorId) return;

    const runFlushAndMaybePull = () => {
      syncNetworkFromNavigator();
      void flushOutbox();
      void pullCriticalDataAfterReconnect(vendedorId);
    };

    if (typeof navigator !== "undefined" && navigator.onLine) {
      void flushOutbox();
    }

    const onOnline = () => runFlushAndMaybePull();
    window.addEventListener("online", onOnline);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        syncNetworkFromNavigator();
        void flushOutbox();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isLoggedIn, vendedorId]);

  // Conectividade: navigator + eventos. Com Capacitor, complemente com @capacitor/network (ver networkStore.ts).
  useEffect(() => {
    if (!isLoggedIn) return;
    syncNetworkFromNavigator();
    const onChange = () => syncNetworkFromNavigator();
    window.addEventListener("online", onChange);
    window.addEventListener("offline", onChange);
    return () => {
      window.removeEventListener("online", onChange);
      window.removeEventListener("offline", onChange);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      import("./presentation/pages/DeliveriesOverview");
      import("./presentation/pages/RoutesScreen");
      import("./presentation/pages/RouteDetails");
    }
  }, [isLoggedIn]);

  if (!isInitialized) {
    return <div>Carregando...</div>;
  }
  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PendingSyncBanner />
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/deliveries" replace />} />

            <Route
              path="/deliveries"
              element={
                <DeliveriesOverview
                  deliveryStatuses={deliveryStatuses}
                  vendedorId={vendedorId!}
                  onSelectRoute={(route: unknown) => {
                    setSelectedRoute(route);
                    navigate("/routes/details");
                  }}
                />
              }
            />

            <Route
              path="/routes"
              element={
                <RoutesScreen
                  onSelectRoute={(route: unknown) => {
                    setSelectedRoute(route);
                    navigate("/routes/details");
                  }}
                />
              }
            />

            <Route
              path="/routes/details"
              element={
                <RouteDetails
                  route={selectedRoute}
                  deliveryStatuses={deliveryStatuses}
                  onBack={() => {
                    // Return to the appropriate previous screen
                    if (
                      selectedDelivery &&
                      selectedRoute?.deliveries?.length === 1
                    ) {
                      navigate("/deliveries");
                    } else {
                      navigate("/routes");
                    }
                  }}
                  onCheckIn={(delivery: Delivery) => {
                    setSelectedDelivery(delivery);
                    navigate("/checkin");
                  }}
                  onOpenPDV={(delivery: Delivery) => {
                    setSelectedDelivery(delivery);
                    navigate("/pdv/delivery");
                  }}
                />
              }
            />

            <Route
              path="/checkin"
              element={
                <CheckInScreen
                  delivery={selectedDelivery}
                  onBack={() => navigate("/routes/details")}
                  onCheckInComplete={(delivery: Delivery, status: CheckInStatus, hadSale: boolean) => {
                    // Update delivery status
                    updateDeliveryStatus(delivery.id, {
                      checkInStatus: status,
                      hadSale: hadSale,
                      timestamp: new Date().toISOString(),
                    });

                    if (hadSale) {
                      navigate("/pdv/delivery");
                    } else {
                      navigate("/routes/details");
                    }
                  }}
                />
              }
            />

            <Route
              path="/customers"
              element={
                <CustomerList
                  onAddCustomer={() => navigate("/customers/new")}
                  onViewContracts={() => navigate("/contracts")}
                  onViewHistory={(customer: unknown) => {
                    setSelectedCustomer(customer);
                    navigate("/customers/history");
                  }}
                />
              }
            />

            <Route
              path="/customers/history"
              element={
                <CustomerHistory
                  customer={selectedCustomer}
                  onBack={() => navigate("/customers")}
                />
              }
            />

            <Route
              path="/customers/new"
              element={
                <CustomerRegistration
                  onBack={() => navigate("/customers")}
                  onSuccess={() => navigate("/customers")}
                />
              }
            />

            <Route
              path="/contracts"
              element={
                <PendingContracts
                  onBack={() => navigate("/customers")}
                />
              }
            />

            <Route path="/pdv" element={<PDVStandalone />} />

            <Route
              path="/pdv/delivery"
              element={
                <PDVStandalone
                  delivery={selectedDelivery}
                  onBack={() => navigate("/routes/details")}
                />
              }
            />

            <Route
              path="/dashboard"
              element={
                <Dashboard
                  onSelectDelivery={(delivery: Delivery) => {
                    setSelectedDelivery(delivery);
                    navigate("/checkin");
                  }}
                  onAddCustomer={() => navigate("/customers/new")}
                />
              }
            />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
      <BottomNavigation />
      <Toaster />
    </div>
  );
}