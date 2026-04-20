import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../shared/ui/sheet';
import { Button } from '../../shared/ui/button';
import { AlertCircle, RotateCcw, XCircle } from 'lucide-react';
import { MotivoDescarteLabel } from '../../domain/checkin/models';
import { toast } from 'sonner';
import { checkInService } from '../../domain/checkin/services';
import { formatCheckInApiDate } from '../../shared/utils/formatters';

interface CheckInDescarteSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    deliveryId: string;
    clienteId: number;
    customerName: string;
    onDiscarded: () => void;
}

export function CheckInDescarteSheet({
    open,
    onOpenChange,
    deliveryId,
    clienteId,
    customerName,
    onDiscarded
}: CheckInDescarteSheetProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleDiscard = async (motivo: MotivoDescarteLabel) => {
        setIsLoading(true);
        try {
            const vendedorIdStr = localStorage.getItem('vendedorId');
            if (!vendedorIdStr) throw new Error('Vendedor não encontrado');

            const rotaEntregaId = parseInt(deliveryId.replace('del-', '')) || 0;
            const nowFormatted = formatCheckInApiDate(new Date());

            await checkInService.descartarCheckIn(
                parseInt(vendedorIdStr),
                rotaEntregaId,
                clienteId,
                motivo,
                nowFormatted
            );

            toast.success(`Check-in descartado por motivo de ${motivo}.`);
            onDiscarded();
            onOpenChange(false);
        } catch (error) {
            toast.error('Erro ao descartar check-in.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-auto p-6">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-6 h-6" />
                        Descartar Check-in
                    </SheetTitle>
                    <SheetDescription>
                        Deseja realmente anular o atendimento para <strong>{customerName}</strong>? 
                        Escolha o motivo da anulação:
                    </SheetDescription>
                </SheetHeader>

                <div className="grid grid-cols-1 gap-4">
                    <button
                        onClick={() => handleDiscard('Retorno')}
                        disabled={isLoading}
                        className="flex items-center gap-4 p-4 border-2 border-amber-200 rounded-xl bg-amber-50 hover:bg-amber-100 hover:border-amber-400 transition-all text-left group"
                    >
                        <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform">
                            <RotateCcw className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold text-amber-900">Retorno</p>
                            <p className="text-sm text-amber-700">Precisa realizar nova tentativa de entrega hoje.</p>
                        </div>
                    </button>

                    <button
                        onClick={() => handleDiscard('Erro')}
                        disabled={isLoading}
                        className="flex items-center gap-4 p-4 border-2 border-red-200 rounded-xl bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all text-left group"
                    >
                        <div className="w-12 h-12 rounded-full bg-red-200 flex items-center justify-center text-red-700 group-hover:scale-110 transition-transform">
                            <XCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold text-red-900">Erro humano</p>
                            <p className="text-sm text-red-700">Status selecionado incorretamente por engano.</p>
                        </div>
                    </button>

                    <Button
                        variant="ghost"
                        className="mt-2"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
