export interface Produto {
    id: number;
    descricao: string;
    valor_unitario: string; // API retorna como string
    valor_unitario_revenda?: string;
    valor_preco_especial?: string;
    ativo: number; // 1 = ativo, 0 = inativo
    produto_representante?: number; // 1 = ativo, 0 = inativo
    categoria?: string;
}
