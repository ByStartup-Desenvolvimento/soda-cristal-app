import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { Button } from '../../shared/ui/button';
import { Badge } from '../../shared/ui/badge';
import { Input } from '../../shared/ui/input';
import { Search, UserPlus, MapPin, Phone, Droplets, Users, RefreshCw } from 'lucide-react';
import { useClientesStore } from '../../domain/clientes/clienteStore';
import { formatPhone, formatAddress, mapStatusToLabel } from '../../shared/utils/formatters';
import { ApiDebugView } from '../components/ApiDebugView';

interface CustomerListProps {
  onAddCustomer: () => void;
  onViewContracts?: () => void;
  onViewHistory?: (customer: any) => void;
}

export function CustomerList({ onAddCustomer, onViewContracts: _onViewContracts, onViewHistory }: CustomerListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const { clientes, loadClientes, isLoading } = useClientesStore();

  useEffect(() => {
    // Carrega clientes ao montar. 
    // TODO: Obter ID do vendedor real do contexto de autenticação.
    const VENDEDOR_ID_MOCK = 1;
    loadClientes(VENDEDOR_ID_MOCK);
  }, [loadClientes]);

  // Mock data de clientes (Fallback)
  const mockCustomers = [
    {
      id: 9991,
      name: 'João Silva (Mock)',
      phone: '(11) 99999-1234',
      address: 'Rua das Flores, 123 - Centro',
      contractType: 'Comodato Semanal',
      bottleSize: '20L',
      status: 'ativo',
      lastDelivery: '2024-01-17',
      nextDelivery: '2024-01-24'
    },
    {
      id: 9992,
      name: 'Maria Santos (Mock)',
      phone: '(11) 99999-5678',
      address: 'Av. Principal, 456 - Bairro Alto',
      contractType: 'Comodato Quinzenal',
      bottleSize: '10L',
      status: 'ativo',
      lastDelivery: '2024-01-10',
      nextDelivery: '2024-01-24'
    },
    {
      id: 9993,
      name: 'Carlos Oliveira (Mock)',
      phone: '(11) 99999-9012',
      address: 'Rua Nova, 789 - Vila Nova',
      contractType: 'Comodato Quinzenal',
      bottleSize: '20L',
      status: 'ativo',
      lastDelivery: '2024-01-03',
      nextDelivery: '2024-01-17'
    }
  ];

  // Decide quais dados usar
  // Regra: Se a API não retornou clientes (length === 0), usa o Mock.
  const hasRealClients = clientes.length > 0;
  const rawData = hasRealClients ? clientes : mockCustomers;

  // Normaliza os dados para o formato da UI
  const displayCustomers = rawData.map(c => {
    // Verifica se é um cliente real (tem as props do model) ou mock (tem props da UI)
    const isReal = 'ativo' in c;

    if (isReal) {
      // Mapping Real -> UI
      // TODO: Ajustar model para garantir que campos existem ou formatters tratem undefined
      const realClient = c as any; // Cast rápido pois Model x UI tem divergências que estamos tratando aqui
      return {
        id: realClient.id,
        name: realClient.nome || realClient.razaosocial || 'Sem Nome',
        phone: formatPhone(realClient.fone || realClient.celular2),
        address: formatAddress(realClient.rua, realClient.numero, realClient.bairro),
        contractType: realClient.tipo_contrato || 'N/A',
        bottleSize: realClient.produto_preferido || 'N/A', // Usando produto preferido como 'tamanho' por enquanto
        status: mapStatusToLabel(realClient.ativo),
        lastDelivery: realClient.ultima_entrega,
        nextDelivery: realClient.proxima_entrega,
        original: realClient
      };
    } else {
      // Mock já está no formato UI
      return c;
    }
  });


  const filteredCustomers = displayCustomers.filter((customer: any) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inativo':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getContractColor = (contractType: string) => {
    if (contractType && contractType.includes('Comodato')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    return 'bg-purple-100 text-purple-800 border-purple-200';
  };



  return (
    <div className="p-4 space-y-4 pb-20">

      {/* Componente de Debug - Remover em Produção */}
      <ApiDebugView />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes {hasRealClients ? '(API)' : '(Mock)'}</h1>
          <p className="text-sm text-muted-foreground">
            {filteredCustomers.length} clientes encontrados
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={() => loadClientes(1)} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={onAddCustomer} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone ou endereço..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customers List */}
      <div className="space-y-3">
        {filteredCustomers.map((customer: any) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{customer.name}</CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{customer.phone}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Badge variant="outline" className={getStatusColor(customer.status)}>
                    {customer.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {customer.bottleSize}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{customer.address}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Droplets className="w-4 h-4 text-blue-500" />
                <Badge variant="outline" className={getContractColor(customer.contractType)}>
                  {customer.contractType}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Última entrega:</p>
                  <p className="font-medium">
                    {/* Valida se data existe para evitar erro de parse */}
                    {customer.lastDelivery && !isNaN(Date.parse(customer.lastDelivery))
                      ? new Date(customer.lastDelivery).toLocaleDateString('pt-BR')
                      : customer.lastDelivery || '-'}
                  </p>
                </div>

                {customer.nextDelivery && (
                  <div>
                    <p className="text-muted-foreground">Próxima entrega:</p>
                    <p className="font-medium text-blue-600">
                      {!isNaN(Date.parse(customer.nextDelivery))
                        ? new Date(customer.nextDelivery).toLocaleDateString('pt-BR')
                        : customer.nextDelivery}
                    </p>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {customer.bottleSize}
                  </span>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onViewHistory?.(customer)}>
                      Ver Histórico
                    </Button>
                    <Button variant="outline" size="sm" onClick={onAddCustomer}>
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <div className="space-y-2">
              <Users className="w-12 h-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium">Nenhum cliente encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Tente ajustar sua busca ou cadastre um novo cliente
              </p>
              <Button onClick={onAddCustomer} className="mt-4">
                <UserPlus className="w-4 h-4 mr-2" />
                Cadastrar Primeiro Cliente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}