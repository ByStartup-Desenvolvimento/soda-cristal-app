import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";

import { produtosService } from "../produtos/services";
import { pagamentosService } from "../pagamentos/services";
import { promocoesService } from "../promocoes/services";
import type { Produto } from "../produtos/models";
import type { MeioPagamento } from "../pagamentos/models";
import type { Promocao } from "../promocoes/models";
import { useNetworkStore } from "../../shared/store/networkStore";

/**
 * Catalogo do PDV (xaropes, meios de pagamento e promocoes) guardado no
 * aparelho.
 *
 * Antes, a tela de venda buscava os tres no servidor toda vez que abria e nao
 * guardava nada: sem internet as tres falhavam juntas, a lista de pagamento
 * ficava vazia e a venda nao fechava. As rotas ja usavam esse mesmo padrao de
 * cache local (rotasStore), o PDV so tinha ficado de fora.
 *
 * O envio da venda ja era offline (fila do outbox); o que faltava era a tela
 * abrir com os dados.
 */

export const OFFLINE_CATALOGO_MESSAGE =
  "Sem conexão, usando catálogo salvo no aparelho";

interface CatalogoState {
  /** Só true após `persist.rehydrate()`. Não persistido. */
  hasHydratedFromStorage: boolean;

  produtos: Produto[];
  meiosPagamento: MeioPagamento[];
  promocoes: Promocao[];

  /** Quando o catálogo salvo foi baixado do servidor (ms). */
  lastFetchAt: number | null;
  /** De quem é o catálogo salvo — evita usar o cache de outro vendedor no mesmo aparelho. */
  ownerVendedorId: number | null;
  ownerDistribuidorId: number | null;

  isLoading: boolean;
  erroProdutos: boolean;
  erroPagamentos: boolean;
  offlineHint: string | null;

  setHasHydratedFromStorage: (value: boolean) => void;
  load: (
    vendedorId: number | null,
    distribuidorId: number | null,
    forceRefresh?: boolean,
  ) => Promise<void>;
  clear: () => void;
}

/** Cache de 12h: cobre o dia inteiro de trabalho a partir da sincronização na empresa. */
const CACHE_MS = 12 * 60 * 60 * 1000;

/**
 * Uma reidratação só, mesmo com dois `load()` disparados quase juntos (o efeito
 * do PDV roda de novo quando o vendedorId sai de null). Sem isso, a segunda
 * reidratação poderia sobrescrever dados recém-buscados com o cache antigo.
 */
let rehydratePromise: Promise<void> | null = null;

