import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { Badge } from '../../shared/ui/badge';
import { Input } from '../../shared/ui/input';
import { Button } from '../../shared/ui/button';
import { Skeleton } from '../../shared/ui/skeleton';
import { Search, MapPin, Route, AlertCircle, RefreshCw } from 'lucide-react';
import { useRotas } from '../hooks/useRotas';
import { Rota } from '../../domain/rotas/models';
import { useRotasStore } from '../../domain/rotas/rotasStore';

interface RouteUI extends Rota {
  pendingDeliveries?: number; // Optional since API doesn't provide it directly in list
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
}

interface RoutesScreenProps {
  onSelectRoute: (route: any) => void;
}

export function RoutesScreen({ onSelectRoute }: RoutesScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { rotas, isLoading, error, reload } = useRotas();
  const { selectRota } = useRotasStore();

  // Adapter para converter Rota do domínio para o formato UI
  const mappedRoutes: RouteUI[] = rotas.map(rota => ({
    ...rota,
    // pendingDeliveries: 0, // Não temos contagem sem carregar clientes
    status: rota.checkin_fechado === 1 ? 'completed' : 'pending',
    priority: 'medium', // Default, já que prioridade é por cliente, não por rota (exceto se derivado)
  }));

  const displayRoutes = mappedRoutes.sort((a, b) => {
    // 1. Status: Pendente/Em Andamento antes de Concluído
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    if (a.status === 'completed' && b.status !== 'completed') return 1;

    // 2. Ordem alfabética ou Numérica (caso o nome seja número)
    return a.nome.localeCompare(b.nome, undefined, { numeric: true });
  });

  const filteredRoutes = displayRoutes.filter(route =>
    route.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (route.frequencia && route.frequencia.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
      <div className="p-4 space-y-4 pb-20">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
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
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Rotas Disponíveis</h1>
        <p className="text-sm text-muted-foreground">
          {filteredRoutes.filter(r => r.status === 'pending').length} rotas pendentes
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome da rota..."
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
                    {route.nome}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{route.frequencia || 'Sem frequência definida'}</span>
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

      {filteredRoutes.length === 0 && (
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
      )}
    </div>
  );
}