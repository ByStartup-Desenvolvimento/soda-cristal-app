export interface Promocao {
  id: number;
  ativo: boolean;
  descricao: string;
  quantidade: number;
  data_validade: string;
  valor_desconto: number;
  tipo: string;
  un: string;
}
