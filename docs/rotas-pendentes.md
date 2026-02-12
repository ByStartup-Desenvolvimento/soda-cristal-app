# Análise de Completude — Rotas e Integrações

> Análise detalhada do estado atual de cada rota/página do sistema.
> Última atualização: 12/02/2026

---

## Resumo Executivo

| Status | Quantidade |
|--------|-----------|
| ✅ Integrado com API | 4 páginas |
| ⚠️ Parcialmente integrado | 3 páginas |
| ❌ 100% Mock/Hardcoded | 4 páginas |
| 🗑️ Páginas Órfãs (sem rota) | 2 páginas |

---

## Status Detalhado por Página

### ✅ Páginas Integradas com a API

#### 1. LoginScreen (`/login`)
- **Arquivo**: [LoginScreen.tsx](file:///c:/bystartup/soda-app/src/presentation/pages/LoginScreen.tsx)
- **API**: `POST /login` via `useUserStore` → `userService`
- **Status**: **100% funcional** — Autenticação real com token

#### 2. CustomerList (`/customers`)
- **Arquivo**: [CustomerList.tsx](file:///c:/bystartup/soda-app/src/presentation/pages/CustomerList.tsx)
- **API**: `GET /clientes/xarope/{vendedorId}` + `GET /vendas_vendedor/{id}` + `GET /vendas_pendentes/{id}`
- **Status**: **Integrado** — Consome API real com fallback para mock se array vazio
- **Pendência menor**: Remover mock fallback quando estabilizar

#### 3. CustomerRegistration (`/customers/new`)
- **Arquivo**: [CustomerRegistration.tsx](file:///c:/bystartup/soda-app/src/presentation/pages/CustomerRegistration.tsx)
- **API**: `POST /contratos/v2/cadastro-de-clientes` + CEP via ViaCEP
- **Status**: **Integrado** — Cadastro real de clientes
- **Pendência menor**: Campo `rota` hardcoded como "Rota Padrão" (TODO no código)

#### 4. CheckInScreen (`/checkin`)
- **Arquivo**: [CheckInScreen.tsx](file:///c:/bystartup/soda-app/src/presentation/pages/CheckInScreen.tsx)
- **API**: `POST /checkin/full/{vendedorId}` + `POST /checkin/{vendedorId}`
- **Status**: **Integrado** — Check-in real via `checkInService`

---

### ⚠️ Páginas Parcialmente Integradas

#### 5. RoutesScreen (`/routes`)
- **Arquivo**: [RoutesScreen.tsx](file:///c:/bystartup/soda-app/src/presentation/pages/RoutesScreen.tsx)
- **API**: `GET /rotas/{vendedorId}` via `useRotas` hook → `rotasStore`
- **O que funciona**: Lista de rotas vem da API real
- **O que falta**:
  - `pendingDeliveries` — **mockado** como `0` (comentário: "API não retorna count ainda")
  - `priority` — **mockado** como `'medium'`
  - Fallback para `mockRoutes` se API falhar

#### 6. DeliveriesOverview (`/deliveries`)
- **Arquivo**: [DeliveriesOverview.tsx](file:///c:/bystartup/soda-app/src/presentation/pages/DeliveriesOverview.tsx)
- **API**: `GET /rotas-entregas/rota/{rotaId}` via `useRotasStore`
- **O que funciona**: Lista de clientes/entregas vem da API real (mapeados via `mapClienteToDelivery`)
- **O que falta**:
  - `orderId` e `orderCode` — **mockados** (`PED-{id}`, `SCT-{id}`)
  - `status` — **hardcoded** como `'pending'` (TODO: integrar status real)
  - `priority` — **hardcoded** como `'medium'` (TODO: integrar prioridade real)
  - `estimatedTime` — **mockado** como `'08:00'`
  - Fallback para `mockDeliveries` se sem dados

#### 7. RouteDetails (`/routes/details`)
- **Arquivo**: [RouteDetails.tsx](file:///c:/bystartup/soda-app/src/presentation/pages/RouteDetails.tsx)
- **O que funciona**: Recebe dados reais via props (vindo de `RoutesScreen` ou `DeliveriesOverview`)
- **O que falta**:
  - Comentário no código: "Mock data das entregas da rota"
  - Status das entregas gerenciado apenas localmente via `deliveryStore` (sem persistência)

---

### ❌ Páginas 100% Mock / Sem Integração API

#### 8. Dashboard (`/dashboard`)
- **Arquivo**: [Dashboard.tsx](file:///c:/bystartup/soda-app/src/presentation/pages/Dashboard.tsx)
- **Problema**: Array `deliveries` **totalmente hardcoded** no componente (6 entregas fake)
- **Nome do usuário hardcoded**: "Bom dia, Ricardo!"
- **Endpoints necessários**: Deveria consumir `rotasEntregas` + dados do vendedor logado
- **Prioridade**: Baixa (parece legado, substituído por `/deliveries`)

#### 9. PDVStandalone (`/pdv` e `/pdv/delivery`)
- **Arquivo**: [PDVStandalone.tsx](file:///c:/bystartup/soda-app/src/presentation/pages/PDVStandalone.tsx)
- **Problema**: 
  - Lista de `products` **totalmente hardcoded** (18 produtos fake)
  - `handleFinalizeSale` usa **setTimeout simulando API** (não chama nenhum endpoint)
  - Meios de pagamento **hardcoded** (Dinheiro, PIX, Cartão, Transferência)
- **Endpoints disponíveis não usados**:
  - `GET /produtos/{vendedorId}` — para carregar produtos reais
  - `GET /meiospagamento/{distribuidorId}` — para carregar meios de pagamento reais
  - `POST /vendaxarope/v2` ou `POST /pedidoxarope/v2` — para enviar a venda
  - `POST /finaliza_venda/{vendaId}` — para finalizar

#### 10. PendingContracts (`/contracts`)
- **Arquivo**: [PendingContracts.tsx](file:///c:/bystartup/soda-app/src/presentation/pages/PendingContracts.tsx)
- **Problema**: Array `contracts` **totalmente hardcoded** (5 contratos fake)
- **Endpoint disponível não usado**:
  - `GET /pendencia-contrato/{vendedorId}` — existe no `endpoints.ts` mas **nenhum serviço consome**

#### 11. CustomerHistory (`/customers/history`)
- **Arquivo**: [CustomerHistory.tsx](file:///c:/bystartup/soda-app/src/presentation/pages/CustomerHistory.tsx)
- **Problema**: Array `history` **totalmente hardcoded** (4 registros fake)
- **Endpoint necessário**: Não identificado na API atual — pode ser necessário um endpoint novo ou usar vendas do cliente

---

### 🗑️ Páginas Órfãs (sem rota no App.tsx)

| Arquivo | Substituída por | Ação recomendada |
|---------|----------------|------------------|
| [PDVSale.tsx](file:///c:/bystartup/soda-app/src/presentation/pages/PDVSale.tsx) | `PDVStandalone` | Deletar |
| [DeliveryCheckIn.tsx](file:///c:/bystartup/soda-app/src/presentation/pages/DeliveryCheckIn.tsx) | `CheckInScreen` | Deletar |

---

## Endpoints Existentes vs Consumo

| Endpoint | Service Existe? | Consumido na UI? |
|----------|:-:|:-:|
| `POST /login` | ✅ | ✅ LoginScreen |
| `GET /rotas/{vendedorId}` | ✅ | ✅ RoutesScreen |
| `GET /rotas-entregas` | ✅ | ✅ DeliveriesOverview |
| `GET /rotas-entregas/rota/{rotaId}` | ✅ | ✅ DeliveriesOverview |
| `GET /clientes/xarope/{vendedorId}` | ✅ | ✅ CustomerList |
| `POST /contratos/v2/cadastro-de-clientes` | ✅ | ✅ CustomerRegistration |
| `POST /checkin/full/{vendedorId}` | ✅ | ✅ CheckInScreen |
| `POST /checkin/{vendedorId}` | ✅ | ✅ CheckInScreen |
| `GET /vendas_vendedor/{vendedorId}` | ✅ | ✅ CustomerList (enriquecimento) |
| `GET /vendas_pendentes/{vendedorId}` | ✅ | ✅ CustomerList (enriquecimento) |
| `GET /produtos/{vendedorId}` | ❌ | ❌ **PDV precisa** |
| `GET /meiospagamento/{distribuidorId}` | ❌ | ❌ **PDV precisa** |
| `GET /promocoes/{vendedorId}` | ❌ | ❌ PDV poderia usar |
| `POST /vendaxarope/v2` | ❌ | ❌ **PDV precisa** |
| `POST /pedidoxarope/v2` | ❌ | ❌ **PDV precisa** |
| `POST /finaliza_venda/{vendaId}` | ❌ | ❌ **PDV precisa** |
| `GET /pendencia-contrato/{vendedorId}` | ❌ | ❌ **PendingContracts precisa** |

---

## Priorização Sugerida

### 🔴 Alta Prioridade (essencial para operação)

1. **PDV — Integração completa** (`/pdv` e `/pdv/delivery`)
   - Criar `domain/produtos/` (models + services) → endpoint `GET /produtos/{vendedorId}`
   - Criar `domain/pagamentos/` (models + services) → endpoint `GET /meiospagamento/{distribuidorId}`
   - Integrar `POST /vendaxarope/v2` no fluxo de finalizar venda
   - Integrar `POST /finaliza_venda/{vendaId}` se necessário
   - **Impacto**: Sem isso, nenhuma venda é registrada no sistema

2. **DeliveriesOverview — Status real das entregas**
   - Integrar status real (não hardcoded `'pending'`)
   - Calcular prioridade baseada em regras do domínio
   - Remover mock fallback

### 🟡 Média Prioridade

3. **PendingContracts — Integrar com API**
   - Criar service para `GET /pendencia-contrato/{vendedorId}`
   - Substituir dados hardcoded

4. **CustomerHistory — Integrar com dados reais**
   - Usar `vendas_vendedor` para montar histórico real do cliente
   - Ou identificar endpoint específico na API

5. **RoutesScreen — Completar campos parciais**
   - Calcular `pendingDeliveries` real (cruzando com check-ins)
   - Calcular `priority` real

### 🟢 Baixa Prioridade

6. **Dashboard — Integrar ou remover**
   - Se for mantido: integrar com dados reais
   - Se for legado: remover rota e página

7. **Limpeza — Remover páginas órfãs**
   - Deletar `PDVSale.tsx` e `DeliveryCheckIn.tsx`
