import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { Badge } from '../../shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/ui/tabs';
import { Skeleton } from '../../shared/ui/skeleton';
import { Button } from '../../shared/ui/button';
import { CheckCircle, MapPin, Droplets, Phone, Calendar, DollarSign, UserX, AlertCircle, RefreshCw } from 'lucide-react';
import { useRotasStore } from '../../domain/rotas/rotasStore';
import { Delivery, DeliveryStatusData } from '../../domain/deliveries/models';
import { RotaEntregaCompleta, PrioridadeCliente } from '../../domain/rotas/models';
import { rotasService } from '../../domain/rotas/services';
import { formatApiDate, formatPhone } from '@/shared/utils/formatters';

interface DeliveriesOverviewProps {
  deliveryStatuses: Record<string, DeliveryStatusData>;
  onSelectDelivery: (delivery: Delivery, routeDeliveries: Delivery[]) => void;
  vendedorId: number;
}

export function DeliveriesOverview({ deliveryStatuses, onSelectDelivery, vendedorId }: DeliveriesOverviewProps) {
  const [selectedTab, setSelectedTab] = useState('today');
  const { rotaAtual, clientesRota, isLoading, error, loadTodaysRoutes } = useRotasStore();

  useEffect(() => {
    loadTodaysRoutes(vendedorId);
  }, [vendedorId, loadTodaysRoutes]);

  const mapPrioridade = (prioridade: PrioridadeCliente): 'high' | 'medium' | 'low' => {
    switch (prioridade) {
      case 'urgente': return 'high';
      case 'normal': return 'medium';
      case 'baixa': return 'low';
      default: return 'medium';
    }
  };

  // const calculateEstimatedTime = (index: number): string => {
  //   // Começa às 08:00, adiciona 15 min por cliente
  //   const startHour = 8;
  //   const minutesPerClient = 15;
  //   const totalMinutes = index * minutesPerClient;

  //   const hour = startHour + Math.floor(totalMinutes / 60);
  //   const minute = totalMinutes % 60;

  //   return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  // };

  // Adapter: Converter RotaEntregaCompleta (Domínio Rotas) para Delivery (Model UI/Deliveries)
  const mapClienteToDelivery = (item: RotaEntregaCompleta): Delivery => {
    return {
      id: item.rotaentrega.id.toString(), // ID único da entrega na rota
      orderId: `PED-${item.rotaentrega.id}`,
      orderCode: `SCT-${item.cliente.id}`,
      customerName: item.cliente.nome,
      customerPhone: item.cliente.celular || item.cliente.celular2 || '',
      address: `${item.cliente.rua}, ${item.cliente.numero} - ${item.cliente.bairro}`,
      bottles: {
        quantity: item.rotaentrega.num_garrafas || 0,
        size: '20L' // Padrão
      },
      status: 'pending', // Status base é pendente, UI sobrepõe com deliveryStatuses
      priority: mapPrioridade(rotasService.calcularPrioridade(item)),
      estimatedTime: formatApiDate(new Date()),
      routeName: item.rota.nome,
      notes: item.cliente.observacao,
      latitude: item.cliente.latitude,
      longitude: item.cliente.longitude,
    };
  };
  console.log(clientesRota);

  const allDeliveries = clientesRota.map((cliente) => mapClienteToDelivery(cliente));

  // Filtragem baseada no status local (check-in realizado ou não)
  const todayDeliveries = allDeliveries.filter(d => {
    const status = deliveryStatuses[d.id]?.checkInStatus;
    return !status || status === undefined; // Se não tem status, é pendente
  });

  const completedDeliveries = allDeliveries.filter(d => {
    const status = deliveryStatuses[d.id]?.checkInStatus;
    return status !== undefined; // Se tem status, está concluído/processado
  });

  const getCheckInStatusInfo = (deliveryId: string) => {
    const statusData = deliveryStatuses[deliveryId];
    if (!statusData || !statusData.checkInStatus) return null;

    switch (statusData.checkInStatus) {
      case 'delivered':
        return {
          color: 'bg-green-100 border-green-300',
          textColor: 'text-green-800',
          badgeColor: 'bg-green-600 text-white',
          label: 'Entregue',
          icon: CheckCircle
        };
      case 'no-sale':
        return {
          color: 'bg-gray-100 border-gray-300',
          textColor: 'text-gray-800',
          badgeColor: 'bg-gray-600 text-white',
          label: 'Não quis consumir',
          icon: UserX
        };
      case 'absent-return':
        return {
          color: 'bg-yellow-100 border-yellow-300',
          textColor: 'text-yellow-800',
          badgeColor: 'bg-yellow-600 text-white',
          label: 'Ausente - Retornar',
          icon: AlertCircle
        };
      case 'absent-no-return':
        return {
          color: 'bg-red-100 border-red-300',
          textColor: 'text-red-800',
          badgeColor: 'bg-red-600 text-white',
          label: 'Ausente - Não retornar',
          icon: UserX
        };
      default:
        return null;
    }
  };

  const formatCompletedTime = (timestamp?: string) => {
    if (!timestamp) return '--:--';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderDeliveryCard = (delivery: Delivery, showCompleted = false) => {
    const checkInStatus = getCheckInStatusInfo(delivery.id);
    const statusData = deliveryStatuses[delivery.id];

    return (
      <Card
        key={delivery.id}
        className={`hover:shadow-lg transition-all duration-200 cursor-pointer border-2 ${checkInStatus ? checkInStatus.color : (showCompleted ? 'bg-green-50/50' : 'hover:scale-[1.02]')
          }`}
        style={{ borderColor: checkInStatus ? undefined : (showCompleted ? 'rgba(0, 128, 0, 0.2)' : 'rgba(0, 0, 0, 0.1)') }}
        onClick={() => {
          // Passa todos os clientes da mesma rota (mesmo routeName)
          const routeDeliveries = allDeliveries.filter(d => d.routeName === delivery.routeName);
          onSelectDelivery(delivery, routeDeliveries);
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                {checkInStatus && (() => {
                  const StatusIcon = checkInStatus.icon;
                  return <StatusIcon className={`w-5 h-5 ${checkInStatus.textColor}`} />;
                })()}
                {!checkInStatus && showCompleted && <CheckCircle className="w-5 h-5" style={{ color: '#008000' }} />}
                {delivery.customerName}
              </CardTitle>
              <div className="flex items-center space-x-2 flex-wrap gap-1 text-sm text-muted-foreground">
                <span className="font-medium text-green-700">{delivery.routeName}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {showCompleted ? 'Finalizado' : delivery.estimatedTime}
                </span>
                {delivery.priority === 'high' && !showCompleted && (
                  <Badge variant="destructive" className="ml-1 text-xs px-1">Prioridade</Badge>
                )}
                {checkInStatus && (
                  <>
                    <Badge variant="outline" className={`${checkInStatus.badgeColor} border-0 text-xs ml-1`}>
                      {checkInStatus.label}
                    </Badge>
                    {statusData?.hadSale && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-300">
                        <DollarSign className="w-3 h-3 mr-0.5" />
                        Venda
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{delivery.address}</span>
          </div>

          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{formatPhone(delivery.customerPhone)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Droplets className="w-4 h-4" style={{ color: '#06b6d4' }} />
              <span className="text-sm">
                {delivery.bottles.quantity} garrafas de {delivery.bottles.size}
              </span>
            </div>
          </div>

          {delivery.notes && (
            <div className="border-2 rounded-lg p-2.5" style={{ background: 'rgba(251, 191, 36, 0.08)', borderColor: 'rgba(251, 191, 36, 0.3)' }}>
              <p className="text-sm" style={{ color: '#92400e' }}>
                <strong>Observação:</strong> {delivery.notes}
              </p>
            </div>
          )}

          {showCompleted && statusData?.timestamp && (
            <div className="pt-2 border-t rounded-lg p-2.5 -mx-2 -mb-2" style={{ background: 'linear-gradient(135deg, rgba(0, 128, 0, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)' }}>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4" style={{ color: '#008000' }} />
                <span className="text-sm" style={{ color: '#006600' }}>
                  Concluída em {formatCompletedTime(statusData.timestamp)}
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
      <div className="p-4 space-y-4 pb-20">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Erro ao carregar entregas</h2>
        <p className="text-gray-500 max-w-xs">{error}</p>
        <Button onClick={() => loadTodaysRoutes(vendedorId)} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Tentar Novamente
        </Button>
      </div>
    );
  }

  // Empty state handling
  if (!isLoading && clientesRota.length === 0) {
    // Se não tem clientes da rota carregados, mostra estado vazio ou pede pra selecionar rota
    // Mas o store deve ter clientes se a rota foi carregada.
    // Assumindo que o componente pai gerencia seleção de rota
    return (
      <div className="p-4 flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center space-y-4">
        <MapPin className="w-12 h-12 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900">Rota Vazia</h2>
        <p className="text-gray-500 max-w-xs">Nenhum cliente encontrado para esta rota.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{rotaAtual ? rotaAtual.nome : 'Minha Rota'}</h1>
        <p className="text-sm text-muted-foreground">
          {rotaAtual?.frequencia || 'Acompanhe seus clientes programados'}
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
          {todayDeliveries.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <div className="space-y-2">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-medium">Nenhum cliente na rota</h3>
                  <p className="text-sm text-muted-foreground">
                    Seus clientes aparecerão aqui quando a rota for iniciada
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">
                  Listando {todayDeliveries.length} clientes
                </p>
              </div>
              {todayDeliveries
                .map(delivery => renderDeliveryCard(delivery))
              }
            </>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3 mt-4">
          {completedDeliveries.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <div className="space-y-2">
                  <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-medium">Nenhum atendimento realizado</h3>
                  <p className="text-sm text-muted-foreground">
                    Seus atendimentos concluídos aparecerão aqui
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">
                  {completedDeliveries.length} atendimentos realizados hoje
                </p>
              </div>
              {completedDeliveries
                .sort((a, b) => {
                  const tsA = deliveryStatuses[a.id]?.timestamp;
                  const tsB = deliveryStatuses[b.id]?.timestamp;
                  if (tsA && tsB) return new Date(tsB).getTime() - new Date(tsA).getTime();
                  return 0;
                })
                .map(delivery => renderDeliveryCard(delivery, true))
              }
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}