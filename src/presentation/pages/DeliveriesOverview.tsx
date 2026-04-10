import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { Badge } from '../../shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui/tabs';
import { Button } from '../../shared/ui/button';
import { CheckCircle, MapPin, Calendar, AlertCircle, RefreshCw, Route, Loader2 } from 'lucide-react';
import { useRotasStore } from '../../domain/rotas/rotasStore';
import { useNetworkStore } from '../../shared/store/networkStore';
import { OfflineDataBanner } from '../components/OfflineDataBanner';
import { DeliveryStatusData } from '../../domain/deliveries/models';
import { useMemo } from 'react';
import { mapClienteToDelivery } from '../../domain/deliveries/delivery-mapper';

interface DeliveriesOverviewProps {
  deliveryStatuses: Record<string, DeliveryStatusData>;
  onSelectRoute: (route: any) => void;
  vendedorId: number;
}

export function DeliveriesOverview({ deliveryStatuses, onSelectRoute, vendedorId }: DeliveriesOverviewProps) {
  const [selectedTab, setSelectedTab] = useState('today');
  const { 
    clientesRota, 
    rotasDeHoje, 
    isLoading, 
    loadingStep, 
    loadingProgress, 
    error, 
    loadTodaysRoutes, 
    selectRota,
    hasHydratedFromStorage,
    offlineModeHint,
  } = useRotasStore();
  const isOnline = useNetworkStore(s => s.isOnline);

  useEffect(() => {
    if (!hasHydratedFromStorage) return;
    loadTodaysRoutes(vendedorId);
  }, [vendedorId, loadTodaysRoutes, hasHydratedFromStorage]);

  const showOfflineBanner =
    Boolean(offlineModeHint) ||
    (!isOnline && (clientesRota.length > 0 || rotasDeHoje.length > 0));
  const offlineBannerText =
    offlineModeHint ?? 'Sem conexão — exibindo dados salvos';

  const allDeliveries = useMemo(() => 
    clientesRota.map((cliente) => mapClienteToDelivery(cliente)),
  [clientesRota]);
  
  // Filtragem baseada no status local (check-in realizado ou não)
  const todayDeliveries = useMemo(() => 
    allDeliveries.filter(d => {
      const status = deliveryStatuses[d.id]?.checkInStatus;
      return !status || status === undefined; // Se não tem status, é pendente
    }),
  [allDeliveries, deliveryStatuses]);

  const completedDeliveries = useMemo(() => 
    allDeliveries.filter(d => {
      const status = deliveryStatuses[d.id]?.checkInStatus;
      return status !== undefined; // Se tem status, está concluído/processado
    }),
  [allDeliveries, deliveryStatuses]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm';
      case 'in-progress':
        return 'bg-orange-50 text-orange-700 border-orange-300 shadow-sm';
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-300 shadow-sm';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-300 shadow-sm';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'in-progress':
        return 'Em Andamento';
      case 'completed':
        return 'Concluída';
      default:
        return status;
    }
  };

  const mappedRoutes = useMemo(() => 
    rotasDeHoje.map(rota => {
      const routeDeliveries = clientesRota
        .filter(c => c.rota.id === rota.id)
        .map(mapClienteToDelivery);

      // Predominant zone
      const bairroCount: Record<string, number> = {};
      const deliveriesInRoute = clientesRota.filter(c => c.rota.id === rota.id);
      for (const d of deliveriesInRoute) {
        const bairro = d.cliente.bairro?.trim();
        if (bairro) {
          bairroCount[bairro] = (bairroCount[bairro] || 0) + 1;
        }
      }
      const sortedZonas = Object.entries(bairroCount).sort((a, b) => b[1] - a[1]);
      const zone = sortedZonas.length > 0 ? sortedZonas[0][0] : '';

      const pendingDeliveriesCount = routeDeliveries.filter(d => !deliveryStatuses[d.id]?.checkInStatus).length;
      const totalDeliveriesCount = routeDeliveries.length;

      let status = 'pending';
      if (totalDeliveriesCount > 0 && pendingDeliveriesCount === 0) {
        status = 'completed';
      } else if (totalDeliveriesCount > 0 && pendingDeliveriesCount < totalDeliveriesCount) {
        status = 'in-progress';
      }

      return {
        ...rota,
        id: rota.id,
        name: rota.nome,
        zone,
        pendingDeliveries: pendingDeliveriesCount,
        totalDeliveries: totalDeliveriesCount,
        deliveries: routeDeliveries,
        status
      };
    }),
  [rotasDeHoje, clientesRota, deliveryStatuses]);

  // Todas as rotas do dia agora ficam na aba principal, independente se estão concluídas na API ou não.
  // A aba 'completed' mostrará apenas as rotas onde TODOS os clientes foram atendidos (no app do celular).
  const pendingRoutes = useMemo(() => mappedRoutes.filter(r => r.status !== 'completed'), [mappedRoutes]);
  const completedRoutes = useMemo(() => mappedRoutes.filter(r => r.status === 'completed'), [mappedRoutes]);

  const renderRouteCard = (route: any, showCompleted = false) => {
    return (
      <Card
        key={route.id}
        className={`hover:shadow-lg transition-all duration-200 cursor-pointer border-2 ${route.status === 'completed' ? 'opacity-75' : 'hover:scale-[1.01]'
          }`}
        style={{ borderColor: route.status === 'completed' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 128, 0, 0.15)' }}
        onClick={() => {
          if (route.status !== 'completed' || showCompleted) {
            selectRota(route.id);
            onSelectRoute({
              id: `route-${route.name}`,
              name: route.name,
              zone: route.zone,
              deliveries: route.deliveries
            });
          }
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center">
                <Route className="w-5 h-5 mr-2" style={{ color: '#008000' }} />
                {route.nome} ({route.frequencia || 'Sem frequência'})
              </CardTitle>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {route.zone || 'Zona não definida'}
                </span>
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              <Badge variant="outline" className={getStatusColor(route.status)}>
                {getStatusLabel(route.status)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Delivery Count */}
          <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(0, 128, 0, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)' }}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${showCompleted ? 'text-green-800' : 'text-white'}`}
              style={{ background: showCompleted ? 'rgba(0, 128, 0, 0.2)' : 'linear-gradient(135deg, #008000 0%, #00a000 100%)' }}
            >
              {route.pendingDeliveries}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {route.pendingDeliveries} entregas pendentes ({route.totalDeliveries} total)
            </span>
          </div>

          {/* Action Button */}
          {route.status === 'pending' && (
            <div className="pt-2 border-t">
              <Button
                className="w-full shadow-md hover:shadow-lg transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #008000 0%, #00a000 100%)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  selectRota(route.id);
                  onSelectRoute({
                    id: `route-${route.name}`,
                    name: route.name,
                    zone: route.zone,
                    deliveries: route.deliveries
                  });
                }}
              >
                Ver Detalhes da Rota
              </Button>
            </div>
          )}

          {route.status === 'in-progress' && (
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                className="w-full border-2 shadow-sm hover:shadow-md transition-all"
                style={{ borderColor: '#f59e0b', color: '#92400e' }}
                onClick={(e) => {
                  e.stopPropagation();
                  selectRota(route.id);
                  onSelectRoute({
                    id: `route-${route.name}`,
                    name: route.name,
                    zone: route.zone,
                    deliveries: route.deliveries
                  });
                }}
              >
                Continuar Rota
              </Button>
            </div>
          )}

          {route.status === 'completed' && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-center p-2.5 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(0, 128, 0, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)' }}>
                <span className="text-sm" style={{ color: '#006600' }}>
                  ✓ Rota Concluída
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-20 animate-pulse" />
          <Loader2 className="w-16 h-16 text-green-600 animate-spin relative" />
        </div>
        
        <div className="space-y-4 max-w-[250px] w-full">
          <h2 className="text-xl font-semibold text-gray-900">
            {loadingStep === 'rotas' ? 'Buscando rotas...' : 'Preparando entregas...'}
          </h2>
          
          {loadingProgress && loadingProgress.total > 0 && (
            <div className="space-y-2">
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300 ease-out"
                  style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 font-medium">
                Sincronizando {loadingProgress.current} de {loadingProgress.total} rotas
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const hasRotasCache = clientesRota.length > 0 || rotasDeHoje.length > 0;
  if (error && !hasRotasCache) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Erro ao carregar entregas</h2>
        <p className="text-gray-500 max-w-xs">{error}</p>
        <Button onClick={() => loadTodaysRoutes(vendedorId, true)} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Tentar Novamente
        </Button>
      </div>
    );
  }

  // Empty state handling
  if (!isLoading && rotasDeHoje.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center space-y-4">
        <MapPin className="w-12 h-12 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900">Nenhuma Rota Hoje</h2>
        <p className="text-gray-500 max-w-xs">Você não possui rotas programadas para o dia de hoje.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      {showOfflineBanner ? <OfflineDataBanner message={offlineBannerText} /> : null}
      {error && hasRotasCache ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Minhas Rotas de Hoje</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe suas rotas programadas
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center border-2 shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: 'rgba(0, 128, 0, 0.15)', background: 'linear-gradient(135deg, rgba(0, 128, 0, 0.03) 0%, rgba(255, 255, 255, 1) 100%)' }}>
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-2xl" style={{ color: '#008000' }}>{todayDeliveries.length}</p>
              <p className="text-xs text-muted-foreground">Clientes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="text-center border-2 shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: 'rgba(16, 185, 129, 0.15)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(255, 255, 255, 1) 100%)' }}>
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-2xl" style={{ color: '#10b981' }}>{completedDeliveries.length}</p>
              <p className="text-xs text-muted-foreground">Realizados</p>
            </div>
          </CardContent>
        </Card>

        <Card className="text-center border-2 shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: 'rgba(6, 182, 212, 0.15)', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.03) 0%, rgba(255, 255, 255, 1) 100%)' }}>
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-2xl" style={{ color: '#06b6d4' }}>
                {allDeliveries.reduce((total, d) => total + d.bottles.quantity, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Garrafas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Rota de Hoje</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Realizados</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-3 mt-4">
          {pendingRoutes.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <div className="space-y-2">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-medium">Nenhuma rota pendente</h3>
                  <p className="text-sm text-muted-foreground">
                    Você concluiu todas as suas rotas de hoje!
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">
                  Listando {pendingRoutes.length} rotas pendentes
                </p>
              </div>
              {pendingRoutes
                .map(route => renderRouteCard(route))
              }
            </>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3 mt-4">
          {completedRoutes.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <div className="space-y-2">
                  <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-medium">Nenhuma rota concluída</h3>
                  <p className="text-sm text-muted-foreground">
                    Suas rotas finalizadas aparecerão aqui
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">
                  {completedRoutes.length} rotas concluídas hoje
                </p>
              </div>
              {completedRoutes
                .map(route => renderRouteCard(route, true))
              }
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}