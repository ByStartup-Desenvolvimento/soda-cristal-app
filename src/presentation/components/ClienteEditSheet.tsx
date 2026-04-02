import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../shared/ui/sheet';
import { Button } from '../../shared/ui/button';
import { Input } from '../../shared/ui/input';
import { Label } from '../../shared/ui/label';
import { Checkbox } from '../../shared/ui/checkbox';
import { Textarea } from '../../shared/ui/textarea';
import { Save, Minus, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { RotaEntregaCompleta } from '../../domain/rotas/models';
import { clientesServices } from '../../domain/clientes/services';
import type { ClienteCadastroPayload } from '../../domain/clientes/model';

interface ClienteEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: RotaEntregaCompleta | null;
  onSaved?: () => void;
}

export function ClienteEditSheet({ open, onOpenChange, cliente, onSaved }: ClienteEditSheetProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Form state inicializado com dados do cliente
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [telefone2, setTelefone2] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cep, setCep] = useState('');
  const [observacao, setObservacao] = useState('');
  const [numGarrafas, setNumGarrafas] = useState(0);
  const [numGarrafasComprada, setNumGarrafasComprada] = useState(0);
  const [revendedorAgua, setRevendedorAgua] = useState(false);
  const [revendedorXarope, setRevendedorXarope] = useState(false);
  const [cfAgua, setCfAgua] = useState(false);
  const [cfXarope, setCfXarope] = useState(false);
  const [peAgua, setPeAgua] = useState(false);
  const [peXarope, setPeXarope] = useState(false);

  // Ao abrir com novo cliente, popula o form
  const populateForm = () => {
    if (!cliente) return;
    setNome(cliente.cliente.nome || '');
    setCpfCnpj(cliente.cliente.cpf_cnpj || String((cliente.cliente as any).cpfcnpj || ''));
    setTelefone(cliente.cliente.celular || '');
    setTelefone2(cliente.cliente.celular2 || '');
    setRua(cliente.cliente.rua || '');
    setNumero(cliente.cliente.numero || '');
    setBairro(cliente.cliente.bairro || '');
    setCep(cliente.cliente.cep || '');
    setObservacao(cliente.cliente.observacao || '');
    setNumGarrafas(cliente.rotaentrega.num_garrafas || 0);
    setNumGarrafasComprada(cliente.rotaentrega.num_garrafas_comprada || 0);
    setRevendedorAgua(Boolean(cliente.cliente.revendedor_agua));
    setRevendedorXarope(Boolean(cliente.cliente.revendedor_xarope));
    setCfAgua(Boolean(cliente.cliente.cf_agua));
    setCfXarope(Boolean(cliente.cliente.cf_xarope));
    setPeAgua(Boolean(cliente.cliente.precoespecial_agua));
    setPeXarope(Boolean(cliente.cliente.precoespecial_xarope));
  };

  useEffect(() => {
    if (open && cliente) {
      populateForm();
    }
  }, [open, cliente]);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  const handleSave = async () => {
    if (!cliente) return;

    if (!nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setIsSaving(true);

    try {
      const vendedorId = Number(localStorage.getItem('vendedorId')) || 0;

      const payload: ClienteCadastroPayload = {
        id: 0,
        rg: '',
        data_nascimento: '',
        complemento: '',
        nome,
        cpf_cnpj: cpfCnpj,
        telefone,
        telefone2,
        cep,
        endereco: rua,
        bairro,
        numero,
        qtd_garrafa: numGarrafas,
        qtd_garrafa_comprada: numGarrafasComprada,
        dia_reposicao: '',
        obs: observacao,
        rota: cliente.rota.nome || '',
        vendedor: vendedorId,
        tipo_cadastro: 2, // 2 = Alteração
        cliente_id_api: cliente.cliente.id,
        revendedor_xarope: revendedorXarope,
        revendedor_agua: revendedorAgua,
        cf_xarope: cfXarope,
        cf_agua: cfAgua,
        precoespecial_agua: peAgua,
        precoespecial_xarope: peXarope,
        data_inativacao: '',
      };

      await clientesServices.alterarCliente(payload);
      toast.success('Cliente atualizado com sucesso!');
      onOpenChange(false);
      onSaved?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar alterações';
      toast.error('Erro ao salvar', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  if (!cliente) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="top" className="flex flex-col h-full max-h-[100dvh] p-0 gap-0">
        <div className="px-5 sm:px-6 py-4 shrink-0 bg-white border-b z-10">
          <SheetHeader className='pt-4'>
            <SheetTitle>Editar Cliente</SheetTitle>
            <SheetDescription>
              Altere os dados de <strong>{cliente.cliente.nome}</strong>
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="overflow-y-auto bg-slate-50 p-8">
          <div className="space-y-6 pt-5 pb-6 px-5 sm:px-6">
            {/* Dados Pessoais */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1">
                Dados Pessoais
              </h3>
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-nome">Nome</Label>
                  <Input id="edit-nome" value={nome} onChange={(e) => setNome(e.target.value)} className="border border-gray-300" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-cpf">CPF/CNPJ {numGarrafasComprada > 0 ? '(opcional)' : '*'}</Label>
                  <Input id="edit-cpf" value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} className="border border-gray-300" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-tel1">Telefone</Label>
                    <Input id="edit-tel1" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="border border-gray-300" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-tel2">Telefone 2</Label>
                    <Input id="edit-tel2" value={telefone2} onChange={(e) => setTelefone2(e.target.value)} className="border border-gray-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1">
                Endereço
              </h3>
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-rua">Rua</Label>
                  <Input id="edit-rua" value={rua} onChange={(e) => setRua(e.target.value)} className="border border-gray-300" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-numero">Nº</Label>
                    <Input id="edit-numero" value={numero} onChange={(e) => setNumero(e.target.value)} className="border border-gray-300" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-bairro">Bairro</Label>
                    <Input id="edit-bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} className="border border-gray-300" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-cep">CEP</Label>
                    <Input id="edit-cep" value={cep} onChange={(e) => setCep(e.target.value)} className="border border-gray-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Config Produto */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1">
                Configuração de Produto
              </h3>
              <div className="space-y-3 pt-2">
                {/* Linha 1 */}
                <div className="border rounded-md p-3 grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={revendedorAgua} onCheckedChange={(v) => setRevendedorAgua(Boolean(v))} />
                    <span className="text-sm">Revendedor Água</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={revendedorXarope} onCheckedChange={(v) => setRevendedorXarope(Boolean(v))} />
                    <span className="text-sm">Revendedor Xarope</span>
                  </label>
                </div>

                {/* Linha 2 */}
                <div className="border rounded-md p-3 grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={cfAgua} onCheckedChange={(v) => setCfAgua(Boolean(v))} />
                    <span className="text-sm">C. Final. Água</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={cfXarope} onCheckedChange={(v) => setCfXarope(Boolean(v))} />
                    <span className="text-sm">C. Final. Xarope</span>
                  </label>
                </div>

                {/* Linha 3 */}
                <div className="border rounded-md p-3 grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={peAgua} onCheckedChange={(v) => setPeAgua(Boolean(v))} />
                    <span className="text-sm">PE Água</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={peXarope} onCheckedChange={(v) => setPeXarope(Boolean(v))} />
                    <span className="text-sm">PE Xarope</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Vasilhames */}
            <div className="space-y-3 px-4">
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1">
                Vasilhames
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Consignadas</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setNumGarrafas(Math.max(0, numGarrafas - 1))}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-lg font-semibold w-8 text-center">{numGarrafas}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setNumGarrafas(numGarrafas + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Compradas</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setNumGarrafasComprada(Math.max(0, numGarrafasComprada - 1))}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-lg font-semibold w-8 text-center">{numGarrafasComprada}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setNumGarrafasComprada(numGarrafasComprada + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-obs">Observações</Label>
              <Textarea
                id="edit-obs"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Observações sobre o cliente..."
                rows={3}
                className="border border-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Ações - footer fixo do sheet */}
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
              className="flex-1 text-white"
              style={{ backgroundColor: '#008000' }}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