export const useCatalogoStore = create<CatalogoState>()(
  persist(
    (set, get) => ({
      hasHydratedFromStorage: false,
      produtos: [],
      meiosPagamento: [],
      promocoes: [],
      lastFetchAt: null,
      ownerVendedorId: null,
      ownerDistribuidorId: null,
      // Comeca carregando: enquanto o cache do IndexedDB e lido, a tela mostra
      // o spinner em vez de piscar "0 xaropes no catalogo". Todo caminho de
      // `load()` termina com isLoading = false.
      isLoading: true,
      erroProdutos: false,
      erroPagamentos: false,
      offlineHint: null,

      setHasHydratedFromStorage: (value: boolean) =>
        set({ hasHydratedFromStorage: value }),

      clear: () =>
        set({
          produtos: [],
          meiosPagamento: [],
          promocoes: [],
          lastFetchAt: null,
          ownerVendedorId: null,
          ownerDistribuidorId: null,
          erroProdutos: false,
          erroPagamentos: false,
          offlineHint: null,
        }),

      load: async (vendedorId, distribuidorId, forceRefresh = false) => {
        // Garante que o cache do IndexedDB já foi lido antes de qualquer decisão.
        if (!get().hasHydratedFromStorage) {
          if (!rehydratePromise) {
            rehydratePromise = Promise.resolve(
              useCatalogoStore.persist.rehydrate(),
            ).then(() => {
              useCatalogoStore.setState({ hasHydratedFromStorage: true });
            });
          }
          await rehydratePromise;
        }

        const state = get();

        // Cache de outro usuário no mesmo aparelho não vale.
        const cacheDeOutroUsuario =
          (state.lastFetchAt !== null &&
            state.ownerVendedorId !== null &&
            state.ownerVendedorId !== vendedorId) ||
          (state.lastFetchAt !== null &&
            state.ownerDistribuidorId !== null &&
            state.ownerDistribuidorId !== distribuidorId);

        if (cacheDeOutroUsuario) {
          get().clear();
        }

        const s = get();
        const temCache = s.produtos.length > 0 || s.meiosPagamento.length > 0;

        // Sem identificação não há o que buscar. Se houver cache, usa; senão avisa.
        if (!vendedorId && !distribuidorId) {
          set({
            isLoading: false,
            erroProdutos: !temCache,
            erroPagamentos: !temCache,
            offlineHint: temCache ? OFFLINE_CATALOGO_MESSAGE : null,
          });
          return;
        }

        // Offline: abre com o que está salvo, em vez de travar a venda.
        if (!useNetworkStore.getState().isOnline) {
          set({
            isLoading: false,
            erroProdutos: !temCache,
            erroPagamentos: !temCache,
            offlineHint: temCache ? OFFLINE_CATALOGO_MESSAGE : null,
          });
          return;
        }

        const cacheValido =
          s.lastFetchAt !== null && Date.now() - s.lastFetchAt < CACHE_MS;
        if (!forceRefresh && cacheValido && temCache) {
          set({
            isLoading: false,
            erroProdutos: false,
            erroPagamentos: false,
            offlineHint: null,
          });
          return;
        }

        // Só mostra "carregando" quando não há nada salvo para exibir enquanto busca.
        set({
          isLoading: !temCache,
          erroProdutos: false,
          erroPagamentos: false,
          offlineHint: null,
        });

        const [resProdutos, resPagamentos, resPromocoes] =
          await Promise.allSettled([
            vendedorId
              ? produtosService.getProdutos(vendedorId)
              : Promise.reject(new Error("Vendedor nao identificado")),
            distribuidorId
              ? pagamentosService.getMeiosPagamento(distribuidorId)
              : Promise.reject(new Error("Distribuidora nao identificada")),
            vendedorId
              ? promocoesService.getPromocoes(vendedorId)
              : Promise.resolve([] as Promocao[]),
          ]);

        const atual = get();
        const next: Partial<CatalogoState> = { isLoading: false };
        let algumaFalha = false;
        let algumSucesso = false;

        if (resProdutos.status === "fulfilled") {
          next.produtos = resProdutos.value;
          next.erroProdutos = false;
          algumSucesso = true;
        } else {
          console.error("Erro ao carregar produtos:", resProdutos.reason);
          algumaFalha = true;
          // Falhou: preserva o catálogo salvo em vez de esvaziar a tela.
          next.erroProdutos = atual.produtos.length === 0;
        }

        if (resPagamentos.status === "fulfilled") {
          next.meiosPagamento = resPagamentos.value;
          next.erroPagamentos = false;
          algumSucesso = true;
        } else {
          console.error(
            "Erro ao carregar meios de pagamento:",
            resPagamentos.reason,
          );
          algumaFalha = true;
          next.erroPagamentos = atual.meiosPagamento.length === 0;
        }

        if (resPromocoes.status === "fulfilled") {
          next.promocoes = resPromocoes.value;
          algumSucesso = true;
        } else {
          console.error("Erro ao carregar promoções:", resPromocoes.reason);
          algumaFalha = true;
        }

        if (algumSucesso) {
          next.lastFetchAt = Date.now();
          next.ownerVendedorId = vendedorId;
          next.ownerDistribuidorId = distribuidorId;
        }

        const temCacheDepois =
          (next.produtos ?? atual.produtos).length > 0 ||
          (next.meiosPagamento ?? atual.meiosPagamento).length > 0;

        next.offlineHint =
          algumaFalha && temCacheDepois ? OFFLINE_CATALOGO_MESSAGE : null;

        set(next as CatalogoState);
      },
    }),
    {
      name: "soda-catalogo-pdv-storage",
      storage: createJSONStorage(() => ({
        getItem: async (name: string) => (await idbGet(name)) ?? null,
        setItem: async (name: string, value: string) =>
          await idbSet(name, value),
        removeItem: async (name: string) => await idbDel(name),
      })),
      partialize: (state) => ({
        produtos: state.produtos,
        meiosPagamento: state.meiosPagamento,
        promocoes: state.promocoes,
        lastFetchAt: state.lastFetchAt,
        ownerVendedorId: state.ownerVendedorId,
        ownerDistribuidorId: state.ownerDistribuidorId,
      }),
      skipHydration: true,
    },
  ),
);

/** Texto curto de quando o catálogo salvo foi baixado ("hoje às 07:12"). */
export function formatarMomentoCatalogo(ts: number | null): string {
  if (!ts) return "";
  const data = new Date(ts);
  const hora = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const hoje = new Date();
  const mesmoDia =
    data.getDate() === hoje.getDate() &&
    data.getMonth() === hoje.getMonth() &&
    data.getFullYear() === hoje.getFullYear();

  if (mesmoDia) return `hoje às ${hora}`;
  return `${data.toLocaleDateString("pt-BR")} às ${hora}`;
}
