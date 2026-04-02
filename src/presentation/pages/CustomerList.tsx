import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { Button } from '../../shared/ui/button';
import { Badge } from '../../shared/ui/badge';
import { Input } from '../../shared/ui/input';
import { Skeleton } from '../../shared/ui/skeleton';
import {
  Search, UserPlus, MapPin, Phone, Droplets, Users,
  Route, ChevronDown, ChevronUp, UserX, ShoppingCart,
  Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import { useRotas } from '../hooks/useRotas';
import { formatPhone } from '../../shared/utils/formatters';
import type { Rota, RotaEntregaCompleta } from '../../domain/rotas/models';

interface CustomerListProps {
  onAddCustomer: () => void;
  onViewContracts?: () => void;
  onViewHistory?: (customer: unknown) => void;
}

export function CustomerList({ onAddCustomer, onViewContracts: _onViewContracts, onViewHistory }: CustomerListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRouteId, setExpandedRouteId] = useState<number | null>(null);

  const {
    rotas,
    isLoading,
    isLoadingDeliveries,
    loadingProgress,
    error,
    reload,
    deliveriesPorRota
  } = useRotas();

  // --- Filtro em dois níveis ---
  const matchesSearch = (text: string | undefined | null): boolean => {
    if (!text || !searchTerm) return !searchTerm;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  };

  const clienteMatchesSearch = (cliente: RotaEntregaCompleta): boolean => {
    return (
      matchesSearch(cliente.cliente.nome) ||
      matchesSearch(cliente.cliente.celular) ||
      matchesSearch(cliente.cliente.celular2) ||
      matchesSearch(cliente.cliente.bairro) ||
      matchesSearch(cliente.cliente.rua) ||
      matchesSearch(`${cliente.cliente.rua}, ${cliente.cliente.numero} - ${cliente.cliente.bairro}`)
    );
  };

  const getActiveClientes = (rotaId: number) => {
    return (deliveriesPorRota[rotaId] || []).filter(c => c.cliente.ativo === 1);
  };

  const filteredRoutes = rotas.filter((rota: Rota) => {
    if (!searchTerm) return true;
    // Mostra a rota se o nome bate OU se contém clientes que batem
    if (matchesSearch(rota.nome) || matchesSearch(rota.frequencia)) return true;
    const clientes = getActiveClientes(rota.id);
    return clientes.some(clienteMatchesSearch);
  });

  const getFilteredClientes = (rotaId: number): RotaEntregaCompleta[] => {
    const clientes = getActiveClientes(rotaId);
    if (!searchTerm) return clientes;
    // Se o nome da rota já bate, mostra todos os clientes
    const rota = rotas.find(r => r.id === rotaId);
    if (rota && (matchesSearch(rota.nome) || matchesSearch(rota.frequencia))) {
      return clientes;
    }
    // Senão, filtra apenas os clientes que batem
    return clientes.filter(clienteMatchesSearch);
  };

  const totalClientes = filteredRoutes.reduce((sum, rota) => {
    return sum + getActiveClientes(rota.id).length;
  }, 0);

  const toggleRoute = (rotaId: number) => {
    setExpandedRouteId(prev => prev === rotaId ? null : rotaId);
  };

  const getStatusColor = (ativo: number) => {
    return ativo === 1
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getContractLabel = (cliente: RotaEntregaCompleta): string => {
    return cliente.cliente.observacao?.includes('Semanal')
      ? 'Comodato Semanal'
      : cliente.cliente.observacao?.includes('Quinzenal')
        ? 'Comodato Quinzenal'
        : 'Comodato';
  };

  const getProductLabel = (cliente: RotaEntregaCompleta): string => {
    if (cliente.cliente.cf_agua) return 'Água com Gás 1,5 L';
    if (cliente.cliente.cf_xarope) return 'Xarope de Cola';
    return `${cliente.rotaentrega.num_garrafas} garrafas`;
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="p-4 space-y-4 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  // --- Error State ---
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {filteredRoutes.length} rotas • {isLoadingDeliveries ? '...' : totalClientes} clientes
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={reload} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={onAddCustomer} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Progress Bar (carregando deliveries) */}
      {isLoadingDeliveries && loadingProgress && loadingProgress.total > 0 && (
        <Card className="border-green-200 bg-green-50 shadow-sm animate-in fade-in slide-in-from-top-4">
          <CardContent className="p-3">
            <div className="flex items-center space-x-3 mb-2">
              <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
              <p className="text-sm text-green-800 font-medium">
                Carregando clientes ({loadingProgress.current} de {loadingProgress.total} rotas)
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
          placeholder="Buscar por rota, nome, telefone ou endereço..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Routes List */}
      <div className="space-y-3">
        {filteredRoutes.map((rota) => {
          const isExpanded = expandedRouteId === rota.id;
          const clientes = getActiveClientes(rota.id);
          const clientesFiltrados = getFilteredClientes(rota.id);
          const clienteCount = clientes.length;

          return (
            <div key={rota.id} className="space-y-0">
              {/* Card da Rota */}
              <Card
                className={`cursor-pointer transition-all duration-200 border-2 hover:shadow-md ${isExpanded
                  ? 'border-green-400 shadow-md rounded-b-none'
                  : 'hover:scale-[1.01]'
                  }`}
                style={{
                  borderColor: isExpanded ? 'rgba(0, 128, 0, 0.4)' : 'rgba(0, 128, 0, 0.15)',
                }}
                onClick={() => toggleRoute(rota.id)}
              >
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md"
                        style={{ background: 'linear-gradient(135deg, #008000 0%, #00a000 100%)' }}
                      >
                        <Route className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{rota.nome}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {rota.frequencia || 'Sem frequência'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className="shadow-sm"
                        style={{ color: '#008000', borderColor: 'rgba(0, 128, 0, 0.3)' }}
                      >
                        {isLoadingDeliveries ? '...' : clienteCount} clientes
                      </Badge>
                      {isExpanded
                        ? <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        : <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      }
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Clientes da Rota (Expandido) */}
              {isExpanded && (
                <div
                  className="border-2 border-t-0 rounded-b-lg overflow-hidden"
                  style={{ borderColor: 'rgba(0, 128, 0, 0.4)' }}
                >
                  {clientesFiltrados.length === 0 ? (
                    <div className="p-6 text-center bg-gray-50">
                      <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {isLoadingDeliveries
                          ? 'Carregando clientes...'
                          : 'Nenhum cliente nesta rota'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {clientesFiltrados.map((item, index) => {
                        const { cliente, rotaentrega } = item;
                        const diasSemAtendimento = Number(item.diassematendimento) || 0;
                        const diasSemConsumo = Number(item.diassemconsumo) || 0;

                        return (
                          <div
                            key={rotaentrega.id}
                            className="p-4 bg-white hover:bg-gray-50 transition-colors"
                          >
                            {/* Header do Cliente */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white shadow-sm"
                                  style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)' }}
                                >
                                  {index + 1}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-base text-gray-800">
                                    {cliente.nome}
                                  </h3>
                                  <div className="flex items-center space-x-2 mt-0.5">
                                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                      {formatPhone(cliente.celular || cliente.celular2 || '')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-end flex-col items-end space-y-1">
                                <Badge variant="outline" className={getStatusColor(cliente.ativo)}>
                                  {cliente.ativo === 1 ? 'ativo' : 'inativo'}
                                </Badge>
                                {/* Dias sem atendimento / consumo */}
                                <div className="flex items-center space-x-1" title="Dias sem atendimento">
                                  <UserX className="w-3 h-3 text-red-400" />
                                  <span className="text-xs text-muted-foreground">
                                    {diasSemAtendimento} dias s/ atend.
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1" title="Dias sem consumo">
                                  <ShoppingCart className="w-3 h-3 text-yellow-500" />
                                  <span className="text-xs text-muted-foreground">
                                    {diasSemConsumo} dias s/ consumo
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Endereço */}
                            <div className="flex items-center space-x-2 mb-2 mt-10">
                              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm text-muted-foreground">
                                {cliente.rua}, {cliente.numero} - {cliente.bairro}
                              </span>
                            </div>

                            {/* Contrato + Produto */}
                            <div className="flex items-center space-x-2 mb-3">
                              <Droplets className="w-4 h-4 text-blue-500" />
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {getContractLabel(item)}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {getProductLabel(item)}
                              </Badge>
                            </div>

                            {/* Garrafas */}
                            <div className="flex items-center space-x-2 mb-3 text-sm">
                              <span className="text-muted-foreground">
                                {rotaentrega.num_garrafas} garrafas comodato
                                {rotaentrega.num_garrafas_comprada > 0 &&
                                  ` • ${rotaentrega.num_garrafas_comprada} compradas`
                                }
                              </span>
                            </div>

                            {/* Observação */}
                            {cliente.observacao && cliente.observacao !== 'null' && cliente.observacao.trim() !== '' && (
                              <div
                                className="border rounded-lg p-2 mb-3"
                                style={{ background: 'rgba(251, 191, 36, 0.08)', borderColor: 'rgba(251, 191, 36, 0.3)' }}
                              >
                                <p className="text-sm" style={{ color: '#92400e' }}>
                                  <strong>Obs:</strong> {cliente.observacao}
                                </p>
                              </div>
                            )}

                            {/* Ações */}
                            <div className="flex justify-end space-x-2 pt-2 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewHistory?.({
                                    id: cliente.id,
                                    name: cliente.nome,
                                    phone: formatPhone(cliente.celular || cliente.celular2 || ''),
                                    address: `${cliente.rua}, ${cliente.numero} - ${cliente.bairro}`,
                                    original: cliente,
                                  });
                                }}
                              >
                                Ver Histórico
                              </Button>
                              {/* <Button className="!hidden"
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddCustomer();
                                }}
                              >
                                Editar
                              </Button> */}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredRoutes.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <div className="space-y-2">
              <Users className="w-12 h-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium">Nenhuma rota encontrada</h3>
              <p className="text-sm text-muted-foreground">
                Tente ajustar sua busca ou cadastre um novo cliente
              </p>
              <Button onClick={onAddCustomer} className="mt-4">
                <UserPlus className="w-4 h-4 mr-2" />
                Cadastrar Novo Cliente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}