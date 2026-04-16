import { Produto } from './models';
import { TipoCliente } from '../deliveries/models';

export function getPrecoByTipoCliente(produto: Produto, tipoCliente: TipoCliente): number {
  if (tipoCliente === 'revendedor-especial' && produto.valor_preco_especial)
    return parseFloat(produto.valor_preco_especial);

  if (tipoCliente === 'revendedor' && produto.valor_unitario_revenda)
    return parseFloat(produto.valor_unitario_revenda);

  return parseFloat(produto.valor_unitario);
}
