import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/card';
import { Button } from '../shared/ui/button';
import { Badge } from '../shared/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../shared/ui/sheet';
import { ArrowLeft, MapPin, Droplets, Phone, Clock, CheckCircle, ShoppingCart, UserX, AlertCircle, DollarSign, Calendar } from 'lucide-react';

import { Delivery, DeliveryStatusData } from '../domain/deliveries/models';

interface Route {
  id: string;
  name: string;
  zone: string;
  pendingDeliveries: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
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

  // Mock data das entregas da rota
  const deliveries: Delivery[] = [
    {
      id: 'del-001',
      orderId: 'PED-2024-001',
      orderCode: 'SCT001',
      customerName: 'João Silva',
      customerPhone: '(11) 99999-1234',
      address: 'Rua das Flores, 123 - Centro',
      bottles: { quantity: 3, size: '1,5 L' },
      status: 'pending',
      priority: 'high',
      estimatedTime: '09:00',
      routeName: 'Rota Centro',
      notes: 'Portão azul, interfone 23'
    },
    {
      id: 'del-002',
      orderId: 'PED-2024-002',
      orderCode: 'SCT002',
      customerName: 'Maria Santos',
      customerPhone: '(11) 99999-5678',
      address: 'Av. Principal, 456 - Centro',
      bottles: { quantity: 2, size: '1,5 L' },
      status: 'pending',
      priority: 'medium',
      estimatedTime: '09:30',
      routeName: 'Rota Centro'
    },
    {
      id: 'del-003',
      orderId: 'PED-2024-003',
      orderCode: 'SCT003',
      customerName: 'Carlos Oliveira',
      customerPhone: '(11) 99999-9012',
      address: 'Rua Nova, 789 - Centro',
      bottles: { quantity: 1, size: '10L' },
      status: 'completed',
      priority: 'low',
      estimatedTime: '10:00',
      routeName: 'Rota Centro'
    },
    {
      id: 'del-004',
      orderId: 'PED-2024-004',
      orderCode: 'SCT004',
      customerName: 'Ana Costa',
      customerPhone: '(11) 99999-3456',
      address: 'Rua da Paz, 321 - Centro',
      bottles: { quantity: 4, size: '1,5 L' },
      status: 'pending',
      priority: 'high',
      estimatedTime: '10:30',
      routeName: 'Rota Centro',
      notes: 'Entregar apenas pela manhã'
    },
    {
      id: 'del-005',
      orderId: 'PED-2024-005',
      orderCode: 'SCT005',
      customerName: 'Roberto Lima',
      customerPhone: '(11) 99999-7890',
      address: 'Rua do Comércio, 890 - Centro',
      bottles: { quantity: 6, size: '1,5 L' },
      status: 'pending',
      priority: 'medium',
      estimatedTime: '11:00',
      routeName: 'Rota Centro'
    }
  ];

  const pendingDeliveries = deliveries.filter(d => d.status === 'pending');
  const completedDeliveries = deliveries.filter(d => d.status === 'completed');

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b p-4 space-y-3 shadow-sm" style={{ borderColor: 'rgba(0, 128, 0, 0.1)' }}>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2 hover:bg-green-50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl" style={{ color: '#008000' }}>Rota: {route.name}</h1>
            <p className="text-sm text-muted-foreground">{route.zone}</p>
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
        {deliveries.map((delivery, index) => {
          const checkInStatus = getCheckInStatusInfo(delivery.id);
          const statusData = deliveryStatuses[delivery.id];

          return (
            <Card
              key={delivery.id}
              className={`hover:shadow-lg transition-all duration-200 border-2 ${checkInStatus ? checkInStatus.color : (delivery.status === 'completed' ? 'bg-green-50/50' : 'hover:scale-[1.01]')
                }`}
              style={{ borderColor: checkInStatus ? undefined : (delivery.status === 'completed' ? 'rgba(0, 128, 0, 0.2)' : 'rgba(0, 0, 0, 0.1)') }}
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
                            : (delivery.status === 'completed'
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
                      <span className="font-medium text-green-700">{route.name}</span>
                      <span>•</span>
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
                      {!checkInStatus && delivery.status === 'completed' && (
                        <CheckCircle className="w-4 h-4 ml-1" style={{ color: '#008000' }} />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1 items-end">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{delivery.estimatedTime}</span>
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
                  <span className="text-sm text-muted-foreground">{delivery.customerPhone}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">
                    {delivery.bottles.quantity} garrafas de {delivery.bottles.size}
                  </span>
                </div>

                {(delivery.notes && delivery.notes !== 'null' && delivery.notes.trim() !== '') && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                    <p className="text-sm text-yellow-800">
                      <strong>Observação:</strong> {delivery.notes}
                    </p>
                  </div>
                )}

                {/* Botão Traçar Rota Individual */}
                <Button
                  variant="outline"
                  className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    const query = encodeURIComponent(`${delivery.address}`);
                    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                  }}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Traçar Rota no GPS
                </Button>

                {!checkInStatus && delivery.status === 'pending' && (
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

                {!checkInStatus && delivery.status === 'completed' && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-center p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm text-green-700 font-medium">
                        Atendimento Concluído
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}