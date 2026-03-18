import { useState, useEffect } from 'react';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardHeader } from '../../shared/ui/card';
import { Badge } from '../../shared/ui/badge';
import { ArrowLeft, Calendar, DollarSign, CheckCircle, Loader2, AlertCircle, CreditCard, User } from 'lucide-react';
import { vendasService } from '../../domain/vendas/services';
import { useUserStore } from '../../domain/auth/userStore';
import { VendaVendedor } from '../../domain/vendas/model';

interface CustomerHistoryProps {
  customer: any;
  onBack: () => void;
}

/** Converte "dd-MM-yyyy HH:mm:ss" para Date */
function parseDataVenda(raw: string): Date {
  // Ex: "12-03-2026 11:07:33"
  const [datePart, timePart] = raw.split(' ');
  if (!datePart) return new Date(0);
  const [day, month, year] = datePart.split('-');
  return new Date(`${year}-${month}-${day}T${timePart || '00:00:00'}`);
}

export function CustomerHistory({ customer, onBack }: CustomerHistoryProps) {
  const [history, setHistory] = useState<VendaVendedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const vendedorId = useUserStore(state => state.vendedorId);

  useEffect(() => {
    const loadHistory = async () => {
      if (!vendedorId || !customer?.id) return;

      try {
        const vendas = await vendasService.getVendasVendedorHistorico(vendedorId);

        // Filtra apenas as vendas deste cliente
        const vendasCliente = vendas.filter(v => v.cliente_id === customer.id);

        // Ordena por data (mais recente primeiro)
        vendasCliente.sort((a, b) => parseDataVenda(b.data_venda).getTime() - parseDataVenda(a.data_venda).getTime());

        setHistory(vendasCliente);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [vendedorId, customer]);

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
          history.map((record) => {
            const dataVenda = parseDataVenda(record.data_venda);

            return (
              <Card key={record.venda_id} className="border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {dataVenda.toLocaleDateString('pt-BR')} às{' '}
                        {dataVenda.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Concluída
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Vendedor */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>Vendedor: <span className="font-medium text-gray-700">{record.vendedor_nome}</span></span>
                    </div>

                    {/* Meio de Pagamento */}
                    {record.venda_meio_pag.trim() && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CreditCard className="w-3 h-3" />
                        <span>Pagamento: <span className="font-medium text-gray-700">{record.venda_meio_pag.trim()}</span></span>
                      </div>
                    )}

                    {/* Total */}
                    <div className="pt-3 border-t flex justify-end items-center">
                      <div className="flex items-center gap-1 font-bold text-lg text-green-700">
                        <DollarSign className="w-5 h-5" />
                        {Number(record.vlTotalVenda).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
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