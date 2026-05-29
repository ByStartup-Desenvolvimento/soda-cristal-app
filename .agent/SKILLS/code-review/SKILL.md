---
name: code-review
description: Skill de Code Review para o projeto Soda Cristal Tech App. Use para revisar código implementado, verificar aderência aos padrões de design/arquitetura do projeto, planejar ou rodar testes funcionais e E2E, e gerar um relatório de qualidade do código antes da entrega final. Triggers on "revisar código", "code review", "analisar pr", "revisão de código", "verificar padrões".
---

# Skill de Code Review — Soda Cristal Tech App

Esta skill orienta o agente a realizar uma revisão sistemática e rigorosa do código implementado no projeto Soda Cristal Tech App, garantindo conformidade com a arquitetura **Presentation / Domain / Shared**, padrões de design, qualidade de código e bom funcionamento dos fluxos de negócio.

> **Referência**: Consulte `docs/soda-cristal-context.md` para contexto completo do projeto.

---

## Checklist de Padrões do Projeto Soda Cristal

Antes de aprovar qualquer alteração, verifique os seguintes itens obrigatórios:

### 1. Arquitetura de Camadas (Presentation / Domain / Shared)
* [ ] **Fluxo de dados correto**: `Presentation → Domain (services/stores) → Shared (API services) → Axios/API`
  * *Verificação*: Componentes em `presentation/` **nunca** devem importar diretamente de `shared/api/` (httpClient/Axios). Devem usar serviços do domínio ou stores Zustand.
* [ ] **Separação de domínios**: Cada domínio (`auth`, `clientes`, `rotas`, `vendas`, `deliveries`) está contido em sua própria pasta dentro de `src/domain/`.
  * *Verificação*: Lógica de negócio não deve existir em componentes de página. Extraia para hooks, services ou stores.
* [ ] **Organização de arquivos**: Novos arquivos seguem a estrutura existente:
  * Páginas em `src/presentation/pages/`
  * Componentes reutilizáveis em `src/presentation/components/`
  * Layouts em `src/presentation/layout/`
  * Hooks de UI em `src/presentation/hooks/`
  * Serviços HTTP em `src/shared/api/services/`
  * Componentes genéricos em `src/shared/ui/`

### 2. Estilização e UI
* [ ] **Tailwind CSS**: Toda estilização deve usar classes Tailwind. Proibido CSS inline (`style={{}}`) exceto para valores dinâmicos calculados em runtime.
  * *Verificação*: Procure por objetos `style` hardcoded e exija migração para classes Tailwind.
* [ ] **Componentes shadcn/ui**: Use os componentes existentes em `src/shared/ui/` (Button, Card, Dialog, Tabs, Input, Badge, etc.) em vez de criar componentes customizados duplicados.
  * *Verificação*: Antes de criar um novo componente UI, verifique se já existe um equivalente em `shared/ui/`.
* [ ] **Utilitário `cn()`**: Merge de classes Tailwind deve usar a função `cn()` de `@/shared/lib/utils`.
  * *Verificação*: Proibido concatenação manual de strings para classes condicionais.
* [ ] **Responsividade**: Componentes devem funcionar adequadamente na viewport mobile (o app roda como Webview Android).

### 3. Ícones
* [ ] **Pacote Único**: Use exclusivamente `lucide-react`.
  * *Verificação*: Rejeite qualquer importação de outros pacotes de ícones (como `react-icons`, `heroicons`, `@mui/icons`, etc.) a menos que haja aprovação explícita.

### 4. Interface e UX
* [ ] **Feedback de Ações**: Verifique se o usuário tem feedback visual (loaders, skeletons, toasts via `sonner`) para ações assíncronas ou que demorem a responder.
* [ ] **Estados de Loading/Erro**: Componentes que consomem dados de stores Zustand devem tratar os estados `isLoading` e `error` adequadamente.
* [ ] **Toasts**: Notificações ao usuário devem usar a biblioteca `sonner` (já configurada). Proibido `alert()` ou `window.confirm()`.

### 5. TypeScript e Validação de Dados
* [ ] **Strict Mode**: Garanta tipagem estrita de dados.
* [ ] **Sem `any` ou `enum`**:
  * Proibido o uso de `any` (substitua por `unknown` ou defina o tipo correto).
  * Proibido o uso de `enum` (substitua por objetos de constantes com `as const` ou union types).
* [ ] **Interfaces vs Types**: Use `interface` para objetos e `type` apenas para unions/intersections.
* [ ] **Validação com Zod**: Dados de formulários ou payloads de API devem ser validados usando **Zod**.

### 6. Estado Global (Zustand)
* [ ] **Stores existentes**: Verifique se a alteração utiliza as stores corretas:
  * `useUserStore` — Auth + sessão
  * `useClientesStore` — Lista de clientes com filtro
  * `useRotasStore` — Rotas e clientes por rota
  * `useDeliveryStore` — Entrega selecionada e status de check-in
  * `useUiStore` — Estado de UI global
* [ ] **Convenção de nomes**: Novas stores devem seguir o padrão `use[Nome]Store`.
* [ ] **Sem estado duplicado**: Não crie estado local (`useState`) para dados que já existem em uma store Zustand.

### 7. Backend (API Laravel)
* [ ] **HTTP Client**: Todas as chamadas HTTP devem utilizar a instância Axios configurada em `src/shared/api/index.ts`.
  * *Verificação*: Proibido `fetch()` nativo ou novas instâncias de Axios.
