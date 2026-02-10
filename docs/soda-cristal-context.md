# Soda Cristal Tech App — Contexto Completo para LLMs

> Documento otimizado para fornecer contexto completo do projeto a modelos de linguagem (LLMs).
> **Última atualização:** 10/02/2026

---

## 1. Visão Geral do Projeto

**Soda Cristal Tech App** é um aplicativo de gestão de entregas e vendas para distribuidores de água com gás da **Soda Cristal**, empresa atuante em Mato Grosso do Sul e Cuiabá.

- **Público-alvo:** Vendedores/entregadores de campo
- **Plataforma:** Webview Android (APK)
- **Backend:** API Laravel existente em `https://app.sodacristal.com.br/api`
- **Objetivo:** Redesign completo do app Android legado (Java) para uma SPA moderna

### Funcionalidades Principais

| Módulo | Descrição |
|--------|-----------|
| **Entregas** | Visualizar entregas pendentes do dia, histórico de entregas concluídas |
| **Rotas** | Listagem de clientes por rota/dia, sequência de atendimento, navegação GPS |
| **Check-in** | Registro com GPS ao chegar no local (entregue, ausente, recusou) |
| **PDV** | Registro de vendas de xarope/água com múltiplas formas de pagamento |
| **Clientes** | Listagem, filtro, cadastro e histórico de compras |
| **Contratos** | Cadastro de novos clientes com envio de contrato via WhatsApp |

> **Importante:** O app **não realiza transações financeiras**, apenas registra vendas para gestão interna.

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | React + Vite | React 18.3, Vite 6.3 |
| Linguagem | TypeScript | 5.9 |
| Estilização | Tailwind CSS | via utility classes |
| Componentes UI | Radix UI + shadcn/ui | múltiplos pacotes @radix-ui |
| Estado Global | Zustand | 5.0 |
| HTTP Client | Axios | 1.13 |
| Roteamento | React Router DOM | 7.13 |
| Formulários | React Hook Form | 7.55 |
| Gráficos | Recharts | 2.15 |
| Toasts | Sonner | 2.0 |
| Ícones | Lucide React | 0.487 |

### Scripts Disponíveis

```bash
npm run dev    # Servidor de desenvolvimento (porta 3000)
npm run build  # Build de produção (output: ./build)
```

### Alias de Importação

- `@/` → `./src/` (configurado em `vite.config.ts` e `tsconfig.json`)

---

## 3. Arquitetura — Presentation / Domain / Shared

O projeto segue uma **Clean Architecture** adaptada, organizada em três camadas:

```
src/
├── main.tsx                    # Entrypoint (BrowserRouter + App)
├── App.tsx                     # Roteamento principal + guards de auth
├── index.css                   # Estilos globais (Tailwind)
│
├── presentation/               # Camada de UI (React + Tailwind)
│   ├── pages/                  # 13 páginas/rotas
│   ├── components/             # Componentes reutilizáveis de app
│   ├── layout/                 # Layouts de página (vazio atualmente)
│   └── hooks/                  # Hooks de UI
│
├── domain/                     # Regras de negócio por domínio
│   ├── auth/                   # Autenticação (User, userStore)
│   ├── clientes/               # Gestão de clientes (model, services, clienteStore)
│   ├── rotas/                  # Rotas de entrega (models, services, rotasStore)
│   ├── vendas/                 # Vendas (model, services)
│   └── deliveries/             # Entregas (models, deliveryStore)
│
└── shared/                     # Recursos compartilhados
    ├── api/                    # HTTP client + endpoints + services
    │   ├── config.ts           # BASE_URL, APP_VERSION
    │   ├── index.ts            # Instância Axios com interceptors
    │   ├── endpoints.ts        # Todos os endpoints da API
    │   └── services/           # Chamadas HTTP por domínio
    ├── store/                  # Stores globais (uiStore)
    ├── ui/                     # ~48 componentes shadcn/ui
    ├── utils/                  # Formatters + tokenValidator
    └── lib/                    # Utilitários (cn do tailwind-merge)
```

### Regras de Acesso a Dados

```
[Presentation] → [Domain Services/Stores] → [Shared API Services] → [Axios/API]
```

- Componentes **nunca** chamam `httpClient` (Axios) diretamente
- Toda transformação de dados da API acontece na camada `domain`
- Stores Zustand conectam domínio e UI

