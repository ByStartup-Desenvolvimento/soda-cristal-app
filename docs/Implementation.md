# Implementar Cadastro de Novo Cliente

Integrar o formulário `CustomerRegistration.tsx` (atualmente mockado) ao endpoint real `POST /contratos/v2/cadastro-de-clientes`, seguindo a arquitetura `domain/shared/presentation` do projeto. Validação com **ZOD** + **react-hook-form**.

## User Review Required

> [!IMPORTANT]
> O formulário atual tem campos simplificados (name, email, phone, address, neighborhood, city, reference, contractType). A API espera **muitos mais campos** (CPF/CNPJ, RG, data nascimento, CEP, número, complemento, qtd garrafas, dia de reposição, flags de revendedor/xarope, rota, etc.). O plano propõe **adicionar todos os campos obrigatórios da API** no formulário, organizados em seções.

> [!WARNING]
> A busca de CEP via ViaCEP (`https://viacep.com.br/ws/{cep}/json`) será implementada para auto-preenchimento de endereço. O endpoint já está mapeado em `endpoints.ts`.

---

## Dependências a Instalar

```bash
npm install zod react-hook-form @hookform/resolvers
```

- **zod** — schema de validação
- **react-hook-form** — gerenciamento de formulário performático
- **@hookform/resolvers** — integração zod + react-hook-form

---

## Proposed Changes

### Domínio Clientes (`src/domain/clientes/`)

#### [MODIFY] [model.ts](file:///c:/bystartup/soda-app/src/domain/clientes/model.ts)
- Criar interface `ClienteCadastroPayload` com os campos do payload da API:
  - `nome`, `cpf_cnpj`, `rg`, `data_nascimento`, `telefone`, `telefone2`
  - `cep`, `endereco`, `bairro`, `numero`, `complemento`
  - `qtd_garrafa`, `qtd_garrafa_comprada`, `dia_reposicao`, `obs`
  - `vendedor`, `tipo_cadastro`, `rota`
  - Flags: `revendedor_xarope`, `revendedor_agua`, `cf_xarope`, `cf_agua`, `precoespecial_agua`, `precoespecial_xarope`
  - `data_inativacao`, `cliente_id_api`
- Criar interface `CadastroContratosPayload` (wrapper do POST):
  ```typescript
  interface CadastroContratosPayload {
    contratos: {
      novosContratos: ClienteCadastroPayload[];
      alteracaoContrato: ClienteCadastroPayload[];
      inativacoes: ClienteCadastroPayload[];
    };
  }
  ```
- Criar schema ZOD `clienteCadastroSchema` com validações:
  - `nome`: string min 3
  - `cpf_cnpj`: string min 11, max 18
  - `telefone`: string min 10
  - `cep`: string length 8-9
  - `endereco`, `bairro`, `numero`: obrigatórios
  - `qtd_garrafa`: number min 1
  - `dia_reposicao`: string obrigatório
  - Demais campos opcionais com defaults

---

#### [MODIFY] [services.ts](file:///c:/bystartup/soda-app/src/domain/clientes/services.ts)
- Adicionar método `cadastrarCliente(payload: ClienteCadastroPayload)`:
  - Monta o `CadastroContratosPayload` com o payload no array `novosContratos`
  - Chama `clientesService.cadastrarCliente(body)` da camada shared/api
  - Retorna resposta da API

---

### Shared API (`src/shared/api/`)

#### [MODIFY] [clientesServices.ts](file:///c:/bystartup/soda-app/src/shared/api/services/clientesServices.ts)
- Adicionar método HTTP:
  ```typescript
  cadastrarCliente: async (payload: CadastroContratosPayload) => {
    const response = await api.post(ENDPOINTS.contratosV2CadastroClientes, payload);
    return response.data;
  }
  ```

---

### Store (`src/domain/clientes/`)

#### [MODIFY] [clienteStore.ts](file:///c:/bystartup/soda-app/src/domain/clientes/clienteStore.ts)
- Adicionar estado `isSubmitting: boolean`
- Adicionar action `cadastrarCliente(payload)`:
  - Seta `isSubmitting: true`
  - Chama `clientesServices.cadastrarCliente(payload)`
  - Em sucesso: seta `isSubmitting: false`, retorna `true`
  - Em erro: seta `error`, `isSubmitting: false`, retorna `false`

---

### Presentation (`src/presentation/pages/`)

#### [MODIFY] [CustomerRegistration.tsx](file:///c:/bystartup/soda-app/src/presentation/pages/CustomerRegistration.tsx)
Refatorar completo do formulário:

**Estado do formulário** — trocar o `customerData` atual por objeto tipado `ClienteCadastroPayload` com todos os campos da API.

**Seções do formulário:**
1. **Dados Pessoais**: nome*, CPF/CNPJ*, RG, data de nascimento, telefone*, telefone2
2. **Endereço**: CEP* (com auto-preenchimento via ViaCEP), endereço*, bairro*, número*, complemento
3. **Contrato**: qtd garrafas*, qtd garrafas compradas, dia de reposição*, observações, rota
4. **Configurações**: checkboxes para `cf_agua`, `cf_xarope`, `revendedor_agua`, `revendedor_xarope`, `precoespecial_agua`, `precoespecial_xarope`

**Integração:**
- Usar `react-hook-form` com `zodResolver(clienteCadastroSchema)` para gerenciar formulário
- Usar `useClientesStore` para chamar `cadastrarCliente`
- Usar `useUserStore` para pegar `vendedorId` (preencher campo `vendedor` automaticamente)
- Remover `setTimeout` mockado do `handleSubmit`
- Implementar busca de CEP via ViaCEP com `fetch` direto (API externa, sem auth)
- Toast de sucesso/erro via `sonner`
- Erros de validação exibidos inline via `formState.errors` do react-hook-form

---

### Shared Utils (caso necessário)

#### [MODIFY ou NEW] Utilitários de formatação
- Se necessário, adicionar máscaras de input (CPF, CEP, telefone) em `src/shared/utils/formatters.ts` ou em hooks/helpers específicos do formulário

---

### App.tsx

#### [MODIFY] [App.tsx](file:///c:/bystartup/soda-app/src/App.tsx)
- Ajustar `onSuccess` do `CustomerRegistration`:
  - Atualmente navega para `/contracts`
  - Mudar para navegar para `/customers` (volta para lista de clientes após cadastro com sucesso)

---

## Verification Plan

### Verificação via Browser

> [!NOTE]
> O projeto não possui testes automatizados. A verificação será feita via browser.

1. **Build check**: Rodar `npm run dev` e verificar que não há erros de compilação
2. **Navegação**: Acessar `/customers` → clicar "Novo Cliente" → verificar que formulário novo abre com todos os campos
3. **Busca de CEP**: Digitar CEP válido (ex: `01310100`) e verificar auto-preenchimento de endereço, bairro
4. **Submit com campos obrigatórios vazios**: Verificar que botão fica desabilitado
5. **Submit com dados válidos**: Preencher formulário e submeter → verificar chamada POST na aba Network do DevTools → verificar toast de sucesso e redirecionamento para `/customers`
6. **Submit com erro**: Simular erro (ex: dados inválidos) → verificar toast de erro

### Verificação Manual pelo Usuário

O usuário deve validar:
- Se os campos do formulário estão corretos para o fluxo de negócio
- Se o payload enviado bate com o esperado pela API
- Se a resposta da API é tratada adequadamente
