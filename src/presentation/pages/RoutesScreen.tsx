import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { Badge } from '../../shared/ui/badge';
import { Input } from '../../shared/ui/input';
import { Button } from '../../shared/ui/button';
import { Search, MapPin, Route, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useRotas } from '../hooks/useRotas';
import { Rota } from '../../domain/rotas/models';
import { useRotasStore } from '../../domain/rotas/rotasStore';
import type { RotaEntregaCompleta } from '../../domain/rotas/models';

interface RouteUI extends Rota {
  pendingDeliveries: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  zone: string;
}

interface RoutesScreenProps {
  onSelectRoute: (route: any) => void;
}

/**
 * Extrai a zona predominante (bairro mais frequente) dos clientes de uma rota
 */
function getZoneFromDeliveries(deliveries: RotaEntregaCompleta[]): string {
  if (deliveries.length === 0) return '';

  const bairroCount: Record<string, number> = {};
  for (const d of deliveries) {
    const bairro = d.cliente.bairro?.trim();
    if (bairro) {
      bairroCount[bairro] = (bairroCount[bairro] || 0) + 1;
    }
  }

  const sorted = Object.entries(bairroCount).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : '';
}

export function RoutesScreen({ onSelectRoute }: RoutesScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { rotas, isLoading, isLoadingDeliveries, loadingProgress, error, reload, deliveriesPorRota } = useRotas();
  const { selectRota } = useRotasStore();
  console.log(rotas);

  // Adapter para converter Rota do domínio para o formato UI
  const mappedRoutes: RouteUI[] = rotas.map(rota => {
    const deliveries = deliveriesPorRota[rota.id] || [];
    const zone = getZoneFromDeliveries(deliveries);


    return {
      ...rota,
      pendingDeliveries: deliveries.length,
      status: 'pending', // Forçar todas as rotas como pendentes para liberar o botão de detalhes
      priority: 'medium',
      zone,
    };
  });

  const displayRoutes = mappedRoutes.sort((a, b) => {
    // 1. Status: Pendente/Em Andamento antes de Concluído
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    if (a.status === 'completed' && b.status !== 'completed') return 1;

    // 2. Ordem alfabética ou Numérica
    return a.nome.localeCompare(b.nome, undefined, { numeric: true });
  });

  const filteredRoutes = displayRoutes.filter(route =>
    route.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (route.frequencia && route.frequencia.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (route.zone && route.zone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Contadores globais
  const totalPendingRoutes = filteredRoutes.filter(r => r.status === 'pending').length;
  const totalDeliveries = filteredRoutes.reduce((sum, r) => sum + r.pendingDeliveries, 0);

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

  if (isLoading) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-20 animate-pulse" />
          <Loader2 className="w-16 h-16 text-green-600 animate-spin relative" />
        </div>

        <div className="space-y-4 max-w-[250px] w-full">
          <h2 className="text-xl font-semibold text-gray-900">
            Buscando rotas...
          </h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Erro ao carregar rotas</h2>
        <p className="text-gray-500 max-w-xs">{error}</p>
        <Button onClick={reload} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Rotas Disponíveis</h1>
          <p className="text-sm text-muted-foreground">
            {totalPendingRoutes} rotas pendentes • {totalDeliveries} entregas totais
          </p>
        </div>
        <Button 
          onClick={reload} 
          variant="outline" 
          size="sm"
          className="gap-2 shrink-0 border-green-200 text-green-700 hover:bg-green-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Sincronizar
        </Button>
      </div>

      {/* Progress Bar Inline (Non-blocking) */}
      {isLoadingDeliveries && loadingProgress && loadingProgress.total > 0 && (
        <Card className="border-green-200 bg-green-50 shadow-sm animate-in fade-in slide-in-from-top-4">
          <CardContent className="p-3">
            <div className="flex items-center space-x-3 mb-2">
              <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
              <p className="text-sm text-green-800 font-medium">
                Sincronizando entregas ({loadingProgress.current} de {loadingProgress.total})
              </p>
            </div>
            <div className="h-2 w-full bg-green-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300 ease-out"
                style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome da rota ou zona..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Routes List */}
      <div className="space-y-3">
        {filteredRoutes.map((route) => (
          <Card
            key={route.id}
            className={`hover:shadow-lg transition-all duration-200 cursor-pointer border-2 ${route.status === 'completed' ? 'opacity-75' : 'hover:scale-[1.01]'
              }`}
            style={{ borderColor: route.status === 'completed' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 128, 0, 0.15)' }}
            onClick={() => {
              if (route.status !== 'completed') {
                selectRota(route.id);
                onSelectRoute(route);
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
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md"
                  style={{ background: 'linear-gradient(135deg, #008000 0%, #00a000 100%)' }}
                >
                  {isLoadingDeliveries ? '...' : route.pendingDeliveries}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {isLoadingDeliveries
                    ? 'Carregando entregas...'
                    : `${route.pendingDeliveries} entregas pendentes`
                  }
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
                      onSelectRoute(route);
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
                      onSelectRoute(route);
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
        ))}
      </div>

      {
        filteredRoutes.length === 0 && (
          <Card className="text-center py-8">
            <CardContent>
              <div className="space-y-2">
                <Route className="w-12 h-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-medium">Nenhuma rota encontrada</h3>
                <p className="text-sm text-muted-foreground">
                  Tente ajustar sua busca ou aguarde novas rotas serem disponibilizadas
                </p>
              </div>
            </CardContent>
          </Card>
        )
      }
    </div >
  );
}