---

## 4. Sistema de Rotas (React Router)

O `App.tsx` controla toda a navegação. A autenticação é verificada antes de renderizar rotas.

```
Fluxo de Auth:
1. useUserStore.initialzedAuth() → verifica localStorage (token, vendedorId, user)
2. Se token inválido/expirado → limpa localStorage → mostra LoginScreen
3. Se autenticado → renderiza Routes + BottomNavigation
```

### Mapa de Rotas

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/` | `Navigate → /deliveries` | Redirect para entregas |
| `/deliveries` | `DeliveriesOverview` | Visão geral de entregas do dia |
| `/routes` | `RoutesScreen` | Lista de rotas do vendedor |
| `/routes/details` | `RouteDetails` | Detalhes de uma rota (lista de clientes) |
| `/checkin` | `CheckInScreen` | Check-in de entrega com status |
| `/customers` | `CustomerList` | Lista de clientes com busca |
| `/customers/history` | `CustomerHistory` | Histórico de um cliente |
| `/customers/new` | `CustomerRegistration` | Cadastro de novo cliente |
| `/contracts` | `PendingContracts` | Contratos pendentes de assinatura |
| `/pdv` | `PDVStandalone` | PDV avulso (venda direta) |
| `/pdv/delivery` | `PDVStandalone` | PDV vinculado a uma entrega |
| `/dashboard` | `Dashboard` | Painel com métricas |
| `/login` | `Navigate → /` | Redirect |

### Navegação Inferior (BottomNavigation)

5 itens fixos: **Entregas** | **Rotas** | **Sair** | **Clientes** | **PDV**

---

## 5. Domínios em Detalhe

### 5.1 Auth (`src/domain/auth/`)

**Modelo `User`:**
```typescript
interface User {
    ativo: number;
    created_at: string;
    distribuidor_id: string;
    email: string;
    email_verified_at: string;
    id: number;
    name: string;
    updated_at: string;
    username: string;
}
```

**Store `useUserStore` (Zustand):**
- **Estado:** `isLoggedIn`, `user`, `vendedorId`, `isLoading`, `isInitialized`, `error`
- **Ações:**
  - `initialzedAuth()` — Restaura sessão do localStorage, valida JWT com `isTokenValid()`
  - `login(credentials)` — POST `/login`, salva token/vendedorId/distribuidorId/user no localStorage
  - `logout()` — Limpa localStorage e reseta estado

**Dados persistidos no localStorage:**
- `auth_token` — JWT Bearer token
- `vendedorId` — ID numérico do vendedor
- `distribuidorId` — ID numérico do distribuidor
- `user` — Objeto User serializado em JSON

---

### 5.2 Clientes (`src/domain/clientes/`)

**Modelo `Clientes`:** 50+ campos incluindo dados pessoais, endereço, coordenadas GPS, perfil comercial (`cf_agua`, `cf_xarope`, `revendedor_agua`, `revendedor_xarope`), preços especiais, flags de pendência (`pendente_alteracao`, `pendente_inativacao`, `pendente_cadastro`), e campos calculados para UI (`ultima_entrega`, `proxima_entrega`, `produto_preferido`, `tipo_contrato`).

**Services (`clientesServices`):**
- `getClientesXarope(vendedorId)` — Busca clientes + vendas em paralelo (`Promise.all`), filtra ativos (`ativo === 1`), enriquece com data de última entrega calculada a partir de vendas

**Store `useClientesStore`:**
- **Estado:** `clientes`, `filteredClientes`, `isLoading`, `error`
- **Ações:** `loadClientes(vendedorId)`, `filtraClientes(termo)` (busca por nome, razão social, fone, rua, bairro)

---

### 5.3 Rotas (`src/domain/rotas/`)

**Modelos principais:**
- `Rota` — id, nome, frequencia, observacao, ativo, checkin_fechado, cidade_id
- `Cliente` — Dados completos do cliente na rota (nome, endereço, coordenadas, perfil comercial)
- `RotaEntrega` — Relacionamento rota-cliente (sequência, num_garrafas)
- `RotaEntregaCompleta` — Objeto composto: `{ rotaentrega, cliente, rota, diassematendimento, diassemconsumo }`
- `ClienteCardView` — View model para exibição em cards

**Services (`rotasService`):**
- `getRotasVendedor(vendedorId)` — Busca rotas ativas do vendedor
- `getRotasEntregasCompletas()` — Todos os clientes de todas as rotas
- `getClientesPorRota(rotaId)` — Clientes de uma rota, ordenados por sequência
- `filterClientesPorDia(clientes, dia)` — Filtra por dia de atendimento
- `calcularEstatisticas(clientes)` — Calcula totais (clientes, pendentes, garrafas)
- `calcularPrioridade(cliente)` — Determina urgente/normal/baixa
- `toClienteCardView(cliente)` — Transforma para view model
- `abrirGPS(lat, lng)` — Abre Google Maps com coordenadas

**Store `useRotasStore`:**
- **Estado:** `rotas`, `rotaAtual`, `clientesRota`, `isLoading`, `error`
- **Ações:** `loadRotas(vendedorId)`, `selectRota(rotaId)`, `loadClientesRota(rotaId)`

---

### 5.4 Vendas (`src/domain/vendas/`)

**Modelos:**
- `Venda` — id, cliente_id, data_venda, vendedor, promocao_id, venda_item[], contas_receber
- `VendaItem` — produto_id, quantidade, valor_unitario, desconto, acrescimo
- `ContasReceber` — valor total + array de Parcelas
- `Parcela` — recebido, valor, meio_pagamento_id

**Services (`vendasService`):**
- `getVendasVendedor(vendedorId)` — GET `/vendas_vendedor/{id}`
- `getVendasPendentes(vendedorId)` — GET `/vendas_pendentes/{id}`

---

### 5.5 Deliveries (`src/domain/deliveries/`)

**Modelos:**
- `Delivery` — id, orderId, customerName, address, bottles (quantity + size), status, priority, routeName
- `DeliveryStatusData` — checkInStatus, hadSale, timestamp
- `CheckInStatus` — `'delivered' | 'no-sale' | 'absent-return' | 'absent-no-return'`

**Store `useDeliveryStore`:**
- **Estado:** `selectedDelivery`, `selectedRoute`, `deliveryStatuses` (Record<string, DeliveryStatusData>)
- **Ações:** `setSelectedDelivery()`, `setSelectedRoute()`, `updateDeliveryStatus()`

> **Nota:** Este domínio usa dados mockados na UI. A integração real com a API de check-in está parcialmente implementada.

---

## 6. Camada Shared

### 6.1 HTTP Client (`shared/api/index.ts`)

Instância Axios configurada com:

**Request Interceptor:**
- Adiciona header `versaoApp: 30.19.2` (obrigatório pela API)
- Adiciona `Authorization: Bearer {token}` do localStorage

**Response Interceptor (401):**
- Exibe toast de erro via Sonner
- Limpa todo o localStorage
- Redireciona para `/login` após 2 segundos

### 6.2 Configuração (`shared/api/config.ts`)

```typescript
const API_CONFIG = {
    BASE_URL: 'https://app.sodacristal.com.br/api',
    APP_VERSION: '30.19.2',
    HEADERS: { CONTENT_TYPE: 'application/json' },
};
```

### 6.3 Endpoints (`shared/api/endpoints.ts`)

**GET (Consultas):**
| Endpoint | Parâmetro |
|----------|-----------|
| `/login` | POST, username + password |
| `/rotas/{vendedor_id}` | vendedor_id |
| `/rotas-entregas` | — |
| `/rotas-entregas/rota/{rota_id}` | rota_id |
| `/clientes/xarope/{vendedor_id}` | vendedor_id |
| `/produtos/{vendedor_id}` | vendedor_id |
| `/meiospagamento/{distribuidor_id}` | distribuidor_id |
| `/promocoes/{vendedor_id}` | vendedor_id |
| `/vendas_pendentes/{vendedor_id}` | vendedor_id |
| `/vendas_vendedor/{vendedor_id}` | vendedor_id |
| `/pendencia-contrato/{vendedor_id}` | vendedor_id |

**POST (Transações):**
| Endpoint | Descrição |
|----------|-----------|
| `/contratos/v2/cadastro-de-clientes` | Cadastro/alteração/inativação de clientes |
| `/vendaxarope/v2` | Envio de vendas de xarope |
| `/pedidoxarope/v2` | Envio de pedidos (faturamento posterior) |
| `/checkin/full/{vendedor_id}` | Check-in em lote |
| `/checkin/{vendedor_id}` | Check-in único |
| `/finaliza_venda/{venda_id}` | Marca venda como finalizada |

**Externo:**
| Endpoint | Descrição |
|----------|-----------|
| `https://viacep.com.br/ws/{cep}/json` | Busca de CEP (sem auth) |

