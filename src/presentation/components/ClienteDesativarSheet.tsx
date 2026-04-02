import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../shared/ui/sheet';
import { Button } from '../../shared/ui/button';
import { Input } from '../../shared/ui/input';
import { Label } from '../../shared/ui/label';
import { Textarea } from '../../shared/ui/textarea';
import { Minus, Plus, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { RotaEntregaCompleta } from '../../domain/rotas/models';
import { clientesServices } from '../../domain/clientes/services';
import type { ClienteCadastroPayload } from '../../domain/clientes/model';

interface ClienteDesativarSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: RotaEntregaCompleta | null;
  onSaved?: () => void;
}

export function ClienteDesativarSheet({ open, onOpenChange, cliente, onSaved }: ClienteDesativarSheetProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [dataRecolha, setDataRecolha] = useState('');
  const [qtdDevolver, setQtdDevolver] = useState(0);
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    if (open) {
      const now = new Date();
      const localFormated = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      setDataRecolha(localFormated);
      setQtdDevolver(0);
      setMotivo('');
    }
  }, [open]);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  const handlePreSave = () => {
    if (!cliente) return;

    if (!dataRecolha) {
      toast.error('Data de recolha é obrigatória');
      return;
    }

    if (!motivo.trim()) {
      toast.error('Motivo da inativação é obrigatório');
      return;
    }

    const confirm = window.confirm(`Tem certeza que deseja inativar o cliente ${cliente.cliente.nome}? Essa ação encerrará o atendimento.`);
    if (confirm) {
      handleSave();
    }
  };

  const handleSave = async () => {
    if (!cliente) return;

    setIsSaving(true);

    try {
      const vendedorId = Number(localStorage.getItem('vendedorId')) || 0;

      let dataInativacaoFormatada = dataRecolha;
      if (dataRecolha && dataRecolha.includes('T')) {
        const [datePart, timePart] = dataRecolha.split('T');
        const [year, month, day] = datePart.split('-');
        const [hours = '00', minutes = '00', seconds = '00'] = timePart.split(':');
        dataInativacaoFormatada = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
      }

      const payload: ClienteCadastroPayload = {
        id: cliente.cliente.id,
        nome: cliente.cliente.nome || '',
        cpf_cnpj: cliente.cliente.cpf_cnpj || '00000000000',
        telefone: cliente.cliente.celular || cliente.cliente.celular2 || '0000000000',
        cep: cliente.cliente.cep || '00000000',
        endereco: cliente.cliente.rua || '',
        bairro: cliente.cliente.bairro || '',
        numero: cliente.cliente.numero || '',
        qtd_garrafa: qtdDevolver,
        qtd_garrafa_comprada: 0,
        dia_reposicao: '',
        obs: motivo,
        rota: cliente.rota.nome || '',
        vendedor: vendedorId,
        tipo_cadastro: 3, // Inativação
        cliente_id_api: cliente.cliente.id,
        data_inativacao: dataInativacaoFormatada,
        revendedor_xarope: Boolean(cliente.cliente.revendedor_xarope),
        revendedor_agua: Boolean(cliente.cliente.revendedor_agua),
        cf_xarope: Boolean(cliente.cliente.cf_xarope),
        cf_agua: Boolean(cliente.cliente.cf_agua),
        precoespecial_agua: Boolean(cliente.cliente.precoespecial_agua),
        precoespecial_xarope: Boolean(cliente.cliente.precoespecial_xarope),
      };

      await clientesServices.inativarCliente(payload);
      toast.success('Cliente inativado com sucesso!');
      onOpenChange(false);
      onSaved?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao inativar cliente';
      toast.error('Erro ao inativar', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  if (!cliente) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="top" className="flex flex-col h-full max-h-[100dvh] p-0 gap-0">
          <div className="px-5 sm:px-6 py-4 shrink-0 bg-white border-b z-10">
            <SheetHeader className='pt-4'>
              <SheetTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Desativar Cliente
              </SheetTitle>
              <SheetDescription>
                Inativar <strong>{cliente.cliente.nome}</strong>. Preencha os dados de recolha e motivo.
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="overflow-y-auto bg-slate-50 p-6 h-full">
            <div className="space-y-6 pb-6 sm:px-2">

              {/* Resumo de Dados do Cliente (Solicitado via Screenshot) */}
              <div className="bg-white p-4 rounded-xl border-2 border-slate-100 shadow-sm space-y-3">
                <div className="flex flex-col gap-0.5 border-b pb-2 mb-2">
                  <p className="text-xs text-muted-foreground font-semibold">ID / CÓDIGO CLIENTE: {cliente.cliente.id}</p>
                  <h4 className="text-sm font-bold text-slate-800 uppercase leading-snug">{cliente.cliente.nome}</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Garrafas</p>
                    <p className="text-sm font-semibold text-slate-700">{cliente.rotaentrega.num_garrafas} Garrafas</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Garrafas Comp.</p>
                    <p className="text-sm font-semibold text-slate-700">{cliente.rotaentrega.num_garrafas_comprada} Garrafas Comp.</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">CpfCnpj:</span>
                    <span className="text-sm text-slate-600 font-medium">{cliente.cliente.cpf_cnpj || 'Não informado'}</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Endereço:</span>
                    <span className="text-sm text-slate-600 font-medium">
                      {cliente.cliente.rua}, {cliente.cliente.numero}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Bairro:</span>
                      <span className="text-sm text-slate-600">{cliente.cliente.bairro || '-'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Complemento:</span>
                      <span className="text-sm text-slate-600 font-bold text-blue-600">{cliente.cliente.complemento || 'NENHUM'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Celular:</span>
                    <span className="text-sm text-blue-700 font-bold">{cliente.cliente.celular || '-'}</span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Email:</span>
                    <span className="text-sm text-slate-600">{cliente.cliente.email || '-'}</span>
                  </div>

                  <div className="pt-1 border-t mt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Coordenadas</p>
                    <div className="grid grid-cols-1 gap-0.5">
                      <p className="text-[11px] text-slate-500 font-mono">Lat: {cliente.cliente.latitude || '0'}</p>
                      <p className="text-[11px] text-slate-500 font-mono">Long: {cliente.cliente.longitude || '0'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label htmlFor="desativar-data" className="text-slate-700 font-bold">Data e Hora de Recolha *</Label>
                <Input
                  id="desativar-data"
                  type="datetime-local"
                  value={dataRecolha}
                  onChange={() => { }}
                  disabled
                  className="bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label>Quantidade de Sifões / Garrafas a Devolver</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => setQtdDevolver(Math.max(0, qtdDevolver - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-bold w-12 text-center">{qtdDevolver}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => setQtdDevolver(qtdDevolver + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Saldo atual do cliente: {cliente.rotaentrega.num_garrafas || 0} consignadas
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="desativar-motivo">Motivo da Inativação *</Label>
                <Textarea
                  id="desativar-motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Explicar detalhadamente o motivo do encerramento..."
                  rows={4}
                  className="bg-white border-red-200 focus-visible:ring-red-500"
                />
              </div>

            </div>
          </div>

          {/* Ações - footer fixo */}
          <div className="p-4 border-t bg-white shrink-0 z-10 w-full mt-auto">
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handlePreSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mr-2" />
                )}
                {isSaving ? 'Inativando...' : 'Confirmar Inativação'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
