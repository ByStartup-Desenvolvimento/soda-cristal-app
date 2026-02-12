# 📑 Documentação Técnica Completa - API Soda Cristal

Este documento reúne o mapeamento completo dos endpoints, headers obrigatórios e estruturas de dados (payloads) identificados no projeto Android Soda Cristal.

**Última atualização:** 21/01/2026  
**Versão do App:** 30.19.2

---

## 🛠️ Configurações Globais

### Informações Base
- **URL Base:** `https://app.sodacristal.com.br/api`
- **Versão do App (Header Obrigatório):** `30.19.2`
- **Método de Autenticação:** `Bearer Token` (obtido no endpoint `/login`)

### Headers Padrão (Obrigatórios em todas as chamadas)

| Chave | Valor | Obrigatório |
| :--- | :--- | :--- |
| `Content-Type` | `application/json` | ✅ Sim |
| `versaoApp` | `30.19.2` | ✅ Sim |
| `Authorization` | `Bearer {seu_token}` | ✅ Sim (exceto no Login) |

**⚠️ IMPORTANTE:** O header `versaoApp` é validado pelo servidor. Sem ele, a maioria das requisições retornará erro 400 ou 403.

---

## 🔑 1. Autenticação e Acesso

### Login
- **Endpoint:** `POST /login`
- **URL Completa:** `https://app.sodacristal.com.br/api/login`
- **Headers:**
  - `Content-Type: application/json`
  - `versaoApp: 30.19.2`
- **Payload:**
```json
{
  "username": "usuario",
  "password": "senha"
}
```
- **Resposta de Sucesso (200/201):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "username": "usuario",
    "name": "Nome do Usuário",
    "email": "email@exemplo.com"
  },
  "vendedor": {
    "id": 1,
    "entregador": "0"
  },
  "distribuidor": {
    "id": 5,
    "preco_liquido": "10.50",
    "preco_liquido_revenda": "12.00",
    "preco_sifao": "8.00",
    "preco_sifao_revenda": "9.50"
  }
}
```
- **Nota:** Guarde o `access_token` e os IDs de `vendedor` e `distribuidor` para usar nos demais endpoints.

---

## 🛣️ 2. Gestão de Rotas e Clientes

### 2.1. Listar Rotas do Vendedor
- **Endpoint:** `GET /rotas/{vendedor_id}`
- **URL Completa:** `https://app.sodacristal.com.br/api/rotas/1`
- **Descrição:** Retorna uma lista simplificada de rotas disponíveis para o vendedor.
- **Resposta:** Array de objetos `Rota` com campos: `id`, `nome`, `frequencia`, `observacao`, `ativo`, `checkin_fechado`, `cidade_id`.

### 2.2. Carga Geral de Clientes (Todas as Rotas)
- **Endpoint:** `GET /rotas-entregas`
- **URL Completa:** `https://app.sodacristal.com.br/api/rotas-entregas`
- **Descrição:** Traz todos os clientes de todas as rotas vinculadas ao vendedor. Usado para sincronização offline completa.
- **Resposta:** Array complexo contendo objetos com:
  - `rotaentrega`: sequência, num_garrafas, num_garrafas_comprada
  - `cliente`: dados completos (nome, endereço, telefones, perfil comercial)
  - `rota`: informações da rota
  - `diassematendimento`, `diassemconsumo`

### 2.3. Clientes por Rota Específica
- **Endpoint:** `GET /rotas-entregas/rota/{rota_id}`
- **URL Completa:** `https://app.sodacristal.com.br/api/rotas-entregas/rota/123`
- **Descrição:** Retorna a sequência de clientes de uma rota específica. É um filtro de performance do endpoint acima.
- **Resposta:** Mesma estrutura do endpoint `/rotas-entregas`, mas filtrado por rota.

### 2.4. Buscar Clientes de Xarope
- **Endpoint:** `GET /clientes/xarope/{vendedor_id}`
- **URL Completa:** `https://app.sodacristal.com.br/api/clientes/xarope/1`
- **Descrição:** Retorna clientes habilitados especificamente para compra de xarope.

---

## 📦 3. Sincronização de Tabelas (GET)

Todos os endpoints abaixo são **GET** e requerem os headers padrão.

### 3.1. Listar Produtos
- **Endpoint:** `GET /produtos/{vendedor_id}`
- **URL Completa:** `https://app.sodacristal.com.br/api/produtos/1`
- **Descrição:** Lista de produtos disponíveis com preços (unitário, revenda, especial).
- **Resposta:** Array de objetos com `id`, `descricao`, `valor_unitario`, `valor_unitario_revenda`, `valor_preco_especial`, `ativo`.

