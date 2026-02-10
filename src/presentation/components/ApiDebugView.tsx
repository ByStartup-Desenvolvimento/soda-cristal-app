import { useState } from 'react';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { vendasService } from '../../domain/vendas/services'


export function ApiDebugView() {
    const [response, setResponse] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [endpointName, setEndpointName] = useState('');

    const handleFetch = async (name: string, fetchFn: () => Promise<any>) => {
        setLoading(true);
        setEndpointName(name);
        setResponse(null);
        try {
            const data = await fetchFn();
            setResponse(data);
        } catch (error: any) {
            setResponse({ error: error.message, stack: error.stack });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="m-4 border-dashed border-2 border-red-200 bg-red-50/10">
            <CardHeader>
                <CardTitle className="text-sm font-mono text-red-600">🛠️ API Debugger (Remover em Prod)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleFetch('Vendas do Vendedor (ID 1)', () => vendasService.getVendasVendedor(1))}
                        disabled={loading}
                    >
                        Testar Vendas Vendedor
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleFetch('Vendas Pendentes (ID 1)', () => vendasService.getVendasPendentes(89))}
                        disabled={loading}
                    >
                        Testar Vendas Pendentes
                    </Button>
                </div>

                {endpointName && (
                    <div className="text-xs font-semibold text-muted-foreground mt-2">
                        Resultado: {endpointName} {loading && '...'}
                    </div>
                )}

                {response && (
                    <pre className="bg-slate-950 text-slate-50 p-4 rounded-md text-xs overflow-auto max-h-96">
                        {JSON.stringify(response, null, 2)}
                    </pre>
                )}
            </CardContent>
        </Card >
    );
}
