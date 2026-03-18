import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { Button } from '../../shared/ui/button';
import { Badge } from '../../shared/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../shared/ui/sheet';
import { Skeleton } from '../../shared/ui/skeleton';
import { ArrowLeft, MapPin, Droplets, Phone, CheckCircle, ShoppingCart, UserX, AlertCircle, DollarSign, Calendar } from 'lucide-react';
import { formatPhone, formatApiDate } from '@/shared/utils/formatters';

import { Delivery, DeliveryStatusData } from '../../domain/deliveries/models';
import { useRotasStore } from '../../domain/rotas/rotasStore';
import { rotasService } from '../../domain/rotas/services';
import { RotaEntregaCompleta, PrioridadeCliente } from '../../domain/rotas/models';

interface Route {
  id: string;
  nome: string;
  zone: string;
  frequencia: string;
  pendingDeliveries?: number;
  priority?: 'high' | 'medium' | 'low';
  status?: 'pending' | 'in-progress' | 'completed';
  deliveries?: Delivery[];
}

interface RouteDetailsProps {
  route: Route;
  deliveryStatuses: Record<string, DeliveryStatusData>;
  onBack: () => void;
  onCheckIn: (delivery: Delivery) => void;
  onOpenPDV: (delivery: Delivery) => void;
}

