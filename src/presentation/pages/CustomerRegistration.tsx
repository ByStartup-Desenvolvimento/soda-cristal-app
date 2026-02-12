import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/card';
import { Input } from '../../shared/ui/input';
import { Label } from '../../shared/ui/label';
import { Textarea } from '../../shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/ui/select';
import { Checkbox } from '../../shared/ui/checkbox';
import { ArrowLeft, User, MapPin, FileText, Search, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

import { useClientesStore } from '../../domain/clientes/clienteStore';
import { useUserStore } from '../../domain/auth/userStore';
import { clienteCadastroSchema, ClienteCadastroPayload } from '../../domain/clientes/model';
import { formatCEP, formatCPFCNPJ, formatPhone } from '../../shared/utils/formatters';

interface CustomerRegistrationProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function CustomerRegistration({ onBack, onSuccess }: CustomerRegistrationProps) {
  const { cadastrarCliente, isSubmitting } = useClientesStore();
  const { vendedorId } = useUserStore();
  const [loadingCep, setLoadingCep] = useState(false);

  // Setup do formulário com ZOD
  const form = useForm<ClienteCadastroPayload>({
    resolver: zodResolver(clienteCadastroSchema) as any,
    defaultValues: {
      vendedor: vendedorId || 0,
      tipo_cadastro: 1, // Novo
      cliente_id_api: 0,
      nome: '',
      cpf_cnpj: '',
      telefone: '',
      cep: '',
      endereco: '',
      numero: '',
      bairro: '',
      complemento: '',
      rg: '',
      data_nascimento: '',
      telefone2: '',
      qtd_garrafa: 1,
      qtd_garrafa_comprada: 0,
      dia_reposicao: '',
      obs: '',
      rota: 'Rota Padrão', // TODO: Ajustar se necessário
      revendedor_xarope: false,
      revendedor_agua: false,
      cf_xarope: false,
      cf_agua: true, // Default comum
      precoespecial_agua: false,
      precoespecial_xarope: false,
      data_inativacao: ''
    }
  });

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = form;

  // Busca de CEP
  const handleSearchCEP = async () => {
    const cep = watch('cep')?.replace(/\D/g, '');
    if (!cep || cep.length !== 8) {

      toast.error('CEP inválido', { description: 'Digite um CEP com 8 números' });
      return;
    }

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

      const data = await response.json();

      if (data.erro) {
        toast.error('CEP não encontrado');
      } else {
        setValue('endereco', data.logradouro);
        setValue('bairro', data.bairro);

        // Cidade/UF não estão no payload da API Soda Cristal v2 deste endpoint específico (mas poderiam estar no "obs" se necessário)
        toast.success('Endereço encontrado!');
      }
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setLoadingCep(false);
    }
  };

  const onSubmit = async (data: ClienteCadastroPayload) => {
    if (!vendedorId) {
      toast.error('Erro de autenticação', { description: 'Vendedor não identificado. Faça login novamente.' });
      return;
    }

    // Garante vendedor atualizado
    data.vendedor = vendedorId;

    const success = await cadastrarCliente(data);

    if (success) {
      toast.success('Cliente cadastrado com sucesso!', {
        description: 'Os dados foram enviados para o servidor.'
      });
      onSuccess();
    }
    // Erro já é tratado na store
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Button onClick={onBack} variant="ghost" size="sm" type="button">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl">Cadastrar Novo Cliente</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Dados Pessoais</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div>
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input id="nome" {...register('nome')} placeholder="Ex: João da Silva" />
              {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cpf_cnpj">CPF/CNPJ *</Label>
                <Controller
                  control={control}
                  name="cpf_cnpj"
                  render={({ field }) => (
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(formatCPFCNPJ(e.target.value))}
                      placeholder="000.000.000-00"
                      maxLength={18}
                    />
                  )}
                />
                {errors.cpf_cnpj && <p className="text-red-500 text-xs mt-1">{errors.cpf_cnpj.message}</p>}
              </div>

              <div>
                <Label htmlFor="rg">RG</Label>
                <Input id="rg" {...register('rg')} placeholder="Opcional" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                <Controller
                  control={control}
                  name="telefone"
                  render={({ field }) => (
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                      placeholder="(99) 99999-9999"
                      maxLength={15}
                    />
                  )}
                />
                {errors.telefone && <p className="text-red-500 text-xs mt-1">{errors.telefone.message}</p>}
              </div>

              <div>
                <Label htmlFor="telefone2">Telefone 2</Label>
                <Controller
                  control={control}
                  name="telefone2"
                  render={({ field }) => (
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                      placeholder="(99) 99999-9999"
                      maxLength={15}
                    />
                  )}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <Input type="date" {...register('data_nascimento')} />
            </div>

          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Endereço</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor="cep">CEP *</Label>
                <Controller
                  control={control}
                  name="cep"
                  render={({ field }) => (
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(formatCEP(e.target.value))}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  )}
                />
              </div>
              <Button type="button" variant="outline" onClick={handleSearchCEP} disabled={loadingCep}>
                {loadingCep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span className="sr-only">Buscar CEP</span>
              </Button>
            </div>
            {errors.cep && <p className="text-red-500 text-xs mt-1">{errors.cep.message}</p>}

            <div>
              <Label htmlFor="endereco">Logradouro *</Label>
              <Input {...register('endereco')} placeholder="Rua, Avenida..." />
              {errors.endereco && <p className="text-red-500 text-xs mt-1">{errors.endereco.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero">Número *</Label>
                <Input {...register('numero')} placeholder="123" />
                {errors.numero && <p className="text-red-500 text-xs mt-1">{errors.numero.message}</p>}
              </div>
              <div>
                <Label htmlFor="bairro">Bairro *</Label>
                <Input {...register('bairro')} placeholder="Centro" />
                {errors.bairro && <p className="text-red-500 text-xs mt-1">{errors.bairro.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="complemento">Complemento</Label>
              <Input {...register('complemento')} placeholder="Apto, Bloco..." />
            </div>

          </CardContent>
        </Card>

        {/* Contrato e Configuração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Contrato e Configuração</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dia_reposicao">Dia de Reposição *</Label>
                <Controller
                  control={control}
                  name="dia_reposicao"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Segunda">Segunda</SelectItem>
                        <SelectItem value="Terca">Terça</SelectItem>
                        <SelectItem value="Quarta">Quarta</SelectItem>
                        <SelectItem value="Quinta">Quinta</SelectItem>
                        <SelectItem value="Sexta">Sexta</SelectItem>
                        <SelectItem value="Sabado">Sábado</SelectItem>
                        <SelectItem value="Domingo">Domingo</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.dia_reposicao && <p className="text-red-500 text-xs mt-1">{errors.dia_reposicao.message}</p>}
              </div>

              <div>
                <Label htmlFor="qtd_garrafa">Qtd. Garrafas *</Label>
                <Input
                  type="number"
                  {...register('qtd_garrafa')}
                  min={1}
                />
                {errors.qtd_garrafa && <p className="text-red-500 text-xs mt-1">{errors.qtd_garrafa.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="obs">Observações</Label>
              <Textarea {...register('obs')} placeholder="Observações gerais sobre o cliente" />
            </div>

            {/* Checkboxes em Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">

              <div className="flex items-center space-x-2 border p-3 rounded-md">
                <Controller
                  control={control}
                  name="cf_agua"
                  render={({ field }) => (
                    <Checkbox id="cf_agua" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label htmlFor="cf_agua" className="cursor-pointer">Comodato Água</Label>
              </div>

              <div className="flex items-center space-x-2 border p-3 rounded-md">
                <Controller
                  control={control}
                  name="cf_xarope"
                  render={({ field }) => (
                    <Checkbox id="cf_xarope" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label htmlFor="cf_xarope" className="cursor-pointer">Comodato Xarope</Label>
              </div>

              <div className="flex items-center space-x-2 border p-3 rounded-md">
                <Controller
                  control={control}
                  name="revendedor_agua"
                  render={({ field }) => (
                    <Checkbox id="revendedor_agua" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label htmlFor="revendedor_agua" className="cursor-pointer">Revendedor Água</Label>
              </div>

              <div className="flex items-center space-x-2 border p-3 rounded-md">
                <Controller
                  control={control}
                  name="revendedor_xarope"
                  render={({ field }) => (
                    <Checkbox id="revendedor_xarope" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label htmlFor="revendedor_xarope" className="cursor-pointer">Revendedor Xarope</Label>
              </div>

            </div>

          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cadastrando...
              </>
            ) : (
              'Cadastrar Cliente'
            )}
          </Button>

          <Button type="button" variant="outline" className="w-full" onClick={onBack}>
            Cancelar
          </Button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Contrato Digital - Sistema Aditivo</p>
                <p className="text-sm text-blue-700">
                  Após o cadastro, um contrato digital será gerado automaticamente.
                  Se o cliente já possui contrato, será criado um aditivo sem apagar o anterior.
                  Você poderá enviar o link para o cliente assinar pelo WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}