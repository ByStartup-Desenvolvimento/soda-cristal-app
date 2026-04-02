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
- **Endpoint:** `GET /clientes/xarope/{distribuidor_id}`
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

### 4.1. Cadastro / Alteração / Inativação de Cliente (v2)

> **⚠️ COMPORTAMENTO CRÍTICO:** O endpoint é único para as três operações (novo, edição, inativação). A diferença está em qual chave dentro de `contratos` recebe o objeto e no valor de `tipo_cadastro`. **Arrays vazios (`[]`) NÃO devem ser enviados** — envie apenas a chave correspondente à operação desejada.

- **Endpoint:** `POST /contratos/v2/cadastro-de-clientes`
- **URL Completa:** `https://app.sodacristal.com.br/api/contratos/v2/cadastro-de-clientes`

---

#### 4.1.1. Novo Cadastro (`tipo_cadastro: 1`)

Envia apenas a chave `novosContratos`. Omite `alteracaoContrato` e `inativacoes` por completo.

```json
{
  "contratos": {
    "novosContratos": [
      {
        "id": 0,
        "cliente_id_api": 0,
        "nome": "Nome do Cliente",
        "cpf_cnpj": "000.000.000-00",
        "rg": "",
        "data_nascimento": "",
        "telefone": "11999999999",
        "telefone2": "",
        "cep": "00000-000",
        "endereco": "Rua Exemplo",
        "bairro": "Centro",
        "numero": "123",
        "complemento": "",
        "qtd_garrafa": 2,
        "qtd_garrafa_comprada": 0,
        "dia_reposicao": "Segunda",
        "obs": "Observações do cliente",
        "rota": "Rota Centro",
        "vendedor": 1,
        "tipo_cadastro": 1,
        "revendedor_xarope": false,
        "revendedor_agua": false,
        "cf_xarope": false,
        "cf_agua": true,
        "precoespecial_agua": false,
        "precoespecial_xarope": false,
        "data_inativacao": ""
      }
    ]
  }
}
```

**Regras:**
- `id`: Sempre `0` para novos cadastros
- `cliente_id_api`: Sempre `0` para novos cadastros
- `rg` e `data_nascimento`: São **opcionais** — enviar string vazia `""` quando não informados
- `dia_reposicao`: Valores aceitos: `"Segunda"`, `"Terca"`, `"Quarta"`, `"Quinta"`, `"Sexta"`, `"Sabado"`, `"Domingo"`, `"Não definido"` ou `""`
- `rota`: O **nome** da rota (string), não o ID numérico — ex: `"Rota Centro"`
- `qtd_garrafa`: Garrafas consignadas. Aceita `0` como valor válido
- `qtd_garrafa_comprada`: Garrafas compradas. Aceita `0` como valor válido
- `data_inativacao`: Enviar string vazia `""` para novos cadastros

---

#### 4.1.2. Alteração de Cadastro (`tipo_cadastro: 2`)

Envia apenas a chave `alteracaoContrato`. Omite `novosContratos` e `inativacoes` por completo.

```json
{
  "contratos": {
    "alteracaoContrato": [
      {
        "id": 0,
        "cliente_id_api": 456,
        "nome": "Nome do Cliente Atualizado",
        "cpf_cnpj": "000.000.000-00",
        "rg": "",
        "data_nascimento": "",
        "telefone": "11999999999",
        "telefone2": "",
        "cep": "00000-000",
        "endereco": "Rua Nova",
        "bairro": "Bairro Novo",
        "numero": "456",
        "complemento": "",
        "qtd_garrafa": 3,
        "qtd_garrafa_comprada": 1,
        "dia_reposicao": "",
        "obs": "Observação atualizada",
        "rota": "Rota Centro",
        "vendedor": 1,
        "tipo_cadastro": 2,
        "revendedor_xarope": false,
        "revendedor_agua": false,
        "cf_xarope": false,
        "cf_agua": true,
        "precoespecial_agua": false,
        "precoespecial_xarope": false,
        "data_inativacao": ""
      }
    ]
  }
}
```

**Regras:**
- `cliente_id_api`: Deve conter o **ID real do cliente** retornado pela API (campo `id` do objeto `cliente` em `/rotas-entregas`)
- `tipo_cadastro`: Sempre `2` para alteração
- Todos os demais campos seguem as mesmas regras do novo cadastro
- `data_inativacao`: Enviar string vazia `""` para alterações

---

#### 4.1.3. Inativação de Cadastro (`tipo_cadastro: 3`)