### 3.2. Buscar Meios de Pagamento
- **Endpoint:** `GET /meiospagamento/{distribuidor_id}`
- **URL Completa:** `https://app.sodacristal.com.br/api/meiospagamento/5`
- **Descrição:** Opções de pagamento aceitas pelo distribuidor.
- **Resposta:** Array de objetos com `id`, `descricao`, etc.

### 3.3. Buscar Promoções
- **Endpoint:** `GET /promocoes/{vendedor_id}`
- **URL Completa:** `https://app.sodacristal.com.br/api/promocoes/1`
- **Descrição:** Promoções vigentes para o vendedor.

### 3.4. Vendas Pendentes
- **Endpoint:** `GET /vendas_pendentes/{vendedor_id}`
- **URL Completa:** `https://app.sodacristal.com.br/api/vendas_pendentes/1`
- **Descrição:** Lista vendas realizadas que ainda aguardam algum processamento ou entrega.

### 3.5. Vendas por Vendedor
- **Endpoint:** `GET /vendas_vendedor/{vendedor_id}`
- **URL Completa:** `https://app.sodacristal.com.br/api/vendas_vendedor/1`
- **Descrição:** Histórico completo de vendas do vendedor logado.

### 3.6. Pendências de Contratos
- **Endpoint:** `GET /pendencia-contrato/{vendedor_id}`
- **URL Completa:** `https://app.sodacristal.com.br/api/pendencia-contrato/1`
- **Descrição:** Lista contratos enviados pelo app que foram rejeitados ou precisam de correção pelo vendedor.

---

## 📝 4. Transações e Lançamentos (POST)

### 4.1. Cadastro de Cliente (v2)
- **Endpoint:** `POST /contratos/v2/cadastro-de-clientes`
- **URL Completa:** `https://app.sodacristal.com.br/api/contratos/v2/cadastro-de-clientes`
- **Payload Estruturado:**
```json
{
  "contratos": {
    "novosContratos": [
      {
        "id": 1,
        "cliente_id_api": 0,
        "nome": "Nome do Cliente",
        "cpf_cnpj": "000.000.000-00",
        "rg": "12.345.678-9",
        "data_nascimento": "1990-01-01",
        "telefone": "11999999999",
        "telefone2": "11888888888",
        "cep": "00000-000",
        "endereco": "Rua Exemplo",
        "bairro": "Centro",
        "numero": "123",
        "complemento": "Apto 45",
        "qtd_garrafa": 10,
        "qtd_garrafa_comprada": 5,
        "dia_reposicao": "Segunda",
        "obs": "Observações do cliente",
        "vendedor": 1,
        "tipo_cadastro": 1,
        "revendedor_xarope": false,
        "revendedor_agua": false,
        "cf_xarope": true,
        "cf_agua": true,
        "precoespecial_agua": false,
        "precoespecial_xarope": false,
        "data_inativacao": "",
        "rota": "Rota Centro"
      }
    ],
    "alteracaoContrato": [],
    "inativacoes": []
  }
}
```
- **Notas:**
  - `tipo_cadastro`: 1 = Novo, 2 = Alteração, 3 = Inativação
  - `cliente_id_api`: 0 para novos, ou ID existente para alterações
  - `data_nascimento`: Formato `yyyy-MM-dd`
  - Campos `alteracaoContrato` e `inativacoes` seguem a mesma estrutura, mas com `tipo_cadastro` diferente

### 4.2. Enviar Venda de Xarope (v2)
- **Endpoint:** `POST /vendaxarope/v2`
- **URL Completa:** `https://app.sodacristal.com.br/api/vendaxarope/v2`
- **Payload:**
```json
{
  "vendas": [
    {
      "id": 101,
      "cliente_id": 50,
      "data_venda": "2026-01-21 10:00:00",
      "vendedor": 1,
      "promocao_id": "",
      "venda_item": [
        {
          "id": 1,
          "produto_id": 10,
          "quantidade": 2,
          "venda_id": 101,
          "valor_unitario": 15.50,
          "unidade_medida": "UN",
          "desconto": 0.0,
          "acrescimo": 0.0
        }
      ],
      "contas_receber": {
        "valor": "31.00",
        "parcelas": [
          {
            "recebido": true,
            "valor": "31.00",
            "meio_pagamento_id": 1
          }
        ]
      }
    }
  ]
}
```
- **Nota:** O campo `contas_receber` é opcional. Se não houver pagamento, pode ser omitido.

