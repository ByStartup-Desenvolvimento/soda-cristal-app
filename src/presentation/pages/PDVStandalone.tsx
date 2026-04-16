import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../shared/ui/card";
import { Button } from "../../shared/ui/button";
import { Badge } from "../../shared/ui/badge";
import { Input } from "../../shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shared/ui/select";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  User,
  CreditCard,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { useUserStore } from "../../domain/auth/userStore";
import { produtosService } from "../../domain/produtos/services";
import { pagamentosService } from "../../domain/pagamentos/services";
import { vendasService } from "../../domain/vendas/services";
import { Produto } from "../../domain/produtos/models";
import { MeioPagamento } from "../../domain/pagamentos/models";
import { Venda } from "../../domain/vendas/model";
import { TipoCliente } from "../../domain/deliveries/models";
import { getPrecoByTipoCliente } from "../../domain/produtos/precoPorTipoCliente";

interface CartItem {
  product: Produto;
  quantity: number;
}

interface PDVStandaloneProps {
  delivery?: {
    id: string;
    customerName: string;
    address: string;
    orderCode?: string;
    tipoCliente?: TipoCliente;
  };
  customerName?: string;
  onBack?: () => void;
}

const BOTTLE_PRODUCTS: Produto[] = [
  {
    id: -1,
    descricao: "Garrafa Reposição",
    valor_unitario: "9.99",
    valor_unitario_revenda: "9.25",
    valor_preco_especial: "8.00",
    ativo: 1,
    categoria: "Sifão",
  },
  {
    id: -2,
    descricao: "Garrafa Vendida",
    valor_unitario: "28.99",
    valor_unitario_revenda: "24.25",
    valor_preco_especial: "23.00",
    ativo: 1,
    categoria: "Sifão",
  },
];

