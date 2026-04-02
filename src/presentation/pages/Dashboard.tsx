import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { Badge } from '../../shared/ui/badge';
import { MapPin, Clock, Package, Plus } from 'lucide-react';
// import { ImageWithFallback } from '../shared/figma/ImageWithFallback';

interface DashboardProps {
  onSelectDelivery: (delivery: any) => void;
  onAddCustomer: () => void;
}

export function Dashboard({ onSelectDelivery, onAddCustomer }: DashboardProps) {
  const deliveries = [
    {
      id: 1,
      customer: 'João Silva',
      address: 'Rua das Flores, 123 - Centro',
      time: '09:00',
      status: 'pending',
      items: ['Recarga Água com Gás 1,5 L'],
      contractType: 'Comodato Semanal',
      lastDelivery: '2024-01-17',
      distance: '1.2 km',
      priority: 'high',
      bottleType: '1,5 L',
      deliveryType: 'recarga'
    },
    {
      id: 2,
      customer: 'Maria Santos',
      address: 'Av. Principal, 456 - Bairro Alto',
      time: '10:30',
      status: 'pending',
      items: ['Entrega Vasilhame 10L + Água com Gás'],
      contractType: 'Novo Cliente',
      lastDelivery: null,
      distance: '2.8 km',
      priority: 'normal',
      bottleType: '10L',
      deliveryType: 'novo'
    },
    {
      id: 3,
      customer: 'Carlos Oliveira',
      address: 'Rua Nova, 789 - Vila Nova',
      time: '11:45',
      status: 'completed',
      items: ['Recarga Água com Gás 1,5 L'],
      contractType: 'Comodato Quinzenal',
      lastDelivery: '2024-01-03',
      distance: '0.8 km',
      priority: 'normal',
      bottleType: '1,5 L',
      deliveryType: 'recarga'
    },
    {
      id: 4,
      customer: 'Ana Costa',
      address: 'Rua da Paz, 321 - Jardim',
      time: '14:00',
      status: 'pending',
      items: ['Recarga Água com Gás 1,5 L'],
      contractType: 'Comodato Quinzenal',
      lastDelivery: '2024-01-10',
      distance: '3.1 km',
      priority: 'high',
      bottleType: '1,5 L',
      deliveryType: 'recarga'
    },
    {
      id: 5,
      customer: 'Roberto Lima',
      address: 'Rua do Comércio, 890 - Centro Comercial',
      time: '15:30',
      status: 'pending',
      items: ['Recarga Água com Gás 50L'],
      contractType: 'Comodato Comercial Semanal',
      lastDelivery: '2024-01-17',
      distance: '1.8 km',
      priority: 'high',
      bottleType: '50L',
      deliveryType: 'recarga'
    },
    {
      id: 6,
      customer: 'Luciana Ferreira',
      address: 'Rua das Palmeiras, 456 - Jardim Verde',
      time: '16:15',
      status: 'pending',
      items: ['Troca Vasilhame 1,5 L (Danificado)'],
      contractType: 'Comodato Semanal',
      lastDelivery: '2024-01-15',
      distance: '2.1 km',
      priority: 'normal',
      bottleType: '1,5 L',
      deliveryType: 'troca'
    }
  ];

  const pendingDeliveries = deliveries.filter(d => d.status === 'pending');
  const completedDeliveries = deliveries.filter(d => d.status === 'completed');

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Bom dia, Ricardo!</h1>
          <p className="text-muted-foreground">Você tem {pendingDeliveries.length} entregas pendentes hoje</p>
        </div>
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
          {/* <ImageWithFallback
            src="https://images.unsplash.com/photo-1569932353341-b518d82f8a54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxpdmVyeSUyMG1vdG9yY3ljbGUlMjByaWRlciUyMHVuaWZvcm18ZW58MXx8fHwxNzU4Njc5NTQ5fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Perfil"
            className="w-12 h-12 rounded-full object-cover"
          /> */}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl">{pendingDeliveries.length}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-xs text-orange-600">
                  {pendingDeliveries.filter(d => d.priority === 'high').length} urgentes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl">{completedDeliveries.length}</p>
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-xs text-green-600">Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offline Status */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-700">Modo Online - Dados sincronizados</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={onAddCustomer} className="w-full" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar Novo Cliente
          </Button>
        </CardContent>
      </Card>

      {/* Pending Deliveries */}
      <div className="space-y-4">
        <h2 className="text-xl">Entregas do Dia</h2>

        {pendingDeliveries.map((delivery, index) => (
          <Card key={delivery.id} className={`cursor-pointer hover:shadow-md transition-shadow ${delivery.priority === 'high' ? 'border-l-4 border-l-red-500' : ''
            }`} onClick={() => onSelectDelivery(delivery)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="secondary">{index + 1}</Badge>
                    <span className="font-medium">{delivery.customer}</span>
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      {delivery.time}
                    </Badge>
                    {delivery.priority === 'high' && (
                      <Badge variant="destructive" className="text-xs px-2">
                        Urgente
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {delivery.address}
                  </div>

                  <div className="space-y-1 mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-blue-600 font-medium">
                        {delivery.contractType}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {delivery.bottleType}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {delivery.items.join(', ')}
                    </div>
                    {delivery.lastDelivery && (
                      <div className="text-xs text-muted-foreground">
                        Última entrega: {new Date(delivery.lastDelivery).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                    {delivery.deliveryType === 'novo' && (
                      <div className="text-xs text-green-600 font-medium">
                        🆕 Primeiro vasilhame em comodato
                      </div>
                    )}
                    {delivery.deliveryType === 'troca' && (
                      <div className="text-xs text-orange-600 font-medium">
                        🔄 Troca de vasilhame
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-600">{delivery.distance}</span>
                    <Badge variant="outline">Pendente</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Completed Deliveries */}
        {completedDeliveries.length > 0 && (
          <>
            <h3 className="text-lg text-muted-foreground mt-6">Concluídas Hoje</h3>
            {completedDeliveries.map((delivery) => (
              <Card key={delivery.id} className="opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">{delivery.customer}</span>
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          {delivery.time}
                        </Badge>
                      </div>

                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        {delivery.address}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-600">{delivery.distance}</span>
                        <Badge className="bg-green-100 text-green-800">Concluída</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}