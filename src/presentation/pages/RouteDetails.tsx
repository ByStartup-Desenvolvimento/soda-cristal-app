import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { Button } from '../../shared/ui/button';
import { Badge } from '../../shared/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../../shared/ui/sheet';
import { Skeleton } from '../../shared/ui/skeleton';
import { ArrowLeft, MapPin, Droplets, Phone, CheckCircle, ShoppingCart, UserX, AlertCircle, DollarSign, Calendar, Search, Filter, X, Edit, MessageCircle } from 'lucide-react';
import { Input } from '../../shared/ui/input';
import { ClienteEditSheet } from '../components/ClienteEditSheet';
import { ClienteDesativarSheet } from '../components/ClienteDesativarSheet';
import { CheckInDescarteSheet } from '../components/CheckInDescarteSheet';
import { formatPhone, formatApiDate } from '@/shared/utils/formatters';

import { Delivery, DeliveryStatusData } from '../../domain/deliveries/models';
import { useRotasStore } from '../../domain/rotas/rotasStore';
import { rotasService } from '../../domain/rotas/services';
import { RotaEntregaCompleta, PrioridadeCliente } from '../../domain/rotas/models';

interface FiltrosEstrategicos {
  periodo15a29: boolean;
  periodo30mais: boolean;
  semAtendimento: boolean;
  semConsumo: boolean;
}

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
  const [searchTerm, setSearchTerm] = useState('');
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [clienteParaEditar, setClienteParaEditar] = useState<RotaEntregaCompleta | null>(null);
  const [desativarSheetOpen, setDesativarSheetOpen] = useState(false);
  const [clienteParaDesativar, setClienteParaDesativar] = useState<RotaEntregaCompleta | null>(null);
  const [filtrosAberto, setFiltrosAberto] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosEstrategicos>({
    periodo15a29: false,
    periodo30mais: false,
    semAtendimento: false,
    semConsumo: false,
  });
  const [descarteSheetOpen, setDescarteSheetOpen] = useState(false);
  const [deliveryParaDescartar, setDeliveryParaDescartar] = useState<Delivery | null>(null);
  const { loadClientesRota, clientesRota, isLoading } = useRotasStore();
  console.log(clientesRota);

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
      clienteId: item.cliente.id,
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
      diasSemAtendimento: Number(item.diassematendimento) || 0,
      diasSemConsumo: Number(item.diassemconsumo) || 0,
    };
  };

  const deliveries = useMemo(() => {
    if (route?.deliveries && route.deliveries.length > 0) {
      return route.deliveries;
    }
    // Filtra somente clientes ativos (ativo === 1)
    return clientesRota
      .filter(item => item.cliente.ativo === 1)
      .map(mapClienteToDelivery);
  }, [route?.deliveries, clientesRota]);

  const filtrosAtivosCount = useMemo(() => {
    return Object.values(filtros).filter(Boolean).length;
  }, [filtros]);

  const toggleFiltro = (key: keyof FiltrosEstrategicos) => {
    setFiltros(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const limparFiltros = () => {
    setFiltros({
      periodo15a29: false,
      periodo30mais: false,
      semAtendimento: false,
      semConsumo: false,
    });
  };

  // Busca avançada + filtros estratégicos
  const filteredDeliveries = useMemo(() => {
    let resultado = deliveries;

    // Filtro de busca por texto
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      resultado = resultado.filter(d =>
        d.customerName.toLowerCase().includes(term) ||
        d.address.toLowerCase().includes(term)
      );
    }

    // Filtros estratégicos
    const temFiltroAtivo = Object.values(filtros).some(Boolean);
    if (temFiltroAtivo) {
      resultado = resultado.filter(d => {
        const dias = d.diasSemAtendimento ?? 0;
        const consumo = d.diasSemConsumo ?? 0;

        if (filtros.periodo15a29 && dias >= 15 && dias <= 29) return true;
        if (filtros.periodo30mais && dias >= 30) return true;
        if (filtros.semAtendimento && dias > 0) return true;
        if (filtros.semConsumo && consumo > 0) return true;

        return false;
      });
    }

    return resultado;
  }, [deliveries, searchTerm, filtros]);

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
  const pendingDeliveries = filteredDeliveries.filter(d => !deliveryStatuses[d.id]?.checkInStatus);
  const completedDeliveries = filteredDeliveries.filter(d => !!deliveryStatuses[d.id]?.checkInStatus);

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

  const handleWhatsApp = (phone: string) => {
    if (!phone) return;
    // Remove tudo que não é dígito
    const cleanPhone = phone.replace(/\D/g, '');
    // Garante que tem o DDI 55 (Brasil) se não tiver
    const withCountryCode = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${withCountryCode}`, '_blank');
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

        {/* Busca Avançada + Filtros */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, rua ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Sheet open={filtrosAberto} onOpenChange={setFiltrosAberto}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="relative shrink-0"
              >
                <Filter className="w-4 h-4" />
                {filtrosAtivosCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                    {filtrosAtivosCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto">
              <SheetHeader>
                <SheetTitle>Filtros Estratégicos</SheetTitle>
                <SheetDescription>
                  Identifique clientes que precisam de atenção
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 my-6">
                {/* Grupo: Por período sem atendimento */}
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Por período sem atendimento</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={filtros.periodo15a29}
                        onChange={() => toggleFiltro('periodo15a29')}
                        className="w-4 h-4 rounded accent-orange-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium">15 a 29 dias</span>
                        <p className="text-xs text-muted-foreground">Clientes com atenção moderada</p>
                      </div>
                      <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">Atenção</Badge>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={filtros.periodo30mais}
                        onChange={() => toggleFiltro('periodo30mais')}
                        className="w-4 h-4 rounded accent-red-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium">30+ dias</span>
                        <p className="text-xs text-muted-foreground">Clientes em risco de churn</p>
                      </div>
                      <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">Crítico</Badge>
                    </label>
                  </div>
                </div>

                {/* Grupo: Por comportamento */}
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Por comportamento</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={filtros.semAtendimento}
                        onChange={() => toggleFiltro('semAtendimento')}
                        className="w-4 h-4 rounded accent-blue-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium">Sem atendimento</span>
                        <p className="text-xs text-muted-foreground">Pelo menos 1 dia sem atendimento</p>
                      </div>
                      <UserX className="w-4 h-4 text-red-400" />
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={filtros.semConsumo}
                        onChange={() => toggleFiltro('semConsumo')}
                        className="w-4 h-4 rounded accent-yellow-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium">Sem consumo</span>
                        <p className="text-xs text-muted-foreground">Pelo menos 1 dia sem consumo registrado</p>
                      </div>
                      <ShoppingCart className="w-4 h-4 text-yellow-500" />
                    </label>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={limparFiltros}
                    disabled={filtrosAtivosCount === 0}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Limpar
                  </Button>
                  <Button
                    className="flex-1"
                    style={{ backgroundColor: '#008000' }}
                    onClick={() => setFiltrosAberto(false)}
                  >
                    <Filter className="w-4 h-4 mr-1" />
                    Aplicar ({filtrosAtivosCount})
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Indicador de filtros ativos */}
        {filtrosAtivosCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Filtros:</span>
            {filtros.periodo15a29 && (
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 cursor-pointer" onClick={() => toggleFiltro('periodo15a29')}>
                15-29 dias <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filtros.periodo30mais && (
              <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 cursor-pointer" onClick={() => toggleFiltro('periodo30mais')}>
                30+ dias <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filtros.semAtendimento && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 cursor-pointer" onClick={() => toggleFiltro('semAtendimento')}>
                Sem atendimento <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filtros.semConsumo && (
              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 cursor-pointer" onClick={() => toggleFiltro('semConsumo')}>
                Sem consumo <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            <button className="text-xs text-red-500 hover:underline" onClick={limparFiltros}>
              Limpar todos
            </button>
          </div>
        )}
      </div>

      {/* Deliveries List */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-3">
        {filteredDeliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-16">
            <MapPin className="w-12 h-12 text-gray-300" />
            <p className="text-muted-foreground">Nenhum cliente nesta rota.</p>
            <Button variant="outline" onClick={onBack}>Voltar</Button>
          </div>
        ) : (
          filteredDeliveries.map((delivery, index) => {
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
                        <span className="text-xs text-muted-foreground">{delivery.diasSemAtendimento ?? 0} dias s/ atendimento</span>
                      </div>
                      <div className="flex items-center space-x-1" title="Dias sem consumo">
                        <ShoppingCart className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-muted-foreground">{delivery.diasSemConsumo ?? 0} dias s/ consumo</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{delivery.address}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{formatPhone(delivery.customerPhone)}</span>
                    </div>
                    {delivery.customerPhone && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWhatsApp(delivery.customerPhone);
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        <span className="text-xs">WhatsApp</span>
                      </Button>
                    )}
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
                        <SheetContent side="bottom" className="h-auto p-4">
                          <SheetHeader>
                            <SheetTitle>{delivery.customerName}</SheetTitle>
                            <SheetDescription>
                              {delivery.address}
                            </SheetDescription>
                          </SheetHeader>
                          <div className="space-y-3 my-[24px] mx-10">
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
                            <Button
                              variant="outline"
                              className="w-full text-green-700 border-green-300 hover:bg-green-50"
                              onClick={() => handleWhatsApp(delivery.customerPhone)}
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Enviar WhatsApp
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full text-amber-700 border-amber-300 hover:bg-amber-50"
                              onClick={() => {
                                const original = clientesRota.find(c => c.cliente.id === delivery.clienteId);
                                if (original) {
                                  setClienteParaEditar(original);
                                  setEditSheetOpen(true);
                                }
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Editar Cliente
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full text-red-700 border-red-300 hover:bg-red-50"
                              onClick={() => {
                                const original = clientesRota.find(c => c.cliente.id === delivery.clienteId);
                                if (original) {
                                  setClienteParaDesativar(original);
                                  setDesativarSheetOpen(true);
                                }
                              }}
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Desativar Cliente
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeliveryParaDescartar(delivery);
                            setDescarteSheetOpen(true);
                          }}
                        >
                          Descartar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Sheet de Edição de Cliente (R4) */}
      <ClienteEditSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        cliente={clienteParaEditar}
        onSaved={() => loadClientesRota(Number(route.id))}
      />

      {/* Sheet de Desativação de Cliente (R5) */}
      <ClienteDesativarSheet
        open={desativarSheetOpen}
        onOpenChange={setDesativarSheetOpen}
        cliente={clienteParaDesativar}
        onSaved={() => loadClientesRota(Number(route.id))}
      />

      {/* Sheet de Descarte de Check-in */}
      <CheckInDescarteSheet
        open={descarteSheetOpen}
        onOpenChange={setDescarteSheetOpen}
        deliveryId={deliveryParaDescartar?.id || ''}
        clienteId={deliveryParaDescartar?.clienteId || 0}
        customerName={deliveryParaDescartar?.customerName || ''}
        onDiscarded={() => loadClientesRota(Number(route.id))}
      />
    </div>
  );
}