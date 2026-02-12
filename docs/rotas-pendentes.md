# Análise de Completude — Rotas e Integrações

> Análise detalhada do estado atual de cada rota/página do sistema.
> Última atualização: 12/02/2026

---

## Resumo Executivo

| Status | Quantidade |
|--------|-----------|
| ✅ Integrado com API | 7 páginas |
| ⚠️ Integração Parcial / Issues | 3 páginas |
| ❌ 100% Mock/Hardcoded | 1 página |
| 🗑️ Páginas Órfãs (sem rota) | 0 páginas |

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

#### 5. PendingContracts (`/contracts`)
- **Arquivo**: [PendingContracts.tsx](file:///c:/bystartup/soda-app/src/presentation/pages/PendingContracts.tsx)
- **API**: `GET /pendencia-contrato/{vendedorId}` via `contratosApiService`
- **Status**: **Integrado (Leitura)** — Lista pendências reais
- **Pendência**: Botão "Resolver Pendência" apenas exibe toast (funcionalidade futura)

#### 6. CustomerHistory (`/customers/history`)
- **Arquivo**: [CustomerHistory.tsx](file:///c:/bystartup/soda-app/src/presentation/pages/CustomerHistory.tsx)
- **API**: `GET /vendas_vendedor/{vendedorId}` via `vendasService`
- **Status**: **Integrado (Ineficiente)** — Busca TODAS as vendas do vendedor e filtra no front-end
- **Pendência**: Idealmente backend deveria ter endpoint filtrado por cliente

---

### ⚠️ Páginas Parcialmente Integradas

#### 7. RoutesScreen (`/routes`)
- **Arquivo**: [RoutesScreen.tsx](file:///c:/bystartup/soda-app/src/presentation/pages/RoutesScreen.tsx)
- **API**: `GET /rotas/{vendedorId}` via `useRotas` hook → `rotasStore`
- **O que funciona**: Lista de rotas vem da API real
- **O que falta**:
  - `pendingDeliveries` — **mockado** como `0` (comentário: "API não retorna count ainda")
  - `priority` — **mockado** como `'medium'`
  - Fallback para `mockRoutes` se API falhar

#### 8. DeliveriesOverview (`/deliveries`)
- **Arquivo**: [DeliveriesOverview.tsx](file:///c:/bystartup/soda-app/src/presentation/pages/DeliveriesOverview.tsx)
- **API**: `GET /rotas-entregas/rota/{rotaId}` via `useRotasStore`
- **O que funciona**: Lista de clientes/entregas vem da API real (mapeados via `mapClienteToDelivery`)
- **O que falta**:
  - `orderId` e `orderCode` — **mockados** (`PED-{id}`, `SCT-{id}`)
  - `status` — **hardcoded** como `'pending'` (TODO: integrar status real)
  - `priority` — **hardcoded** como `'medium'` (TODO: integrar prioridade real)
  - `estimatedTime` — **mockado** como `'08:00'`
  - Fallback para `mockDeliveries` se sem dados

#### 9. RouteDetails (`/routes/details`)
- **Arquivo**: [RouteDetails.tsx](file:///c:/bystartup/soda-app/src/presentation/pages/RouteDetails.tsx)
- **O que funciona**: Recebe dados reais via props (vindo de `RoutesScreen` ou `DeliveriesOverview`)
- **O que falta**:
  - Comentário no código: "Mock data das entregas da rota"
  - Status das entregas gerenciado apenas localmente via `deliveryStore` (sem persistência)

#### 10. PDVStandalone (`/pdv` e `/pdv/delivery`)
- **Arquivo**: [PDVStandalone.tsx](file:///c:/bystartup/soda-app/src/presentation/pages/PDVStandalone.tsx)
- **API**: 
  - `GET /produtos/{vendedorId}` (via `produtosService`)
  - `GET /meiospagamento/{distribuidorId}` (via `pagamentosService`)
  - `POST /vendaxarope/v2` (via `vendasService`)
- **Status**: **Integrado com Issues**
- **Issue Crítica**: `vendedorId` está hardcoded como `123` dentro do `useEffect` (TODO no código)
- **O que funciona**: Carrega produtos, meios de pagamento e envia venda para API real
- **Pendência**: Remover hardcoding de ID e testar fluxo completo com dados reais do usuário logado

---

### ❌ Páginas 100% Mock / Sem Integração API

#### 11. Dashboard (`/dashboard`)
- **Arquivo**: [Dashboard.tsx](file:///c:/bystartup/soda-app/src/presentation/pages/Dashboard.tsx)
- **Problema**: Array `deliveries` **totalmente hardcoded** no componente (6 entregas fake)
- **Nome do usuário hardcoded**: "Bom dia, Ricardo!"
- **Endpoints necessários**: Deveria consumir `rotasEntregas` + dados do vendedor logado
- **Prioridade**: Baixa (parece legado, substituído por `/deliveries`)

---

### 🗑️ Páginas Órfãs (sem rota no App.tsx)

*Nenhuma página órfã detectada. (Arquivos `PDVSale.tsx` e `DeliveryCheckIn.tsx` foram removidos)*

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
| `GET /vendas_vendedor/{vendedorId}` | ✅ | ✅ CustomerList, CustomerHistory |
| `GET /vendas_pendentes/{vendedorId}` | ✅ | ✅ CustomerList |
| `GET /produtos/{vendedorId}` | ✅ | ✅ PDVStandalone |
| `GET /meiospagamento/{distribuidorId}` | ✅ | ✅ PDVStandalone |
| `POST /vendaxarope/v2` | ✅ | ✅ PDVStandalone |
| `GET /pendencia-contrato/{vendedorId}` | ✅ | ✅ PendingContracts |
| `POST /pedidoxarope/v2` | ❌ | ❌ |
| `POST /finaliza_venda/{vendaId}` | ❌ | ❌ |
| `GET /promocoes/{vendedorId}` | ❌ | ❌ PDV poderia usar |

---

## Priorização Sugerida

### 🔴 Alta Prioridade (essencial para operação)

1. **PDVStandalone — Remover HardCoding** (`/pdv` e `/pdv/delivery`)
   - **CRÍTICO**: Remover `let vendedorId = 123` em `src/presentation/pages/PDVStandalone.tsx`
   - Testar fluxo com `vendedorId` vindo do `userStore`.

2. **DeliveriesOverview — Status real das entregas**
   - Integrar status real (não hardcoded `'pending'`)
   - Calcular prioridade baseada em regras do domínio
   - Remover mock fallback

### 🟡 Média Prioridade

3. **CustomerHistory — Otimização**
   - Verificar se existe endpoint `/vendas/cliente/{id}` para evitar carregar todas as vendas do vendedor.

4. **RoutesScreen — Completar campos parciais**
   - Calcular `pendingDeliveries` real (cruzando com check-ins)
   - Calcular `priority` real

### 🟢 Baixa Prioridade

6. **Dashboard — Integrar ou remover**
   - Se for mantido: integrar com dados reais
   - Se for legado: remover rota e página

7. **Limpeza — Remover páginas órfãs**
   - Deletar `PDVSale.tsx` e `DeliveryCheckIn.tsx`