### 6.4 API Services (`shared/api/services/`)

Três serviços que encapsulam chamadas HTTP:

- **`userService`** — `login(credentials)`, `getCurrentUser()` (valida token chamando endpoint de rotas)
- **`rotasApiService`** — `fetchRotasVendedor()`, `fetchRotasEntregas()`, `fetchRotasEntregasPorRota()`
- **`clientesService`** — `getClientesXarope(vendedorId)`

### 6.5 Utilitários (`shared/utils/`)

- **`tokenValidator.ts`** — `decodeJWT()`, `isTokenValid()` (verifica exp/nbf), `getTokenInfo()`
- **`formatters.ts`** — `formatPhone()`, `formatAddress()`, `mapStatusToLabel()`

### 6.6 UI Store (`shared/store/uiStore.ts`)

Store simples para estado de UI global: `selectedCustomer` (usado para navegação entre customer list → customer history).

### 6.7 Componentes UI (`shared/ui/`)

~48 componentes **shadcn/ui** pré-configurados: `button`, `card`, `dialog`, `tabs`, `select`, `input`, `badge`, `separator`, `scroll-area`, `sonner`, `accordion`, `avatar`, `checkbox`, `popover`, `progress`, `radio-group`, `slider`, `switch`, `toggle`, `tooltip`, entre outros.