### 4.3. Enviar Pedido de Xarope (v2)
- **Endpoint:** `POST /pedidoxarope/v2`
- **URL Completa:** `https://app.sodacristal.com.br/api/pedidoxarope/v2`
- **Payload:** Idêntico ao de `/vendaxarope/v2`
- **Diferença:** No servidor, este entra como "Pedido" (para faturamento posterior) e o outro como "Venda" (pronta entrega).

### 4.4. Enviar Check-in Full (Múltiplos)
- **Endpoint:** `POST /checkin/full/{vendedor_id}`
- **URL Completa:** `https://app.sodacristal.com.br/api/checkin/full/1`
- **Payload:** Array de objetos
```json
[
  {
    "rota_entrega": 123,
    "data_checkin": "21/01/2026 10:30:00",
    "vendedor": 1,
    "observacao": "Cliente presente",
    "observacao_descart": "",
    "dentro_raio": true,
    "latitude": "-23.5505",
    "longitude": "-46.6333",
    "anotacoes": "Anotações do vendedor",
    "quantidade_garrafas": 5,
    "quantidade_vendida": 2,
    "contas_receber": {
      "valor": "50.00",
      "parcelas": [
        {
          "recebido": true,
          "valor": "50.00",
          "meio_pagamento_id": 1
        }
      ]
    }
  }
]
```
- **Nota:** O campo `contas_receber` é opcional. `data_checkin` deve estar no formato `dd/MM/yyyy HH:mm:ss`.

### 4.5. Enviar Check-in Único
- **Endpoint:** `POST /checkin/{vendedor_id}`
- **URL Completa:** ` `
- **Payload:** Um objeto JSON único (não array) com os mesmos campos do check-in full
```json
{
  "rota_entrega": 123,
  "data_checkin": "21/01/2026 10:30:00",
  "vendedor": 1,
  "observacao": "Cliente presente",
  "dentro_raio": true,
  "latitude": "-23.5505",
  "longitude": "-46.6333",
  "quantidade_garrafas": 5,
  "quantidade_vendida": 2
}
```

---

## 🚚 5. Entregas e Finalização

### 5.1. Finalizar Venda/Entrega
- **Endpoint:** `POST /finaliza_venda/{id_venda}`
- **URL Completa:** `https://app.sodacristal.com.br/api/finaliza_venda/101`
- **Payload:** Corpo vazio (apenas ID na URL)
- **Descrição:** Marca uma venda como entregue/finalizada.

---

## 🌐 6. Utilitários Externos

### 6.1. Busca de CEP (ViaCEP)
- **Endpoint:** `GET https://viacep.com.br/ws/{cep}/json/`
- **URL Completa:** `https://viacep.com.br/ws/01310100/json/`
- **Headers:** Nenhum header da Soda Cristal necessário (API pública)
- **Resposta:**
```json
{
  "cep": "01310-100",
  "logradouro": "Avenida Paulista",
  "complemento": "",
  "bairro": "Bela Vista",
  "localidade": "São Paulo",
  "uf": "SP",
  "ibge": "3550308",
  "gia": "1004",
  "ddd": "11",
  "siafi": "7107"
}
```

---

## 📋 7. Resumo de Endpoints por Categoria

### GET (Consultas)
| Endpoint | Método | Parâmetro na URL |
| :--- | :--- | :--- |
| `/rotas/{vendedor_id}` | GET | `vendedor_id` |
| `/rotas-entregas` | GET | - |
| `/rotas-entregas/rota/{rota_id}` | GET | `rota_id` |
| `/clientes/xarope/{vendedor_id}` | GET | `vendedor_id` |
| `/produtos/{vendedor_id}` | GET | `vendedor_id` |
| `/meiospagamento/{distribuidor_id}` | GET | `distribuidor_id` |
| `/promocoes/{vendedor_id}` | GET | `vendedor_id` |
| `/vendas_pendentes/{vendedor_id}` | GET | `vendedor_id` |
| `/vendas_vendedor/{vendedor_id}` | GET | `vendedor_id` |
| `/pendencia-contrato/{vendedor_id}` | GET | `vendedor_id` |

### POST (Criação/Envio)
| Endpoint | Método | Payload |
| :--- | :--- | :--- |
| `/login` | POST | JSON com `username` e `password` |
| `/contratos/v2/cadastro-de-clientes` | POST | JSON estruturado com `contratos` |
| `/vendaxarope/v2` | POST | JSON com array `vendas` |
| `/pedidoxarope/v2` | POST | JSON com array `vendas` |
| `/checkin/full/{vendedor_id}` | POST | Array de objetos check-in |
| `/checkin/{vendedor_id}` | POST | Objeto único check-in |
| `/finaliza_venda/{id_venda}` | POST | Corpo vazio |

