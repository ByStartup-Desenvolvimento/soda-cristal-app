import { promocoesApiService } from '../../shared/api/services/promocoesServices';
import { Promocao } from './models';
import { TipoCliente } from '../deliveries/models';

export interface CartItem {
  product: {
    id: number;
    categoria?: string;
    descricao?: string;
  };
  quantity: number;
}

export const promocoesService = {
  async getPromocoes(vendedorId: number): Promise<Promocao[]> {
    try {
      const promocoes = await promocoesApiService.fetchPromocoes(vendedorId);
      if (!Array.isArray(promocoes)) return [];
      return promocoes.filter(p => p.ativo);
    } catch (error) {
      console.error('Erro ao buscar promoções:', error);
      return [];
    }
  },

  calcularDesconto(
    cart: CartItem[],
    promocoes: Promocao[],
    tipoCliente: TipoCliente
  ): { promo: Promocao | null; totalDesconto: number } {
    if (tipoCliente !== 'normal') {
      return { promo: null, totalDesconto: 0 };
    }

    const xaropeItems = cart.filter(
      item =>
        item.product.id >= 0 &&
        !(item.product.descricao?.toUpperCase().includes("CAIXA MIX"))
    );
    const totalXaropes = xaropeItems.reduce((acc, item) => acc + item.quantity, 0);

    if (totalXaropes === 0) {
      return { promo: null, totalDesconto: 0 };
    }

    // 1. Tentar promoção "qualquer"
    const promocoesQualquer = promocoes
      .filter(p => p.tipo === 'qualquer')
      .sort((a, b) => b.quantidade - a.quantidade);

    const promoQualquerElegivel = promocoesQualquer.find(p => totalXaropes >= p.quantidade);

    if (promoQualquerElegivel) {
      let countParaDesconto = totalXaropes;
      if (promoQualquerElegivel.quantidade === 2 && totalXaropes === 3) {
        countParaDesconto = 2; // Regra especial: não dá desconto no 3º item
      }
      return {
        promo: promoQualquerElegivel,
        totalDesconto: promoQualquerElegivel.valor_desconto * countParaDesconto,
      };
    }

    // 2. Tentar promoção específica
    const uniqueProductsCount = new Set(xaropeItems.map(item => item.product.id)).size;
    const tipoEspecifico = uniqueProductsCount > 1 ? 'diferentes' : 'iguais';

    const promoEspecifica = promocoes.find(
      p => p.tipo === tipoEspecifico && p.quantidade === totalXaropes && p.un === 'UN'
    );

    if (promoEspecifica) {
      return {
        promo: promoEspecifica,
        totalDesconto: promoEspecifica.valor_desconto * totalXaropes,
      };
    }

    return { promo: null, totalDesconto: 0 };
  },

  distribuirDesconto(
    cart: CartItem[],
    promo: Promocao,
    totalDesconto: number
  ): Record<number, number> {
    const xaropeItems = cart.filter(
      item =>
        item.product.id >= 0 &&
        !(item.product.descricao?.toUpperCase().includes("CAIXA MIX"))
    );
    const totalXaropes = xaropeItems.reduce((acc, item) => acc + item.quantity, 0);
    const descontosPorItem: Record<number, number> = {};

    cart.forEach(item => {
      descontosPorItem[item.product.id] = 0;
    });

    if (promo.tipo === 'qualquer') {
      if (promo.quantidade === 2 && totalXaropes <= 3) {
        const parteDesconto = totalDesconto / 2;
        let unidadesComDesconto = 0;

        for (const item of xaropeItems) {
          let descontoItem = 0;
          for (let q = 0; q < item.quantity; q++) {
            if (unidadesComDesconto < 2) {
              descontoItem += parteDesconto;
              unidadesComDesconto++;
            }
          }
          descontosPorItem[item.product.id] = descontoItem;
        }
      } else {
        const descontoUnitario = totalDesconto / totalXaropes;
        xaropeItems.forEach(item => {
          descontosPorItem[item.product.id] = descontoUnitario * item.quantity;
        });
      }
    } else {
      const parteDesconto = totalDesconto / promo.quantidade;
      let unidadesComDesconto = 0;

      for (const item of xaropeItems) {
        let descontoItem = 0;
        for (let q = 0; q < item.quantity; q++) {
          if (unidadesComDesconto < promo.quantidade) {
            descontoItem += parteDesconto;
            unidadesComDesconto++;
          }
        }
        descontosPorItem[item.product.id] = descontoItem;
      }
    }

    return descontosPorItem;
  }
};