Envia apenas a chave `inativacoes`. Omite `novosContratos` e `alteracaoContrato` por completo.

```json
{
  "contratos": {
    "inativacoes": [
      {
        "id": 456,
        "cliente_id_api": 456,
        "nome": "Nome do Cliente",
        "cpf_cnpj": "000.000.000-00",
        "rg": "",
        "data_nascimento": "",
        "telefone": "11999999999",
        "telefone2": "",
        "cep": "00000-000",
        "endereco": "Rua do Cliente",
        "bairro": "Bairro do Cliente",
        "numero": "123",
        "complemento": "",
        "qtd_garrafa": 2,
        "qtd_garrafa_comprada": 0,
        "dia_reposicao": "",
        "obs": "Motivo da inativação: cliente solicitou encerramento",
        "rota": "Rota Centro",
        "vendedor": 1,
        "tipo_cadastro": 3,
        "revendedor_xarope": false,
        "revendedor_agua": false,
        "cf_xarope": false,
        "cf_agua": true,
        "precoespecial_agua": false,
        "precoespecial_xarope": false,
        "data_inativacao": "01/04/2026 10:30:00"
      }
    ]
  }
}
```

**Regras:**
- `id`: Deve conter o ID real do cliente (não zero)
- `cliente_id_api`: Mesmo valor que `id` — ID real do cliente
- `tipo_cadastro`: Sempre `3` para inativação
- `data_inativacao`: **OBRIGATÓRIO** e no formato exato `dd/MM/yyyy HH:mm:ss` (ex: `"01/04/2026 10:30:00"`)
  - ⚠️ Formatos ISO (`2026-04-01T10:30:00`) ou com separador `T` **causarão erro 500 no servidor**
  - O campo deve ser preenchido automaticamente com a data/hora atual no momento da ação
- `obs`: Usado para registrar o **motivo da inativação**
- `qtd_garrafa`: Quantidade de vasilhames a devolver na recolha