---

## 💡 Dicas para Testes no Postman

### 1. Configuração Inicial
1. Crie uma variável de ambiente `base_url` = `https://app.sodacristal.com.br/api`
2. Crie uma variável `token` para armazenar o `access_token` após o login
3. Crie uma variável `versaoApp` = `30.19.2`

### 2. Headers Globais (Collection Level)
Configure na sua Collection do Postman:
- `Content-Type: application/json`
- `versaoApp: {{versaoApp}}`
- `Authorization: Bearer {{token}}`

### 3. Fluxo Recomendado de Teste
1. **Login** → Salve o `access_token` na variável `token`
2. **Buscar Rotas** → Use o `vendedor_id` retornado no login
3. **Buscar Rotas-Entregas** → Para ver os clientes
4. **Listar Produtos** → Para ver produtos disponíveis
5. **Criar Venda/Check-in** → Teste os POSTs

### 4. Erros Comuns
- **401 Unauthorized:** Token expirado ou inválido → Faça login novamente
- **400 Bad Request:** Falta do header `versaoApp` ou payload malformado
- **403 Forbidden:** Usuário sem permissão para aquele recurso

### 5. IDs Dinâmicos
- `vendedor_id`: Obtido no JSON de resposta do Login
- `distribuidor_id`: Obtido no JSON de resposta do Login
- `rota_id`: Obtido na listagem de rotas (`GET /rotas/{vendedor_id}`)

---

## 📚 Estrutura de Dados Detalhada

### Objeto ClienteCadastro (Campos Completos)
```json
{
  "id": 1,
  "cliente_id_api": 0,
  "nome": "string",
  "cpf_cnpj": "string",
  "rg": "string",
  "data_nascimento": "yyyy-MM-dd",
  "telefone": "string",
  "telefone2": "string",
  "cep": "string",
  "endereco": "string",
  "bairro": "string",
  "numero": "string",
  "complemento": "string",
  "qtd_garrafa": 0,
  "qtd_garrafa_comprada": 0,
  "dia_reposicao": "string",
  "obs": "string",
  "vendedor": 0,
  "tipo_cadastro": 1,
  "revendedor_xarope": false,
  "revendedor_agua": false,
  "cf_xarope": false,
  "cf_agua": false,
  "precoespecial_agua": false,
  "precoespecial_xarope": false,
  "data_inativacao": "string",
  "rota": "string"
}
```

### Objeto Venda (Campos Completos)
```json
{
  "id": 0,
  "cliente_id": 0,
  "data_venda": "yyyy-MM-dd HH:mm:ss",
  "vendedor": 0,
  "promocao_id": "",
  "venda_item": [
    {
      "id": 0,
      "produto_id": 0,
      "quantidade": 0,
      "venda_id": 0,
      "valor_unitario": 0.0,
      "unidade_medida": "string",
      "desconto": 0.0,
      "acrescimo": 0.0
    }
  ],
  "contas_receber": {
    "valor": "string",
    "parcelas": [
      {
        "recebido": true,
        "valor": "string",
        "meio_pagamento_id": 0
      }
    ]
  }
}
```

### Objeto Check-in (Campos Completos)
```json
{
  "rota_entrega": 0,
  "data_checkin": "dd/MM/yyyy HH:mm:ss",
  "vendedor": 0,
  "observacao": "string",
  "observacao_descart": "string",
  "dentro_raio": true,
  "latitude": "string",
  "longitude": "string",
  "anotacoes": "string",
  "quantidade_garrafas": 0,
  "quantidade_vendida": 0,
  "contas_receber": {
    "valor": "string",
    "parcelas": [
      {
        "recebido": true,
        "valor": "string",
        "meio_pagamento_id": 0
      }
    ]
  }
}
```

---

## 🔍 Referências no Código

- **Arquivo de Endpoints:** `app/src/main/java/dev/stager/com/br/sodacristal2/utilitarios/Endpoint.java`
- **Tasks de Requisição:** `app/src/main/java/dev/stager/com/br/sodacristal2/tasks/`
- **Modelos de Dados:** `app/src/main/java/dev/stager/com/br/sodacristal2/models/`

---

**Documento gerado em:** 21/01/2026  
**Baseado na análise do código-fonte do projeto Soda Cristal Android**