---

## 7. Páginas da Presentation Layer

| Arquivo | Tamanho | Descrição |
|---------|---------|-----------|
| `LoginScreen.tsx` | 3.4KB | Tela de login com username/password, chama `useUserStore.login()` |
| `DeliveriesOverview.tsx` | 16KB | Visão geral de entregas do dia com filtros e cards |
| `RoutesScreen.tsx` | 9.3KB | Lista de rotas do vendedor, integrada com `useRotasStore` |
| `RouteDetails.tsx` | 15.6KB | Detalhes de rota: lista de clientes com ações (check-in, PDV, GPS) |
| `CheckInScreen.tsx` | 19.5KB | Tela complexa de check-in: status, observações, GPS |
| `CustomerList.tsx` | 9.9KB | Lista de clientes com busca, integrada com `useClientesStore` |
| `CustomerHistory.tsx` | 5.3KB | Histórico de compras de um cliente |
| `CustomerRegistration.tsx` | 9.7KB | Formulário de cadastro de novo cliente |
| `PendingContracts.tsx` | 9KB | Lista de contratos pendentes de assinatura |
| `PDVStandalone.tsx` | 12.7KB | PDV completo: seleção de produtos, formas de pagamento |
| `PDVSale.tsx` | 10.2KB | Componente de venda dentro do PDV |
| `DeliveryCheckIn.tsx` | 14KB | Componente de check-in (alternativo/legado) |
| `Dashboard.tsx` | 10.3KB | Dashboard com métricas e resumo do dia |

---

## 8. Fluxos de Negócio Principais

### 8.1 Fluxo de Login
```
LoginScreen → userService.login() → Recebe JWT + vendedor + distribuidor
  → Salva no localStorage → useUserStore.isLoggedIn = true
  → Renderiza App com BottomNavigation
```

### 8.2 Fluxo de Entrega
```
DeliveriesOverview → Seleciona entrega → setSelectedDelivery + setSelectedRoute
  → navigate('/routes/details') → RouteDetails
  → Botão Check-in → navigate('/checkin') → CheckInScreen
    → Status: delivered | no-sale | absent-return | absent-no-return
    → Se houve venda → navigate('/pdv/delivery') → PDVStandalone
    → Se não → navigate('/routes/details')
```

### 8.3 Fluxo de Rotas
```
RoutesScreen → useRotasStore.loadRotas(vendedorId) → Lista rotas ativas
  → Seleciona rota → setSelectedRoute → navigate('/routes/details')
  → RouteDetails → loadClientesRota(rotaId) → Lista clientes por sequência
    → Ações por cliente: Check-in | PDV | GPS
```

