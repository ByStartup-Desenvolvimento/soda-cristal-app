import { useUserStore } from "./domain/auth/userStore";
import { useUiStore } from "./shared/store/uiStore";
import { useDeliveryStore } from "./domain/deliveries/deliveryStore";
import { Toaster } from "./shared/ui/sonner";
import { LoginScreen } from "./presentation/pages/LoginScreen";
import { Dashboard } from "./presentation/pages/Dashboard";
import { CheckInScreen } from "./presentation/pages/CheckInScreen";
import { CustomerRegistration } from "./presentation/pages/CustomerRegistration";
import { CustomerList } from "./presentation/pages/CustomerList";
import { CustomerHistory } from "./presentation/pages/CustomerHistory";
import { PendingContracts } from "./presentation/pages/PendingContracts";
import { PDVStandalone } from "./presentation/pages/PDVStandalone";
import { RoutesScreen } from "./presentation/pages/RoutesScreen";
import { RouteDetails } from "./presentation/pages/RouteDetails";
import { DeliveriesOverview } from "./presentation/pages/DeliveriesOverview";
import { BottomNavigation } from "./presentation/components/BottomNavigation";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function App() {
  const { isLoggedIn, initialzedAuth, isInitialized, vendedorId } = useUserStore();
  const { setSelectedCustomer, selectedCustomer } = useUiStore();
  const {
    selectedDelivery,
    selectedRoute,
    deliveryStatuses,
    setSelectedDelivery,
    setSelectedRoute,
    updateDeliveryStatus
  } = useDeliveryStore();

  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitialized) {
      initialzedAuth();
    }
  }, [initialzedAuth, isInitialized]);

  if (!isInitialized) {
    return <div>Carregando...</div>;
  }
  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/deliveries" replace />} />

          <Route
            path="/deliveries"
            element={
              <DeliveriesOverview
                deliveryStatuses={deliveryStatuses}
                vendedorId={vendedorId!}
                onSelectDelivery={(delivery, routeDeliveries) => {
                  setSelectedDelivery(delivery);
                  setSelectedRoute({
                    id: `route-${delivery.routeName}`,
                    name: delivery.routeName || "Rota Individual",
                    zone:
                      delivery.address.split(" - ")[1] ||
                      "Zona não especificada",
                    deliveries: routeDeliveries, // Todos os clientes da mesma rota
                  });
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
      </div>
      <BottomNavigation />
      <Toaster />
    </div>
  );
}