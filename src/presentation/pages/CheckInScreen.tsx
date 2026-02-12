import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card';
import { Button } from '../../shared/ui/button';
import { Badge } from '../../shared/ui/badge';
import { ArrowLeft, MapPin, Clock, CheckCircle, Navigation, Wifi, AlertCircle, ShoppingCart, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { checkInService } from '../../domain/checkin/services';
import { CheckInStatus } from '../../domain/deliveries/models';
import { formatApiDate } from '../../shared/utils/formatters';

interface CheckInRecord {
  id: string;
  timestamp: string;
  location: string;
  address: string;
  customerName?: string;
  status?: string;
  hadSale?: boolean;
}

interface CheckInScreenProps {
  delivery?: any;
  onBack: () => void;
  onCheckInComplete?: (delivery: any, status: CheckInStatus, hadSale: boolean) => void;
}

export function CheckInScreen({ delivery, onBack, onCheckInComplete }: CheckInScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('Aguardando localização...');
  const [lastCheckIns, setLastCheckIns] = useState<CheckInRecord[]>([]);
  const [showStatusSelection, setShowStatusSelection] = useState(false);
  const [showSaleDecision, setShowSaleDecision] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<CheckInStatus | null>(null);

  // Mock data dos últimos check-ins
  useEffect(() => {
    setLastCheckIns([
      {
        id: 'checkin-005',
        timestamp: '2024-01-24 14:30:22',
        location: '-23.5505, -46.6333',
        address: 'Rua do Comércio, 890 - Centro',
        customerName: 'Roberto Lima',
        status: 'delivered',
        hadSale: true
      },
      {
        id: 'checkin-004',
        timestamp: '2024-01-24 13:45:15',
        location: '-23.5489, -46.6388',
        address: 'Rua da Paz, 321 - Centro',
        customerName: 'Ana Costa',
        status: 'no-sale',
        hadSale: false
      },
      {
        id: 'checkin-003',
        timestamp: '2024-01-24 13:15:08',
        location: '-23.5501, -46.6401',
        address: 'Rua Nova, 789 - Centro',
        customerName: 'Carlos Oliveira',
        status: 'absent-return',
        hadSale: false
      },
      {
        id: 'checkin-002',
        timestamp: '2024-01-24 12:30:45',
        location: '-23.5495, -46.6350',
        address: 'Av. Principal, 456 - Centro',
        customerName: 'Maria Santos',
        status: 'delivered',
        hadSale: true
      },
      {
        id: 'checkin-001',
        timestamp: '2024-01-24 11:45:12',
        location: '-23.5521, -46.6369',
        address: 'Rua das Flores, 123 - Centro',
        customerName: 'João Silva',
        status: 'delivered',
        hadSale: true
      }
    ]);

    // Simulate getting current location
    setTimeout(() => {
      setCurrentLocation('-23.5505, -46.6333');
    }, 2000);
  }, []);

  const handleCheckIn = async () => {
    if (!delivery?.id) {
      toast.error('Dados da entrega incompletos.');
      return;
    }

    setIsLoading(true);

    try {
      const vendedorIdStr = localStorage.getItem('vendedorId');
      if (!vendedorIdStr) {
        toast.error('Sessão inválida. Faça login novamente.');
        return;
      }

      const vendedorId = parseInt(vendedorIdStr);
      const rotaEntregaId = parseInt(delivery.id.replace('del-', ''));
      const [lat, lng] = currentLocation.split(', ');
      const nowFormatted = formatApiDate(new Date());

      // Registro de presença (check-in inicial)
      await checkInService.registrarPresenca(vendedorId, rotaEntregaId, nowFormatted, lat, lng);

      // Show status selection screen
      setShowStatusSelection(true);

    } catch (error) {
      toast.error('Erro ao realizar check-in. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusSelection = (status: CheckInStatus) => {
    if (status === 'delivered' || status === 'no-sale') {
      setSelectedStatus(status);
      setShowSaleDecision(true);
    } else {
      // For absent statuses, finish immediately without sale
      finishCheckIn(status, false);
    }
  };

  const finishCheckIn = async (status: CheckInStatus, hasSale: boolean) => {
    setIsLoading(true);
    try {
      const vendedorIdStr = localStorage.getItem('vendedorId');
      if (!vendedorIdStr) throw new Error('Vendedor não encontrado');

      const [lat, lng] = currentLocation.split(', ');
      const rotaEntregaId = parseInt(delivery?.id.replace('del-', '') || '0');
      const nowFormatted = formatApiDate(new Date());

      const statusLabels: Record<string, string> = {
        'delivered': 'Entregue',
        'no-sale': 'Não quis consumir',
        'absent-return': 'Ausente - Retornar',
        'absent-no-return': 'Ausente - Não retornar'
      };

      await checkInService.realizarCheckIn({
        rota_entrega: rotaEntregaId,
        data_checkin: nowFormatted,
        vendedor: parseInt(vendedorIdStr),
        observacao: statusLabels[status] || status,
        dentro_raio: true,
        latitude: lat,
        longitude: lng,
        quantidade_garrafas: delivery?.bottles?.quantity || 0,
        quantidade_vendida: status === 'delivered' ? (delivery?.bottles?.quantity || 1) : 0,
        teve_venda: hasSale
      });

      const now = new Date();
      const newCheckIn: CheckInRecord = {
        id: `checkin-${Date.now()}`,
        timestamp: now.toLocaleString('pt-BR'),
        location: currentLocation,
        address: delivery?.address || 'Localização atual',
        customerName: delivery?.customerName,
        status: status,
        hadSale: hasSale
      };

      setLastCheckIns(prev => [newCheckIn, ...prev.slice(0, 4)]);

      const statusMessages = {
        'delivered': 'Entrega realizada com sucesso!',
        'no-sale': 'Cliente não quis consumir',
        'absent-return': 'Cliente ausente - Retornar',
        'absent-no-return': 'Cliente ausente - Não retornar'
      };

      if (!hasSale) {
        toast.success(
          <div>
            <p><strong>{statusMessages[status]}</strong></p>
            <p>Localização: {currentLocation}</p>
            <p>Horário: {now.toLocaleString('pt-BR')}</p>
          </div>
        );
      }

      if (onCheckInComplete && delivery) {
        onCheckInComplete(delivery, status, hasSale);
      }
    } catch (error) {
      toast.error('Erro ao finalizar atendimento.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaleDecision = (hasSale: boolean) => {
    if (!selectedStatus) return;
    finishCheckIn(selectedStatus, hasSale);
  };

  const getStatusInfo = (status?: string) => {
    switch (status) {
      case 'delivered':
        return { color: 'bg-green-100 text-green-800 border-green-300', label: 'Entregue', icon: CheckCircle };
      case 'no-sale':
        return { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Não quis consumir', icon: UserX };
      case 'absent-return':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Ausente - Retornar', icon: AlertCircle };
      case 'absent-no-return':
        return { color: 'bg-red-100 text-red-800 border-red-300', label: 'Ausente - Não retornar', icon: UserX };
      default:
        return { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Check-in', icon: CheckCircle };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp.replace(' ', 'T'));
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (showSaleDecision) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="bg-white border-b border-border p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSaleDecision(false)}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-green-800">Realizar Venda?</h1>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Deseja registrar uma venda?</h2>
            <p className="text-muted-foreground">
              Aproveite o atendimento para registrar novos produtos vendidos.
            </p>
          </div>

          <Button
            onClick={() => handleSaleDecision(true)}
            className="w-full h-20 text-lg bg-green-600 hover:bg-green-700 shadow-lg flex items-center justify-center gap-3"
          >
            <ShoppingCart className="w-8 h-8" />
            <span>Sim, Ir para PDV</span>
          </Button>

          <Button
            onClick={() => handleSaleDecision(false)}
            variant="outline"
            className="w-full h-16 text-lg border-2 flex items-center justify-center gap-3"
          >
            <CheckCircle className="w-6 h-6" />
            <span>Não, Finalizar Atendimento</span>
          </Button>
        </div>
      </div>
    );
  }

  if (showStatusSelection) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-b from-green-50 to-white">
        {/* Header */}
        <div className="bg-white border-b border-border p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStatusSelection(false)}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-green-800">Status do Atendimento</h1>
              {delivery && (
                <p className="text-sm text-muted-foreground">
                  {delivery.customerName}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
          {/* Status Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground px-1">
              Selecione o status do atendimento:
            </h3>

            {/* Entregue */}
            <button
              onClick={() => handleStatusSelection('delivered')}
              className="w-full p-5 bg-white border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-green-800">Entregue</h4>
                  <p className="text-sm text-green-600">Produto entregue com sucesso</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
            </button>

            {/* Cliente não quis consumir */}
            <button
              onClick={() => handleStatusSelection('no-sale')}
              className="w-full p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <UserX className="w-7 h-7 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-gray-800">Cliente não quis consumir</h4>
                  <p className="text-sm text-gray-600">Cliente recusou o produto</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              </div>
            </button>

            {/* Ausente - Retornar */}
            <button
              onClick={() => handleStatusSelection('absent-return')}
              className="w-full p-5 bg-white border-2 border-yellow-200 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-7 h-7 text-yellow-600" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-yellow-800">Ausente - Retornar</h4>
                  <p className="text-sm text-yellow-600">Cliente ausente, retornar depois</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              </div>
            </button>

            {/* Ausente - Não retornar */}
            <button
              onClick={() => handleStatusSelection('absent-no-return')}
              className="w-full p-5 bg-white border-2 border-red-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <UserX className="w-7 h-7 text-red-600" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-red-800">Ausente - Não retornar</h4>
                  <p className="text-sm text-red-600">Cliente ausente, não retornar</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b border-border p-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Check-in</h1>
            {delivery && (
              <p className="text-sm text-muted-foreground">
                {delivery.customerName} • {delivery.address}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Map Section */}
        <div className="p-4 h-[60vh] min-h-[400px]">
          <Card className="h-full shadow-md">
            <CardContent className="p-0 h-full flex flex-col">
              {/* Map Placeholder */}
              <div className="flex-1 bg-gradient-to-br from-blue-100 to-blue-200 rounded-t-lg flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                      <Navigation className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-blue-800">Sua Localização Atual</p>
                    <div className="flex items-center justify-center space-x-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-600 font-mono">
                        {currentLocation}
                      </p>
                    </div>
                    <div className="flex items-center justify-center space-x-1">
                      <Wifi className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">GPS Conectado</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Check-in Button */}
              <div className="p-4 border-t bg-white rounded-b-lg">
                <Button
                  onClick={handleCheckIn}
                  disabled={isLoading || currentLocation === 'Aguardando localização...'}
                  className="w-full h-14 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md text-lg font-semibold"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Enviando Check-in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>Enviar Check-in</span>
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Check-in History */}
        <div className="p-4 pb-20 bg-gray-50">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Últimos Check-ins
              </CardTitle>
              <CardDescription>
                Histórico dos últimos 5 check-ins realizados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {lastCheckIns.length === 0 ? (
                <div className="text-center py-4">
                  <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum check-in realizado ainda
                  </p>
                </div>
              ) : (
                lastCheckIns.map((checkIn, index) => {
                  const { date, time } = formatTimestamp(checkIn.timestamp);
                  const statusInfo = getStatusInfo(checkIn.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div
                      key={checkIn.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border-2 ${statusInfo.color} transition-all`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index === 0 ? 'ring-2 ring-offset-2 ring-green-400' : ''
                        }`}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">
                              {checkIn.customerName || 'Check-in Geral'}
                            </p>
                            {checkIn.hadSale && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-300">
                                💰 Venda
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">{date}</p>
                            <p className="text-xs font-medium">{time}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-xs ${statusInfo.color} border-0`}>
                          {statusInfo.label}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{checkIn.address}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
