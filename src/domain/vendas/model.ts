export interface Venda {
    id: number;
    cliente_id: number;
    data_venda: string; // "yyyy-MM-dd HH:mm:ss"
    vendedor: number;
    promocao_id?: string;
    venda_item?: VendaItem[];
    contas_receber?: ContasReceber;
    // Adicione outros campos conforme a API
}

/** Estrutura retornada pelo endpoint /vendas_vendedor/{vendedorId} */
export interface VendaVendedor {
    cliente_nome: string;
    cliente_id: number;
    cliente_codigo: string;
    cliente_rua: string;
    cliente_numero: string;
    cliente_bairro: string;
    cliente_celular: string;
    cliente_celular2: string;
    venda_id: number;
    vendedor_nome: string;
    venda_meio_pag: string;
    vlTotalVenda: string;
    data_venda: string; // "dd-MM-yyyy HH:mm:ss"
}

export interface VendaItem {
    id: number;
    produto_id: number;
    quantidade: number;
    venda_id: number;
    valor_unitario: number;
    unidade_medida: string;
    desconto: number;
    acrescimo: number;
}

export interface ContasReceber {
    valor: string;
    parcelas: Parcela[];
}

export interface Parcela {
    recebido: boolean;
    valor: string;
    meio_pagamento_id: number;
}
