export const ENDPOINTS = {

    // Autenticação
    LOGIN: '/login',

    // Rotas e Clientes
    rotasVendedor: (vendedorId: number) => `/rotas/${vendedorId}`,
    rotasEntregas: '/rotas-entregas',
    rotasEntregasRota: (rotaId: number) => `/rotas-entregas/rota/${rotaId}`,
    clientesXarope: (distribuidorId: number) => `/clientes/xarope/${distribuidorId}`,

    // Sincronização (GET)
    produtos: (vendedorId: number) => `/produtos/${vendedorId}`,
    meiosPagamento: (distribuidorId?: number) => `/meiospagamento/${distribuidorId}`,
    promocoes: (vendedorId: number) => `/promocoes/${vendedorId}`,
    vendasPendentes: (vendedorId: number) => `/vendas_pendentes/${vendedorId}`,
    vendasVendedor: (vendedorId: number) => `/vendas_vendedor/${vendedorId}`,
    pendenciaContrato: (vendedorId: number) => `/pendencia-contrato/${vendedorId}`,

    // Transações (POST)
    contratosV2CadastroClientes: '/contratos/v2/cadastro-de-clientes',
    vendaXaropeV2: '/vendaxarope/v2',
    pedidoXaropeV2: '/pedidoxarope/v2',
    checkinFull: (vendedorId: number) => `/checkin/full/${vendedorId}`,
    checkin: (vendedorId: number) => `/checkin/${vendedorId}`,
    finalizarVenda: (vendaId: number) => `/finaliza_venda/${vendaId}`,

    // Utilitários
    cep: (cep: string) => `https://viacep.com.br/ws/${cep}/json`,  // Externo, sem auth
} as const;
