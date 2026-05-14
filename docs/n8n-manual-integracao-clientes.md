# 🚀 Guia de Integração N8N — Soda Cristal (Busca por Rota)

Este guia explica como buscar clientes no sistema Soda Cristal via N8N, contornando o erro 404 do endpoint global.

## 📋 Resumo do Fluxo
Como o servidor bloqueia a busca global de todos os clientes de uma vez, o fluxo correto é:
**Login** ➔ **Listar Rotas do Vendedor** ➔ **Buscar Clientes de cada Rota** ➔ **Filtrar por Telefone**.

---

## 🛠 Configurações Obrigatórias (Headers)
Em **TODOS** os nós de HTTP Request, você deve usar estes headers:
*   `versaoApp`: `30.19.2`
*   `Accept`: `application/json`
*   `Authorization`: `Bearer {{ TOKEN_AQUI }}`

---

## 👣 Passo a Passo do Workflow

### 1. Login
*   **Método:** `POST`
*   **URL:** `https://app.sodacristal.com.br/api/login`
*   **Body:** `{"usuario": "...", "senha": "..."}`
*   *Este nó retornará o `access_token` e o `vendedor.id`.*

### 2. Listar Rotas
*   **Método:** `GET`
*   **URL:** `https://app.sodacristal.com.br/api/rotas/{{ $json.vendedor.id }}`
*   *Este nó retornará uma lista de rotas. O N8N executará o próximo passo uma vez para cada rota da lista.*

### 3. Buscar Clientes da Rota
*   **Método:** `GET`
*   **URL:** `https://app.sodacristal.com.br/api/rotas-entregas/rota/{{ $json.id }}`
*   **Headers:** Não esqueça do `versaoApp: 30.19.2` e do Token.
*   *Aqui, o `{{ $json.id }}` é o ID da rota vindo do passo anterior.*

### 4. Filtrar por Telefone (Nó Code)
Use este código JavaScript para consolidar os resultados e encontrar o cliente:

```javascript
// 1. Defina o telefone que você quer buscar (limpando caracteres especiais)
const telefoneBusca = "11999999999".replace(/\D/g, ''); 

// 2. Consolida todos os clientes de todas as rotas
const todosClientes = [];
for (const item of $input.all()) {
  if (Array.isArray(item.json)) {
    todosClientes.push(...item.json);
  }
}

// 3. Busca o cliente pelo telefone (celular 1 ou 2)
const encontrado = todosClientes.find(item => {
  const f1 = String(item.cliente.fone || '').replace(/\D/g, '');
  const f2 = String(item.cliente.celular2 || '').replace(/\D/g, '');
  return f1.includes(telefoneBusca) || f2.includes(telefoneBusca);
});

// 4. Retorna o resultado
return encontrado 
  ? { encontrado: true, cliente: encontrado.cliente } 
  : { encontrado: false };
```

---

## ⚠️ Dicas de Solução de Problemas
*   **Erro 404:** Geralmente é falta do header `versaoApp` ou erro de digitação na URL (use sempre hífens `-`, nunca underline `_`).
*   **Erro 500 ou "Usuário Inativo":** Verifique se o login utilizado pertence a um **Vendedor Ativo**. Logins de Administradores podem não ter rotas vinculadas, causando erro no servidor.
*   **Performance:** Se o vendedor tiver muitas rotas, ative a opção **"Batching"** nas configurações do nó HTTP para processar aos poucos.
