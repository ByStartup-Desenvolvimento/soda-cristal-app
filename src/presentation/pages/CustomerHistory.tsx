import { useState, useEffect } from 'react';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardHeader } from '../../shared/ui/card';
import { Badge } from '../../shared/ui/badge';
import { ArrowLeft, Calendar, Package, DollarSign, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { vendasService } from '../../domain/vendas/services';
import { useUserStore } from '../../domain/auth/userStore';
import { Venda } from '../../domain/vendas/model';

interface CustomerHistoryProps {
  customer: any;
  onBack: () => void;
}

export function CustomerHistory({ customer, onBack }: CustomerHistoryProps) {
  const [history, setHistory] = useState<Venda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const vendedorId = useUserStore(state => state.vendedorId);

  useEffect(() => {
    const loadHistory = async () => {
      if (!vendedorId || !customer?.id) return;

      try {
        // Busca todas as vendas do vendedor
        // Idealmente, a API deveria ter um endpoint /vendas/cliente/{clienteId}
        // Mas vamos usar o que temos e filtrar no front por enquanto
        const vendas = await vendasService.getVendasVendedor(vendedorId);

        // Filtrar apenas deste cliente
        const vendasCliente = vendas.filter(v => v.cliente_id === customer.id);

        // Ordenar por data (mais recente primeiro)
        vendasCliente.sort((a, b) => new Date(b.data_venda).getTime() - new Date(a.data_venda).getTime());

        setHistory(vendasCliente);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [vendedorId, customer]);

  const getStatusBadge = (status?: string) => {
    // Como a API de Venda não tem status explícito (assumimos concluída se existe),
    // vamos considerar "delivered" por padrão para vendas recuperadas
    // Se precisarmos de status real, o modelo de Venda precisa ser atualizado
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Concluída
      </Badge>
    );
  };

  const formatPaymentMethod = (venda: Venda) => {
    if (!venda.contas_receber?.parcelas?.length) return 'N/A';
    // Mapeamento simples de ID para nome (idealmente viria do backend ou store)
    const methodId = venda.contas_receber.parcelas[0].meio_pagamento_id;
    const methodMap: Record<number, string> = {
      1: 'Dinheiro',
      2: 'PIX',
      3: 'Cartão',
      4: 'Boleto/Transferência'
    };
    return methodMap[methodId] || `Método ${methodId}`;
  };

  if (isLoading) {
    return (
      <div className="flex bg-gray-50 h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-muted-foreground">Carregando histórico...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Histórico de Pedidos</h1>
            <p className="text-sm text-muted-foreground">{customer?.nome || customer?.name}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-gray-500">Nenhuma venda encontrada para este cliente.</p>
          </div>
        ) : (
          history.map((record) => (
            <Card key={record.id} className="border-l-4 border-l-blue-500 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(record.data_venda).toLocaleDateString('pt-BR')} às {new Date(record.data_venda).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {getStatusBadge()}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-1">
                    {record.venda_item?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="w-3 h-3 text-gray-400" />
                          <span>{Math.floor(item.quantidade)}x Produto {item.produto_id}</span>
                          {/* TODO: Buscar nome do produto se possível, ou cachear produtos */}
                        </div>
                        <span className="font-medium">R$ {(item.valor_unitario * item.quantidade).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Pagamento: <span className="font-medium text-gray-700">{formatPaymentMethod(record)}</span>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-lg text-green-700">
                      <DollarSign className="w-5 h-5" />
                      {Number(record.contas_receber?.valor || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {history.length > 0 && (
          <div className="text-center text-xs text-muted-foreground pt-4 pb-8">
            Exibindo últimos {history.length} atendimentos
          </div>
        )}
      </div>
    </div>
  );
}