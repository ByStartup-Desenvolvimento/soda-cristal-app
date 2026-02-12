import { useState, useEffect } from 'react';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card';
import { Badge } from '../../shared/ui/badge';
import { ArrowLeft, FileText, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUserStore } from '../../domain/auth/userStore';
import { contratosApiService, PendenciaContrato } from '../../shared/api/services/contratosServices';

interface PendingContractsProps {
  onBack: () => void;
}

export function PendingContracts({ onBack }: PendingContractsProps) {
  const [contracts, setContracts] = useState<PendenciaContrato[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const vendedorId = useUserStore(state => state.vendedorId);

  useEffect(() => {
    const loadContracts = async () => {
      if (!vendedorId) return;
      try {
        const data = await contratosApiService.fetchPendenciasContrato(vendedorId);
        setContracts(data);
      } catch (error) {
        console.error('Erro ao carregar contratos:', error);
        toast.error('Erro ao carregar contratos pendentes.');
      } finally {
        setIsLoading(false);
      }
    };

    loadContracts();
  }, [vendedorId]);

  // Adapter para UI
  const pendingContracts = contracts.filter(c => c.status !== 'signed'); // Assumindo status != signed é pendente
  const signedContracts = contracts.filter(c => c.status === 'signed');

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Data desconhecida';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        <span className="ml-2 text-muted-foreground">Carregando contratos...</span>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Button onClick={onBack} variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl">Contratos</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl">{pendingContracts.length}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl">{signedContracts.length}</p>
                <p className="text-sm text-muted-foreground">Assinados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Contracts */}
      {pendingContracts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg">Pendências / Rejeições</h2>

          {pendingContracts.map((contract) => (
            <Card key={contract.id} className="border-orange-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-base">{contract.cliente_nome || 'Cliente não identificado'}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    <Clock className="w-3 h-3 mr-1" />
                    {contract.status || 'Pendente'}
                  </Badge>
                </div>
                <CardDescription>
                  {contract.tipo_contrato || 'Contrato'} • {formatDate(contract.data_criacao)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {contract.motivo_rejeicao && (
                  <div className="bg-red-50 border border-red-200 rounded p-2">
                    <p className="text-xs text-red-700 font-medium">
                      Motivo: {contract.motivo_rejeicao}
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => toast.info('Funcionalidade de reenvio em breve')}>
                    Resolver Pendência
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {pendingContracts.length === 0 && signedContracts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg mb-2">Nenhum contrato encontrado</h3>
            <p className="text-muted-foreground">
              Não há pendências de contrato para este vendedor.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}