* [ ] **Endpoints centralizados**: Novos endpoints devem ser registrados em `src/shared/api/endpoints.ts`.
* [ ] **Services separados**: Chamadas HTTP devem ser encapsuladas em services dentro de `src/shared/api/services/` ou `src/domain/<domínio>/services.ts`.
* [ ] **Tratamento de Erros**: Erros da API devem ser devidamente capturados com `try/catch`, tratados e exibidos ao usuário de forma amigável via toasts (sem expor stack traces ou mensagens técnicas brutas).
* [ ] **Header `versaoApp`**: O interceptor do Axios já adiciona automaticamente `versaoApp: 30.19.2`. Não adicione manualmente.
* [ ] **Auth Token**: O interceptor do Axios já injeta o `Authorization: Bearer {token}`. Não adicione manualmente.

### 8. Roteamento (React Router DOM)
* [ ] **Rotas declaradas**: Novas rotas devem ser adicionadas em `src/App.tsx`.
* [ ] **Navegação**: Use `useNavigate()` do `react-router-dom` para navegação programática. Proibido `window.location`.
* [ ] **BottomNavigation**: Se uma nova rota principal for criada, verifique se precisa ser adicionada ao `BottomNavigation`.

### 9. Formulários (React Hook Form)
* [ ] **React Hook Form**: Formulários devem usar `react-hook-form` com resolvers Zod (`@hookform/resolvers`).
  * *Verificação*: Proibido `onChange` manual + `useState` para formulários complexos.

### 10. Imports e Aliases
* [ ] **Alias `@/`**: Todas as importações internas devem usar o alias `@/` (mapeado para `./src/`).
  * *Verificação*: Proibido imports relativos profundos como `../../../shared/api`.

---

## Validação de Compilação e Qualidade Estática

O agente deve rodar os comandos a seguir no terminal do projeto para assegurar que a base de código permanece íntegra:

1. **TypeScript (Checagem de Tipos)**:
   ```bash
   npx tsc --noEmit
   ```

2. **Build de Produção** (se houver alterações significativas):
   ```bash
   npm run build
   ```

---

## Validação Funcional e E2E (End-to-End)

O projeto utiliza **Playwright** como framework de testes E2E:

1. **Rodar Testes Existentes**:
   ```bash
   npm run test:e2e
   ```

2. **Mapeamento de Fluxos**: Mapeie os fluxos de ponta a ponta afetados pela tarefa. Fluxos principais:
   * Login → Auth → Redirect para `/deliveries`
   * Entregas → Seleção → Check-in → PDV (opcional)
   * Rotas → Detalhes → Lista de Clientes → Ações (Check-in, PDV, GPS)
   * Clientes → Busca/Filtro → Histórico | Cadastro
   * PDV → Seleção de Produtos → Pagamento → Envio

3. **Roteamento**: Verifique se a navegação entre as telas afetadas está correta e se não há caminhos quebrados.

4. **Casos de Erro**: Valide o comportamento quando ocorrem falhas:
   * Token expirado (401 → redirect para login)
   * Sem conexão de internet
   * Campos inválidos no formulário
   * Erro da API Laravel (400, 403, 500)

5. **Mock ou Massa de Testes**: Sugira a massa de dados ideal ou mocks que validam o comportamento e a lógica de negócio dos componentes afetados.

---

## Estrutura do Relatório de Code Review

Ao final da análise, gere um relatório de Code Review no seguinte formato:

```markdown
# Relatório de Code Review: [Nome da Tarefa/Feature]

## 1. Resumo da Análise
* **Status Final**: [APROVADO] ou [REQUER AJUSTES]
* **Arquivos Modificados/Analisados**:
  * [basename](file:///caminho/do/arquivo) - [Breve descrição do propósito do arquivo]

## 2. Aderência às Regras do Projeto (Checklist)
* [Sim/Não/N/A] Arquitetura de camadas respeitada (Presentation → Domain → Shared)
* [Sim/Não/N/A] Estilização apenas com Tailwind CSS + shadcn/ui
* [Sim/Não/N/A] Ícones apenas de `lucide-react`
* [Sim/Não/N/A] Sem uso de `any` ou `enum`
* [Sim/Não/N/A] Validações feitas com Zod
* [Sim/Não/N/A] HTTP via instância Axios centralizada
* [Sim/Não/N/A] Endpoints em `endpoints.ts`
* [Sim/Não/N/A] Tratamento amigável de erros da API
* [Sim/Não/N/A] Imports usando alias `@/`
* [Sim/Não/N/A] Stores Zustand usadas corretamente

## 3. Validação de Compilação e Qualidade Estática
* **Resultado do TypeScript check (`tsc --noEmit`)**: [Sucesso / Erros identificados]
* **Resultado do Build (`npm run build`)**: [Sucesso / Erros identificados]

## 4. Validação E2E (Playwright)
* **Resultado dos testes**: [Sucesso / Falhas identificadas]
* **Fluxos impactados testados**: [Lista dos fluxos verificados]

## 5. Pendências Identificadas (Bloqueantes)
*(Descreva aqui qualquer falha que impeça a aprovação do código, com links para os arquivos e trechos exatos do código.)*

## 6. Sugestões de Melhoria (Não Bloqueantes)
*(Otimizações de performance, refatorações simples ou sugestões de arquitetura.)*
```

---

## Instruções para o Ciclo de Correção

Se o status final for **REQUER AJUSTES**:
1. O agente principal deve consolidar o relatório de Code Review.
2. Invoque um subagente especializado (ou crie um ciclo de tarefas corretivas) repassando o relatório gerado.
3. O subagente deve focar especificamente em corrigir os itens listados no relatório.
4. Após as correções, a revisão (Code Review) deve ser executada novamente.