export function RouteDetails({ route, deliveryStatuses, onBack, onCheckIn, onOpenPDV }: RouteDetailsProps) {
  const [_selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const { loadClientesRota, clientesRota, isLoading } = useRotasStore();
  console.log(route);

  useEffect(() => {
    if (route && (!route.deliveries || route.deliveries.length === 0)) {
      // route.id pode vir como string ou number dependendo da origem
      loadClientesRota(Number(route.id));
    }
  }, [route?.id, route?.deliveries, loadClientesRota]);

  const mapPrioridade = (prioridade: PrioridadeCliente): 'high' | 'medium' | 'low' => {
    switch (prioridade) {
      case 'urgente': return 'high';
      case 'normal': return 'medium';
      case 'baixa': return 'low';
      default: return 'medium';
    }
  };

  const mapClienteToDelivery = (item: RotaEntregaCompleta): Delivery => {
    return {
      id: item.rotaentrega.id.toString(),
      orderId: `PED-${item.rotaentrega.id}`,
      orderCode: `SCT-${item.cliente.id}`,
      customerName: item.cliente.nome,
      customerPhone: item.cliente.celular || item.cliente.celular2 || '',
      address: `${item.cliente.rua}, ${item.cliente.numero} - ${item.cliente.bairro}`,
      bottles: {
        quantity: item.rotaentrega.num_garrafas || 0,
        size: '1,5 L'
      },
      status: 'pending',
      priority: mapPrioridade(rotasService.calcularPrioridade(item)),
      estimatedTime: formatApiDate(new Date()),
      routeName: item.rota.nome,
      notes: item.cliente.observacao,
      latitude: item.cliente.latitude,
      longitude: item.cliente.longitude,
      diasSemAtendimento: item.diassematendimento?.length || 0,
      diasSemConsumo: item.diassemconsumo?.length || 0,
    };
  };

  const deliveries = useMemo(() => {
    if (route?.deliveries && route.deliveries.length > 0) {
      return route.deliveries;
    }
    return clientesRota.map(mapClienteToDelivery);
  }, [route?.deliveries, clientesRota]);

  if (!route) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <p className="text-muted-foreground">Nenhuma rota selecionada.</p>
        <Button onClick={onBack} variant="outline">Voltar para Início</Button>
      </div>
    );
  }

  if (isLoading && deliveries.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
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

  // Uma entrega é "pendente" se não tiver checkInStatus registrado
  const pendingDeliveries = deliveries.filter(d => !deliveryStatuses[d.id]?.checkInStatus);
  const completedDeliveries = deliveries.filter(d => !!deliveryStatuses[d.id]?.checkInStatus);
  console.log(deliveries);

  const openGPS = (delivery: Delivery) => {
    if (delivery.latitude && delivery.longitude) {
      // Abre Google Maps com coordenadas precisas
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${delivery.latitude},${delivery.longitude}`,
        '_blank'
      );
    } else {
      // Fallback: busca pelo endereço em texto
      const query = encodeURIComponent(delivery.address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b p-4 space-y-3 shadow-sm" style={{ borderColor: 'rgba(0, 128, 0, 0.1)' }}>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2 hover:bg-green-50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl" style={{ color: '#008000' }}>Rota: {route.nome || route.id}</h1>
            <p className="text-sm text-muted-foreground">{route.frequencia || route.zone}</p>
          </div>
          <Badge variant="outline" className="shadow-sm" style={{ color: '#008000', borderColor: 'rgba(0, 128, 0, 0.3)' }}>
            {pendingDeliveries.length} pendentes
          </Badge>
        </div>

        {/* Route Summary */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(0, 128, 0, 0.08) 0%, rgba(255, 255, 255, 1) 100%)' }}>
            <p className="text-lg" style={{ color: '#008000' }}>{pendingDeliveries.length}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
          <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(255, 255, 255, 1) 100%)' }}>
            <p className="text-lg" style={{ color: '#10b981' }}>{completedDeliveries.length}</p>
            <p className="text-xs text-muted-foreground">Concluídas</p>
          </div>
        </div>
      </div>

      {/* Deliveries List */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-3">
        {deliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-16">
            <MapPin className="w-12 h-12 text-gray-300" />
            <p className="text-muted-foreground">Nenhum cliente nesta rota.</p>
            <Button variant="outline" onClick={onBack}>Voltar</Button>
          </div>
        ) : (
          deliveries.map((delivery, index) => {
            const checkInStatus = getCheckInStatusInfo(delivery.id);
            const statusData = deliveryStatuses[delivery.id];

            return (
              <Card
                key={delivery.id}
                className={`hover:shadow-lg transition-all duration-200 border-2 ${checkInStatus
                  ? checkInStatus.color
                  : (statusData?.checkInStatus ? 'bg-green-50/50' : 'hover:scale-[1.01]')
                  }`}
                style={{
                  borderColor: checkInStatus
                    ? undefined
                    : (statusData?.checkInStatus ? 'rgba(0, 128, 0, 0.2)' : 'rgba(0, 0, 0, 0.1)')
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white shadow-md"
                          style={{
                            background: checkInStatus
                              ? (statusData?.checkInStatus === 'delivered' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                                statusData?.checkInStatus === 'no-sale' ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' :
                                  statusData?.checkInStatus === 'absent-return' ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' :
                                    'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)')
                              : (statusData?.checkInStatus
                                ? 'linear-gradient(135deg, #008000 0%, #00a000 100%)'
                                : 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)')
                          }}
                        >
                          {index + 1}
                        </div>
                        <CardTitle className="text-base font-bold text-gray-800">
                          {delivery.customerName}
                        </CardTitle>
                      </div>
                      <div className="flex items-center space-x-2 flex-wrap gap-1 text-sm text-muted-foreground ml-8">
                        <span className="font-medium text-green-700">{route.nome || route.id}</span>
                        <span className="font-medium text-green-700">-</span>
                        <span className="font-medium text-green-700">{route.zone}</span>
                        <span className="font-medium text-green-700">•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Hoje
                        </span>
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
                        {!checkInStatus && statusData?.checkInStatus && (
                          <CheckCircle className="w-4 h-4 ml-1" style={{ color: '#008000' }} />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1 items-end mt-1">
                      <div className="flex items-center space-x-1" title="Dias sem atendimento">
                        <UserX className="w-3 h-3 text-red-400" />
                        <span className="text-xs text-muted-foreground">{delivery.diasSemAtendimento ?? 0} dias</span>
                      </div>
                      <div className="flex items-center space-x-1" title="Dias sem consumo">
                        <ShoppingCart className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-muted-foreground">{delivery.diasSemConsumo ?? 0} dias</span>
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

                  <div className="flex items-center space-x-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">
                      {delivery.bottles.quantity} garrafas de {delivery.bottles.size}
                    </span>
                  </div>

                  {(delivery.notes && delivery.notes !== 'null' && delivery.notes.trim() !== '') && (
                    <div className="border-2 rounded-lg p-2.5" style={{ background: 'rgba(251, 191, 36, 0.08)', borderColor: 'rgba(251, 191, 36, 0.3)' }}>
                      <p className="text-sm" style={{ color: '#92400e' }}>
                        <strong>Observação:</strong> {delivery.notes}
                      </p>
                    </div>
                  )}

                  {/* Botão Traçar Rota no GPS (usa lat/lng se disponível) */}
                  <Button
                    variant="outline"
                    className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      openGPS(delivery);
                    }}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Traçar Rota no GPS
                  </Button>

                  {!checkInStatus && !statusData?.checkInStatus && (
                    <div className="pt-2 border-t">
                      <Sheet>
                        <SheetTrigger asChild>
                          <button
                            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
                            onClick={() => setSelectedDelivery(delivery)}
                          >
                            Ações do Cliente
                          </button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-auto">
                          <SheetHeader>
                            <SheetTitle>{delivery.customerName}</SheetTitle>
                            <SheetDescription>
                              {delivery.address}
                            </SheetDescription>
                          </SheetHeader>
                          <div className="space-y-3 my-[24px] mx-[0px]">
                            <Button
                              className="w-full bg-blue-600 hover:bg-blue-700"
                              onClick={() => onCheckIn(delivery)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Fazer Check-in
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => onOpenPDV(delivery)}
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Abrir PDV
                            </Button>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  )}

                  {checkInStatus && (
                    <div className="pt-2 border-t">
                      <div className={`flex items-center justify-center p-3 rounded-lg ${checkInStatus.color}`}>
                        {(() => {
                          const StatusIcon = checkInStatus.icon;
                          return <StatusIcon className={`w-4 h-4 ${checkInStatus.textColor} mr-2`} />;
                        })()}
                        <span className={`text-sm font-medium ${checkInStatus.textColor}`}>
                          {checkInStatus.label}
                        </span>
                        {statusData?.hadSale && (
                          <span className="ml-2 text-xs">💰</span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}