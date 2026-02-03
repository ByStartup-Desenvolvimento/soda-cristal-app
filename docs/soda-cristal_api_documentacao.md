# 📑 Documentação Técnica Completa - API Soda Cristal

Este documento reúne o mapeamento completo dos endpoints, headers obrigatórios e estruturas de dados (payloads) identificados no projeto Android Soda Cristal.

**Última atualização:** 03/02/2026  
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

⚠️ **IMPORTANTE:** O header `versaoApp` é validado pelo servidor. Sem ele, a maioria das requisições retornará erro 400 ou 403.

---

## 🔑 Autenticação

### Login
- **Endpoint:** `POST /login`
- **Payload:**
```json
{
  "username": "usuario",
  "password": "senha"
}
```

---

*Documento completo disponível em c:\bystartup\soda-app\docs\soda-cristal_api_documentacao.md*