export function PDVStandalone({
  delivery,
  customerName: propCustomerName,
  onBack,
}: PDVStandaloneProps = {}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Sifão");
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerName, setCustomerName] = useState(
    propCustomerName || delivery?.customerName || "",
  );
  const [paymentMethod, setPaymentMethod] = useState("");

  // Data from API
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [meiosPagamento, setMeiosPagamento] = useState<MeioPagamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { vendedorId, distribuidorId } = useUserStore(
    useShallow((state) => ({
      vendedorId: state.vendedorId,
      distribuidorId: state.distribuidorId,
    })),
  );

  useEffect(() => {
    const loadData = async () => {
      if (!distribuidorId) return;

      try {
        //TODO: remover quando tiver o vendedorId apos entender como usa a URL de produtos
        let distribuidorIdNormalized = Number(distribuidorId + "0");
        const produtosData = await produtosService.getProdutos(
          distribuidorIdNormalized,
        );

        setProdutos(produtosData);

        if (distribuidorId) {
          const pagamentosData =
            await pagamentosService.getMeiosPagamento(distribuidorId);
          setMeiosPagamento(pagamentosData);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do PDV:", error);
        toast.error(
          "Erro ao carregar produtos ou meios de pagamento. Verifique sua conexão.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [vendedorId, distribuidorId]);

  const addToCart = (product: Produto) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.product.id === productId);
      if (existingItem && existingItem.quantity > 1) {
        return prev.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        );
      }
      return prev.filter((item) => item.product.id !== productId);
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const tipoCliente: TipoCliente = delivery?.tipoCliente ?? "normal";

  const isCaixaMix = (descricao: string) =>
    descricao.toUpperCase().includes("CAIXA MIX");

  const getProductPrice = (product: Produto) => {
    if (isCaixaMix(product.descricao))
      return parseFloat(product.valor_unitario);
    return getPrecoByTipoCliente(product, tipoCliente);
  };

  const getTotal = () => {
    return cart.reduce(
      (total, item) => total + getProductPrice(item.product) * item.quantity,
      0,
    );
  };

  const getCartItemQuantity = (productId: number) => {
    const item = cart.find((item) => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  const handleFinalizeSale = async () => {
    if (cart.length === 0) {
      toast.error("Adicione pelo menos um item ao carrinho");
      return;
    }

    if (!customerName.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }

    if (!paymentMethod) {
      toast.error("Selecione a forma de pagamento");
      return;
    }

    if (!vendedorId) {
      toast.error("Vendedor não identificado. Faça login novamente.");
      return;
    }

    setIsProcessing(true);

    try {
      // Construir payload conforme especificação da API
      // Ref: POST /vendaxarope/v2
      const venda: Venda = {
        id: Date.now(), // ID temporário local
        cliente_id: Number(delivery?.id) || 0, // Se tiver delivery context, senão 0
        data_venda: new Date().toISOString().replace("T", " ").slice(0, 19), // Formato: yyyy-MM-dd HH:mm:ss
        vendedor: vendedorId,
        promocao_id: "", // Obrigatório string vazia se não tiver
        venda_item: cart.map((item, idx) => ({
          id: idx + 1, // ID temporário sequencial
          produto_id: item.product.id,
          quantidade: item.quantity,
          venda_id: Date.now(),
          valor_unitario: getProductPrice(item.product), // API espera number
          unidade_medida: "UN",
          desconto: 0,
          acrescimo: 0,
        })),
        contas_receber: {
          valor: getTotal().toFixed(2), // API espera string
          parcelas: [
            {
              recebido: true,
              valor: getTotal().toFixed(2), // API espera string
              meio_pagamento_id: Number(paymentMethod),
            },
          ],
        },
      };

      await vendasService.criarVendaXarope([venda]);

      toast.success(
        <div>
          <p>
            <strong>Venda realizada com sucesso!</strong>
          </p>
          <p>Cliente: {customerName}</p>
          <p>Total: R$ {getTotal().toFixed(2)}</p>
        </div>,
      );

      // Reset
      setCart([]);
      if (!delivery) setCustomerName(""); // Mantém nome se for delivery context
      setPaymentMethod("");
    } catch (error) {
      console.error("Erro ao finalizar venda:", error);
      toast.error("Erro ao registrar venda no sistema. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Tabs fixas: Garrafas (produtos virtuais) + Soda (produtos da API)
  const categories = ["Sifão", "Xarope"];

  // Combina produtos virtuais de garrafa + produtos da API
  const allProducts = [...BOTTLE_PRODUCTS, ...produtos];

  const filteredProducts = allProducts.filter((product) => {
    // Garrafas → categoria 'Garrafas'; Produtos da API → 'Soda'
    const productCategory = product.id < 0 ? "Sifão" : "Xarope";
    const matchesCategory = productCategory === selectedCategory;
    const matchesSearch = product.descricao
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-2 text-muted-foreground">
          Carregando produtos...
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-semibold">
              {delivery ? `PDV: ${delivery.customerName}` : "PDV - Xaropes"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {delivery
                ? `${delivery.address} • ${delivery.orderCode || "Sem pedido"}`
                : "Ponto de venda independente"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tipoCliente === "revendedor" && (
            <Badge className="bg-blue-600 text-white">Revenda</Badge>
          )}
          {tipoCliente === "revendedor-especial" && (
            <Badge className="bg-purple-600 text-white">Revenda Especial</Badge>
          )}
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            {cart.length} {cart.length === 1 ? "item" : "itens"}
          </Badge>
        </div>
      </div>

      {/* Info sobre produtos */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-sm text-green-700">
              💡 Produtos carregados do catálogo online
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <User className="w-4 h-4 mr-2" />
            Dados do Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              placeholder="Nome do cliente"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={!!delivery} // Se for delivery, nome vem fixo geralmente
            />
          </div>

          <div>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                {meiosPagamento.length > 0 ? (
                  meiosPagamento.map((mp) => (
                    <SelectItem key={mp.id} value={String(mp.id)}>
                      {mp.descricao}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="disabled" disabled>
                    Nenhum meio de pagamento disponível
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 gap-3 mb-40">
        {filteredProducts.map((product) => {
          const quantityInCart = getCartItemQuantity(product.id);
          const price = getProductPrice(product);

          return (
            <Card
              key={product.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{product.descricao}</h3>
                    <p className="text-sm text-muted-foreground">
                      {product.categoria || "Geral"}
                    </p>
                    <p className="text-lg font-bold text-green-600 mt-1">
                      R$ {price.toFixed(2)}
                    </p>
                    {product.produto_representante === 1 && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        Representante
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {quantityInCart > 0 ? (
                      <div className="flex items-center space-x-2 bg-blue-50 rounded-lg p-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(product.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>

                        <Input
                          type="number"
                          min="0"
                          value={quantityInCart}
                          onChange={(e) =>
                            updateQuantity(
                              product.id,
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-16 h-8 text-center"
                        />

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => addToCart(product)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => addToCart(product)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cart Summary - Fixed Bottom */}
      {cart.length > 0 && (
        <div className="sticky bottom-16 left-0 right-0 bg-white border-t border-border p-4 shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <span className="font-medium">
                  {cart.reduce((total, item) => total + item.quantity, 0)} itens
                </span>
              </div>
              <span className="text-lg font-bold text-green-600">
                R$ {getTotal().toFixed(2)}
              </span>
            </div>

            <Button
              onClick={handleFinalizeSale}
              disabled={
                isProcessing ||
                cart.length === 0 ||
                !customerName.trim() ||
                !paymentMethod
              }
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isProcessing ? "Processando..." : "Finalizar Venda"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
