# Documentação: Integração do Serviço de Clientes

Este documento descreve a implementação da integração da tela de Clientes (`CustomerList.tsx`) com o serviço de API, incluindo a lógica de fallback para mocks e formatação de dados.

## Visão Geral do Fluxo

1.  **Componente Inicializa (`CustomerList`)**:
    *   Ao ser montado, o `useEffect` dispara a ação `loadClientes(id)` da Store.
    *   *Nota*: Atualmente o ID do vendedor está fixo em `1` (Mockado) enquanto a autenticação não fornece o ID real.

2.  **Store Gerencia Estado (`useClientesStore`)**:
    *   A Store chama o serviço `clientesServices.getClientesXarope`.
    *   Atualiza o estado `clientes` com a resposta da API.
    *   Define `isLoading` durante a requisição.

3.  **Renderização com Fallback (Lógica de Decisão)**:
    *   O componente verifica se há clientes reais carregados (`clientes.length > 0`).
    *   **CASO SIM**: Usa os dados da Store.
    *   **CASO NÃO** (API vazia ou erro): Usa a variável `mockCustomers` definida localmente para garantir que a UI não fique vazia durante o desenvolvimento/testes.

## Transformação de Dados (Adapter)

Como o Modelo de Domínio (vindo do Banco) é diferente do que a Interface de Usuário espera, aplicamos uma transformação em tempo de execução:

| Campo UI | Fonte API | Tratamento Aplicado |
| :--- | :--- | :--- |
| **Nome** | `nome` ou `razaosocial` | Usa o primeiro disponível. |
| **Telefone** | `fone` ou `celular2` | Formata usando `formatPhone` => `(11) 99999-9999`. |
| **Endereço** | `rua`, `numero`, `bairro` | Concatena usando `formatAddress`. |
| **Status** | `ativo` (0 ou 1) | Converte para label 'ativo'/'inativo' via `mapStatusToLabel`. |
| **Datas** | `ultima_entrega` | Valida se é data válida antes de formatar, ou exibe original. |

## Utilitários Criados

Localização: `src/shared/utils/formatters.ts`

*   `formatPhone(number | string)`: Aplica máscara de telefone BR (10 ou 11 dígitos).
*   `formatAddress(rua, numero, bairro)`: Monta string de endereço legível.
*   `mapStatusToLabel(number)`: Traduz flag numérica do banco para string da UI.

## Próximos Passos Recomendados

1.  Integrar com o `AuthContext` para pegar o ID do Vendedor dinamicamente.
2.  Refinar o tratamentos de erros da API para exibir feedback visual (Toast) além do fallback.