---

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
  "id": 0,
  "cliente_id_api": 0,
  "nome": "string",
  "cpf_cnpj": "string",
  "rg": "",
  "data_nascimento": "",
  "telefone": "string",
  "telefone2": "",
  "cep": "string",
  "endereco": "string",
  "bairro": "string",
  "numero": "string",
  "complemento": "",
  "qtd_garrafa": 0,
  "qtd_garrafa_comprada": 0,
  "dia_reposicao": "",
  "obs": "string",
  "rota": "string",
  "vendedor": 0,
  "tipo_cadastro": 1,
  "revendedor_xarope": false,
  "revendedor_agua": false,
  "cf_xarope": false,
  "cf_agua": false,
  "precoespecial_agua": false,
  "precoespecial_xarope": false,
  "data_inativacao": ""
}
```

#### Tabela de Regras por Campo

| Campo | Tipo | Obrigatório | Notas |
| :--- | :--- | :--- | :--- |
| `id` | `number` | Sim | `0` para novos; ID real do cliente para inativação |
| `cliente_id_api` | `number` | Sim | `0` para novos; ID real do cliente para alteração/inativação |
| `nome` | `string` | Sim | — |
| `cpf_cnpj` | `string` | Sim | Pode vir formatado (ex: `000.000.000-00`) |
| `rg` | `string` | Não | Enviar `""` se não informado |
| `data_nascimento` | `string` | Não | Enviar `""` se não informado |
| `telefone` | `string` | Sim | Pode vir formatado (ex: `(11) 99999-9999`) |
| `telefone2` | `string` | Não | Enviar `""` se não informado |
| `cep` | `string` | Sim | — |
| `endereco` | `string` | Sim | Nome do logradouro |
| `bairro` | `string` | Sim | — |
| `numero` | `string` | Sim | — |
| `complemento` | `string` | Não | Enviar `""` se não informado |
| `qtd_garrafa` | `number` | Sim | Garrafas consignadas. Aceita `0` |
| `qtd_garrafa_comprada` | `number` | Sim | Garrafas compradas. Aceita `0` |
| `dia_reposicao` | `string` | Não | Valores: `"Segunda"`, `"Terca"`, `"Quarta"`, `"Quinta"`, `"Sexta"`, `"Sabado"`, `"Domingo"`, `"Não definido"` ou `""` |
| `obs` | `string` | Não | Na inativação, usado para o **motivo** |
| `rota` | `string` | Sim | **Nome** da rota (não o ID numérico) |
| `vendedor` | `number` | Sim | ID do vendedor logado |
| `tipo_cadastro` | `number` | Sim | `1` = Novo, `2` = Alteração, `3` = Inativação |
| `revendedor_xarope` | `boolean` | Sim | — |
| `revendedor_agua` | `boolean` | Sim | — |
| `cf_xarope` | `boolean` | Sim | Consumidor Final Xarope |
| `cf_agua` | `boolean` | Sim | Consumidor Final Água |
| `precoespecial_agua` | `boolean` | Sim | — |
| `precoespecial_xarope` | `boolean` | Sim | — |
| `data_inativacao` | `string` | Condicional | **Obrigatório** na inativação. Formato: `dd/MM/yyyy HH:mm:ss`. Enviar `""` nos demais casos |

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

## ⚠️ Pontos de Atenção e Comportamentos Críticos da API

### 1. Envio de Arrays Vazios Causa Erro 500

O endpoint `/contratos/v2/cadastro-de-clientes` **não tolera** a presença de chaves com arrays vazios (`[]`) no payload. Enviar `"alteracaoContrato": []` ou `"inativacoes": []` junto com `novosContratos` resulta em **erro 500**.

> **Regra:** Inclua **apenas** a chave correspondente à operação desejada. Omita completamente as demais.

| Operação | Chave a enviar | Chaves a omitir |
| :--- | :--- | :--- |
| Novo Cadastro | `novosContratos` | `alteracaoContrato`, `inativacoes` |
| Alteração | `alteracaoContrato` | `novosContratos`, `inativacoes` |
| Inativação | `inativacoes` | `novosContratos`, `alteracaoContrato` |

---

### 2. Formato de `data_inativacao` é Crítico

O campo `data_inativacao` **deve** estar no formato `dd/MM/yyyy HH:mm:ss`. Qualquer outro formato (ISO 8601, com `T`, sem segundos) causa **erro 500** no servidor.

```
✅ Correto:  "01/04/2026 10:30:00"
❌ Errado:   "2026-04-01T10:30:00"
❌ Errado:   "2026-04-01 10:30:00"
❌ Errado:   "01/04/2026 10:30"
```

---

### 3. Campo `rota` Recebe o Nome, Não o ID

Ao contrário do que pode parecer, o campo `rota` no payload de cadastro recebe o **nome textual** da rota (ex: `"Rota Centro"`), não o ID numérico do campo `id` retornado pelo endpoint `/rotas/{vendedor_id}`.

---

### 4. Campos Opcionais Devem Ter String Vazia

Campos opcionais como `rg`, `data_nascimento`, `telefone2` e `complemento` devem ser enviados como string vazia `""` quando não preenchidos. Evite enviar `null` ou omitir o campo, pois o comportamento do servidor pode ser imprevisível.

---

### 5. `qtd_garrafa` Aceita Zero como Valor Válido

O campo `qtd_garrafa` (garrafas consignadas) aceita `0` como valor válido. Não há validação mínima de `1` por parte do servidor. O mesmo se aplica a `qtd_garrafa_comprada`.

---

### 6. `cliente_id_api` vs `id` na Inativação

Na operação de inativação, tanto `id` quanto `cliente_id_api` devem receber o **ID real do cliente** (retornado pelo endpoint `/rotas-entregas`). Para novos cadastros, ambos devem ser `0`.

---

## 🔍 Referências no Código

### Código Android (Referência Original)
- **Arquivo de Endpoints:** `app/src/main/java/dev/stager/com/br/sodacristal2/utilitarios/Endpoint.java`
- **Tasks de Requisição:** `app/src/main/java/dev/stager/com/br/sodacristal2/tasks/`
- **Modelos de Dados:** `app/src/main/java/dev/stager/com/br/sodacristal2/models/`

### Código Web (soda-app — Implementação Atual)
- **Modelos e Schema de Validação:** `src/domain/clientes/model.ts` — Interface `ClienteCadastroPayload` e `CadastroContratosPayload`
- **Serviços de Domínio:** `src/domain/clientes/services.ts` — Funções `cadastrarCliente`, `alterarCliente`, `inativarCliente`
- **HTTP Client:** `src/shared/api/services/clientesServices.ts`
- **Tela de Cadastro:** `src/presentation/pages/CustomerRegistration.tsx`
- **Sheet de Edição:** `src/presentation/components/ClienteEditSheet.tsx`
- **Sheet de Inativação:** `src/presentation/components/ClienteDesativarSheet.tsx`

---

**Documento atualizado em:** 01/04/2026  
**Baseado na análise do código-fonte Android e na implementação atual do projeto web (soda-app)**
