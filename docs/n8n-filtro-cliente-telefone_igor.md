# 📞 N8N — Filtro de Clientes por Telefone

> Workflow para buscar clientes da Soda Cristal por número de telefone via N8N e retornar a resposta no chat.

**Última atualização:** 11/05/2026

---

## 📋 Contexto

A API Soda Cristal **não possui** um endpoint dedicado para buscar clientes por telefone (ex: `/cliente/buscar/{telefone}`). A estratégia recomendada é:

1. Autenticar na API
2. Buscar todos os clientes via `GET /rotas-entregas`
3. Filtrar por telefone usando um nó **Code** no N8N

---

## 🔗 Fluxo do Workflow

```
[Chat Trigger] → [Login API] → [Buscar Clientes] → [Filtrar por Telefone + Responder]
```

---

## 📦 Configuração dos Nós

### Nó 1 — Chat Trigger (ou Webhook)

**Tipo:** `Chat Trigger` ou `Webhook`

Se estiver usando o **AI Agent / Chat**, use o trigger de chat padrão. O telefone virá na mensagem do usuário.

Se for **Webhook**, configure:

| Campo | Valor |
|---|---|
| **Method** | `POST` |
| **Path** | `/buscar-cliente-telefone` |

**Body esperado:**
```json
{
  "telefone": "11999999999"
}
```

---

### Nó 2 — Login na API Soda Cristal

**Tipo:** `HTTP Request`

| Campo | Valor |
|---|---|
| **Method** | `POST` |
| **URL** | `https://app.sodacristal.com.br/api/login` |

**Headers:**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |
| `versaoApp` | `30.19.2` |

**Body (JSON):**
```json
{
  "username": "SEU_USUARIO",
  "password": "SUA_SENHA"
}
```

> [!TIP]
> Use **Credentials** do N8N ou um nó **Set** com variáveis de ambiente para não expor credenciais no workflow.

---

### Nó 3 — Buscar Todos os Clientes

**Tipo:** `HTTP Request`

| Campo | Valor |
|---|---|
| **Method** | `GET` |
| **URL** | `https://app.sodacristal.com.br/api/rotas-entregas` |

**Headers:**

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |
| `versaoApp` | `30.19.2` |
| `Authorization` | `Bearer {{ $json.access_token }}` |

> [!IMPORTANT]
> O header `versaoApp: 30.19.2` é **obrigatório**. Sem ele, a API retorna erro 400 ou 403.

---

### Nó 4 — Filtrar por Telefone e Responder

**Tipo:** `Code`

```javascript
// Pega o telefone da mensagem do chat ou do webhook
const input = $('Chat Trigger').first().json.chatInput
  || $('Webhook').first().json.body.telefone
  || '';

// Limpa o telefone de entrada (só números)
const telefoneBusca = input.replace(/\D/g, '');

if (!telefoneBusca) {
  return [{
    json: {
      encontrado: false,
      mensagem: '⚠️ Nenhum telefone informado para busca.'
    }
  }];
}

// Pega todos os clientes do nó anterior
const clientes = $('Buscar Clientes').first().json;

// Filtra clientes que batem com o telefone (fone ou celular2)
const resultados = (Array.isArray(clientes) ? clientes : [clientes])
  .filter(item => {
    const cliente = item.cliente;
    if (!cliente) return false;

    const fone1 = String(cliente.fone || '').replace(/\D/g, '');
    const fone2 = String(cliente.celular2 || '').replace(/\D/g, '');

    return fone1.includes(telefoneBusca) || fone2.includes(telefoneBusca);
  })
  .map(item => ({
    id: item.cliente.id,
    nome: item.cliente.nome,
    telefone: item.cliente.fone,
    telefone2: item.cliente.celular2 || 'Não informado',
    endereco: `${item.cliente.rua}, ${item.cliente.numero} - ${item.cliente.bairro}`,
    cep: item.cliente.cep,
    rota: item.rota?.nome || 'Sem rota',
    ativo: item.cliente.ativo === 1 ? '✅ Ativo' : '❌ Inativo',
    observacao: item.cliente.observacao || ''
  }));

if (resultados.length === 0) {
  return [{
    json: {
      encontrado: false,
      mensagem: `❌ Nenhum cliente encontrado com o telefone: ${telefoneBusca}`
    }
  }];
}

// Formata a resposta para o chat
const resposta = resultados.map(c =>
  `👤 **${c.nome}**\n` +
  `📞 Tel: ${c.telefone}\n` +
  `📞 Tel2: ${c.telefone2}\n` +
  `📍 ${c.endereco} - CEP: ${c.cep}\n` +
  `🛣️ Rota: ${c.rota}\n` +
  `${c.ativo}\n` +
  `📝 Obs: ${c.observacao || 'Nenhuma'}`
).join('\n\n---\n\n');

return [{
  json: {
    encontrado: true,
    totalEncontrados: resultados.length,
    mensagem: `✅ Encontrado(s) ${resultados.length} cliente(s):\n\n${resposta}`,
    clientes: resultados
  }
}];
```

---

## 🤖 Variação: Usando como Tool do AI Agent

Se o workflow usar um **AI Agent**, configure o nó de filtro como uma **Tool**:

| Campo | Valor |
|---|---|
| **Tool Name** | `buscar_cliente_por_telefone` |
| **Tool Description** | `Busca um cliente pelo número de telefone na base da Soda Cristal. Recebe o telefone como parâmetro e retorna nome, endereço, rota e status.` |
| **Input** | `telefone` (string) |

Conecte os nós 2 → 3 → 4 como sub-workflow da tool.

---

## 📊 Campos Disponíveis na Resposta

| Campo API | Descrição | Exemplo |
|---|---|---|
| `cliente.id` | ID único do cliente | `456` |
| `cliente.nome` | Nome completo | `João Silva` |
| `cliente.fone` | Telefone principal | `11999999999` |
| `cliente.celular2` | Telefone secundário | `11988888888` |
| `cliente.rua` | Logradouro | `Rua Exemplo` |
| `cliente.bairro` | Bairro | `Centro` |
| `cliente.numero` | Número | `123` |
| `cliente.cep` | CEP | `01310100` |
| `cliente.cpfcnpj` | CPF/CNPJ | `12345678900` |
| `cliente.ativo` | Status (1 = ativo, 0 = inativo) | `1` |
| `cliente.observacao` | Observações | `Cliente VIP` |
| `rota.nome` | Nome da rota vinculada | `Rota Centro` |

---

## ⚠️ Pontos de Atenção

> [!WARNING]
> **Header obrigatório:** O header `versaoApp: 30.19.2` deve estar presente em **todas** as requisições à API. Sem ele, a API retorna 400 ou 403.

> [!IMPORTANT]
> **Nome do campo:** O telefone na base vem como `fone` (não `telefone`) no objeto retornado por `/rotas-entregas`. O segundo telefone é `celular2`.

### Outras considerações

- A busca usa `.includes()` para match parcial — permite buscar por parte do número
- Considere **cachear o token** de login para evitar re-autenticação a cada busca
- Para alto volume de buscas, avalie cachear também a lista de clientes com TTL de alguns minutos
- O endpoint `/rotas-entregas` retorna **todos** os clientes de todas as rotas do vendedor autenticado

---

## 🔗 Referências

- [Documentação completa da API Soda Cristal](./soda-cristal_api_documentacao.md)
- **URL Base:** `https://app.sodacristal.com.br/api`
- **Autenticação:** Bearer Token via `POST /login`
