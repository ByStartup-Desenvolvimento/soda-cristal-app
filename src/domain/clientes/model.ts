export interface Clientes {
    id: number,
    ativo: number,
    nome: string,
    razaosocial?: string,
    cpfcnpj: number,
    cep: number,
    rua: string,
    cidade_id: number,
    bairro: string,
    numero: number,
    complemento?: number,
    fone: number,
    celular2?: number,
    rg?: number,
    orgaorg?: string,
    email?: string,
    datanasc: string,
    observacao: string,
    latitude?: string,
    longitude?: string,
    ruacob?: string,
    numerocob: number,
    complementocob: number,
    bairrocob: string,
    cepcob: number,
    cidadecob_id?: number,
    distribuidor_id: number,
    created_at: string,
    updated_at: string,
    pendente?: string,
    obs_app: string,
    aceite_contrato?: string,
    vendedor_id: number,
    pendente_alteracao?: boolean,
    pendente_inativacao?: boolean,
    pendente_cadastro?: boolean,
    cf_agua: boolean,
    cf_xarope: boolean,
    revendedor_agua?: number,
    revendedor_xarope?: number,
    ultimo_envio_msg?: string,
    data_aceite_contrato?: string,
    soda_preco_especial?: number,
    xarope_preco_especial?: number,
    data_inativacao?: string,
    id_cliente_maxipago?: number,
    vendedor_inativacao_id?: number,
    vendedor_cadastro_id?: number,

    // Campos para UI (Mockados ou Calculados)
    ultima_entrega?: string;
    proxima_entrega?: string;
    produto_preferido?: string;
    tipo_contrato?: string;
}

// --- Interfaces para Cadastro (POST) ---

import { z } from 'zod';

export const clienteCadastroSchema = z.object({
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    cpf_cnpj: z.string().min(11, 'Documento inválido').max(18, 'Documento inválido'),
    rg: z.string().optional(),
    data_nascimento: z.string().optional(),
    telefone: z.string().min(10, 'Telefone inválido'),
    telefone2: z.string().optional(),


    // Endereço
    cep: z.string().min(8, 'CEP inválido').max(9, 'CEP inválido'),
    endereco: z.string().min(1, 'Endereço obrigatório'),
    bairro: z.string().min(1, 'Bairro obrigatório'),
    numero: z.string().min(1, 'Número obrigatório'),
    complemento: z.string().optional(),

    // Contrato
    qtd_garrafa: z.coerce.number().min(1, 'Quantidade mínima é 1'),
    qtd_garrafa_comprada: z.coerce.number().optional().default(0),
    dia_reposicao: z.string().min(1, 'Selecione o dia de reposição'),
    obs: z.string().optional(),
    rota: z.string().optional().default('Rota Padrão'), // TODO: Pegar rota dinâmica se necessário

    // IDs e Flags
    vendedor: z.number(),
    tipo_cadastro: z.number().default(1), // 1 = Novo
    cliente_id_api: z.number().default(0),

    // Checkboxes / Configs
    revendedor_xarope: z.boolean().default(false),
    revendedor_agua: z.boolean().default(false),
    cf_xarope: z.boolean().default(false),
    cf_agua: z.boolean().default(false),
    precoespecial_agua: z.boolean().default(false),
    precoespecial_xarope: z.boolean().default(false),

    data_inativacao: z.string().default(''),
});

export type ClienteCadastroPayload = z.infer<typeof clienteCadastroSchema>;

export interface CadastroContratosPayload {
    contratos: {
        novosContratos: ClienteCadastroPayload[];
        alteracaoContrato: ClienteCadastroPayload[]; // Array vazio no cadastro
        inativacoes: ClienteCadastroPayload[];       // Array vazio no cadastro
    };
}