### 8.4 Fluxo de Clientes
```
CustomerList → useClientesStore.loadClientes(vendedorId)
  → filtraClientes(termo) → Busca local por nome/fone/endereço
  → Ações: Ver Histórico | Cadastrar Novo
  → CustomerRegistration → POST /contratos/v2/cadastro-de-clientes
  → PendingContracts → GET /pendencia-contrato/{vendedorId}
```

### 8.5 Fluxo de PDV
```
PDVStandalone → Seleção de produtos + quantidades
  → Forma de pagamento (Maquininha | Pix | Dinheiro)
  → POST /vendaxarope/v2 ou /pedidoxarope/v2
  → Registra venda localmente
```

---

## 9. Padrões e Convenções

### Nomenclatura
- Arquivos: `kebab-case` (ex: `token-validator.ts`)
- Componentes React: `PascalCase` (ex: `CustomerList`)
- Funções/variáveis: `camelCase` (ex: `getClientesXarope`)
- Stores Zustand: `use[Nome]Store` (ex: `useUserStore`)

### TypeScript
- TypeScript estrito em todos os arquivos
- Interfaces para objetos, types para unions
- Evitar `any` (preferir `unknown`)
- Tratamento de erros com `try/catch` + tipos `unknown`

### Arquitetura de Dados
```
API Response → shared/api/services (HTTP) → domain/services (transformação) → domain/store (estado) → presentation (UI)
```

### Estado Global (Zustand)
4 stores principais:
1. `useUserStore` — Auth + sessão
2. `useClientesStore` — Lista de clientes com filtro
3. `useRotasStore` — Rotas e clientes por rota
4. `useDeliveryStore` — Entrega selecionada e status de check-in

1 store auxiliar:
- `useUiStore` — Estado de UI (customer selecionado para navegação)

---

## 10. API Backend — Referência Rápida

- **Base URL:** `https://app.sodacristal.com.br/api`
- **Auth:** Bearer Token JWT
- **Header obrigatório:** `versaoApp: 30.19.2`
- **Backend:** Laravel (PHP)
- **IDs fundamentais:** `vendedor_id` (obtido no login), `distribuidor_id` (obtido no login)

### Tratamento de Erros
- **401** → Token expirado → Limpa sessão + redireciona para login
- **400** → Falta header `versaoApp` ou payload malformado
- **403** → Sem permissão

---

## 11. Status de Implementação

| Feature | Status | Notas |
|---------|--------|-------|
| Login/Auth | ✅ Completo | JWT + localStorage + validação de expiração |
| Rotas | ✅ Completo | Integrado com API |
| Clientes | ✅ Completo | Listagem + filtro + enriquecimento com vendas |
| Vendas (leitura) | ✅ Completo | GET vendas_vendedor + vendas_pendentes |
| Entregas | ⚠️ Parcial | UI completa, dados parcialmente mockados |
| Check-in | ⚠️ Parcial | UI completa, POST para API não integrado |
| PDV | ⚠️ Parcial | UI completa, POST para API não integrado |
| Cadastro Cliente | ⚠️ Parcial | Formulário montado, POST parcial |
| Dashboard | ⚠️ Parcial | UI com dados mockados |
| Contratos | ⚠️ Parcial | Tela montada, integração pendente |

---

## 12. Dependências Externas Relevantes

| Pacote | Uso no Projeto |
|--------|---------------|
| `zustand` | Gerenciamento de estado global (4 stores) |
| `axios` | Client HTTP com interceptors de auth |
| `react-router-dom` | Roteamento SPA |
| `sonner` | Toasts de notificação |
| `lucide-react` | Ícones em toda a UI |
| `@radix-ui/*` | Primitivos de acessibilidade (shadcn/ui) |
| `class-variance-authority` | Variantes de componentes (shadcn/ui) |
| `tailwind-merge` + `clsx` | Merge inteligente de classes Tailwind |
| `react-hook-form` | Formulários (cadastro de cliente) |
| `recharts` | Gráficos no dashboard |
| `react-day-picker` | Seletor de data |
| `vaul` | Drawer/bottom sheet |
| `embla-carousel-react` | Carrossel de imagens |

---

*Documento gerado em 10/02/2026 — Baseado na análise completa do código-fonte do projeto Soda Cristal Tech App.*
