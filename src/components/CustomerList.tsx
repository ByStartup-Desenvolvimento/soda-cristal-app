import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/ui/card';
import { Button } from '../shared/ui/button';
import { Badge } from '../shared/ui/badge';
import { Input } from '../shared/ui/input';
import { Search, UserPlus, MapPin, Phone, Droplets, Users } from 'lucide-react';

interface CustomerListProps {
  onAddCustomer: () => void;
  onViewContracts?: () => void;
  onViewHistory?: (customer: any) => void;
}

export function CustomerList({ onAddCustomer, onViewContracts: _onViewContracts, onViewHistory }: CustomerListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data de clientes
  const customers = [
    {
      id: 1,
      name: 'João Silva',
      phone: '(11) 99999-1234',
      address: 'Rua das Flores, 123 - Centro',
      contractType: 'Comodato Semanal',
      bottleSize: '1,5 L',
      status: 'ativo',
      lastDelivery: '2024-01-17',
      nextDelivery: '2024-01-24'
    },
    {
      id: 2,
      name: 'Maria Santos',
      phone: '(11) 99999-5678',
      address: 'Av. Principal, 456 - Bairro Alto',
      contractType: 'Comodato Quinzenal',
      bottleSize: '10L',
      status: 'ativo',
      lastDelivery: '2024-01-10',
      nextDelivery: '2024-01-24'
    },
    {
      id: 3,
      name: 'Carlos Oliveira',
      phone: '(11) 99999-9012',
      address: 'Rua Nova, 789 - Vila Nova',
      contractType: 'Comodato Quinzenal',
      bottleSize: '1,5 L',
      status: 'ativo',
      lastDelivery: '2024-01-03',
      nextDelivery: '2024-01-17'
    },
    {
      id: 4,
      name: 'Ana Costa',
      phone: '(11) 99999-3456',
      address: 'Rua da Paz, 321 - Jardim',
      contractType: 'Venda Direta',
      bottleSize: '1,5 L',
      status: 'inativo',
      lastDelivery: '2024-01-10',
      nextDelivery: null
    },
    {
      id: 5,
      name: 'Roberto Lima',
      phone: '(11) 99999-7890',
      address: 'Rua do Comércio, 890 - Centro Comercial',
      contractType: 'Comodato Comercial',
      bottleSize: '50L',
      status: 'ativo',
      lastDelivery: '2024-01-15',
      nextDelivery: '2024-01-22'
    },
    {
      id: 6,
      name: 'Luciana Ferreira',
      phone: '(11) 99999-2468',
      address: 'Rua das Palmeiras, 456 - Jardim Verde',
      contractType: 'Comodato Semanal',
      bottleSize: '1,5 L',
      status: 'ativo',
      lastDelivery: '2024-01-15',
      nextDelivery: '2024-01-22'
    }
  ];

  const filteredCustomers = customers.filter(customer =>
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
    if (contractType.includes('Comodato')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    return 'bg-purple-100 text-purple-800 border-purple-200';
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {filteredCustomers.length} clientes encontrados
          </p>
        </div>
        <div className="flex space-x-2">
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
        {filteredCustomers.map((customer) => (
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
                    {new Date(customer.lastDelivery).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                {customer.nextDelivery && (
                  <div>
                    <p className="text-muted-foreground">Próxima entrega:</p>
                    <p className="font-medium text-blue-600">
                      {new Date(customer.nextDelivery).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>

              {customer.status === 'ativo' && customer.nextDelivery && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Água com Gás {customer.bottleSize}
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
              )}
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