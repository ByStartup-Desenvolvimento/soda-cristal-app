import { useUserStore } from "./domain/auth/userStore";
import { useUiStore } from "./shared/store/uiStore";
import { useDeliveryStore } from "./domain/deliveries/deliveryStore";
import { Toaster } from "./shared/ui/sonner";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { LoginScreen } from "./presentation/pages/LoginScreen";
import { BottomNavigation } from "./presentation/components/BottomNavigation";
import { PageLoader } from "./presentation/components/ui/PageLoader";

// Lazy loading pages
const Dashboard = lazy(() => import("./presentation/pages/Dashboard").then(m => ({ default: m.Dashboard })));
const CheckInScreen = lazy(() => import("./presentation/pages/CheckInScreen").then(m => ({ default: m.CheckInScreen })));
const CustomerRegistration = lazy(() => import("./presentation/pages/CustomerRegistration").then(m => ({ default: m.CustomerRegistration })));
const CustomerList = lazy(() => import("./presentation/pages/CustomerList").then(m => ({ default: m.CustomerList })));
const CustomerHistory = lazy(() => import("./presentation/pages/CustomerHistory").then(m => ({ default: m.CustomerHistory })));
const PendingContracts = lazy(() => import("./presentation/pages/PendingContracts").then(m => ({ default: m.PendingContracts })));
const PDVStandalone = lazy(() => import("./presentation/pages/PDVStandalone").then(m => ({ default: m.PDVStandalone })));
const RoutesScreen = lazy(() => import("./presentation/pages/RoutesScreen").then(m => ({ default: m.RoutesScreen })));
const RouteDetails = lazy(() => import("./presentation/pages/RouteDetails").then(m => ({ default: m.RouteDetails })));
const DeliveriesOverview = lazy(() => import("./presentation/pages/DeliveriesOverview").then(m => ({ default: m.DeliveriesOverview })));

export default function App() {
  // Seletores granulares evitam re-renders do componente raiz por mudanças irrelevantes
  const isLoggedIn = useUserStore(s => s.isLoggedIn);
  const initialzedAuth = useUserStore(s => s.initialzedAuth);
  const isInitialized = useUserStore(s => s.isInitialized);
  const vendedorId = useUserStore(s => s.vendedorId);

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
      initialzedAuth();
    }
  }, [initialzedAuth, isInitialized]);

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
                  onSelectRoute={(route) => {
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
                  onSelectRoute={(route) => {
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
                  onCheckIn={(delivery) => {
                    setSelectedDelivery(delivery);
                    navigate("/checkin");
                  }}
                  onOpenPDV={(delivery) => {
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
                  onCheckInComplete={(delivery, status, hadSale) => {
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
                  onViewHistory={(customer) => {
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
                  onSelectDelivery={(delivery) => {
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