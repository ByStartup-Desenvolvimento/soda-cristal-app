---
name: manual-report
description: Skill para criar, executar e documentar testes manuais no padrão ByStartup (POP-QA-001). Gera relatório HTML profissional dark-mode com scoreboard, galeria de evidências e log de bugs. Funciona para projetos mobile (React Native, Flutter, iOS, Android) e web (Next.js, React, Vue). Triggers on "criar relatório de testes", "testes manuais", "manual report", "plano de testes manual", "relatório de homologação", "QA manual", "criar testes", "gerar relatório de testes", "homologação", "evidências de teste".
---

# Skill: Manual Report (POP-QA-001)

Skill para criação de relatórios de testes manuais profissionais seguindo o **Procedimento Operacional Padrão da ByStartup**.

> **Recomendação de modelo:** Para melhor qualidade, use um LLM superior: **Claude Opus**, **Claude Sonnet** ou **Gemini Pro**. A escolha final é do usuário, mas modelos mais capazes geram planos de teste mais completos e relatórios mais precisos.

---

## Fluxo de Trabalho

### FASE 1 — Entender o Projeto

**1.1 Buscar documentação**

Procure os arquivos de contexto do projeto nesta ordem de prioridade:
1. `README.md` — visão geral, funcionalidades e fluxos
2. `docs/` — qualquer documentação existente
3. `.agent/prd.md` — PRD do produto (se existir)
4. `docs/soda-cristal-context.md` ou arquivo similar de contexto

Se **nenhuma documentação** for encontrada, informe ao usuário:

> ⚠️ Não encontrei documentação do projeto (README.md ou similar). Para seguir o padrão ByStartup, é recomendado criar um `README.md` com a descrição do projeto, fluxos principais e tecnologias utilizadas. Quer que eu crie um esboço agora?

**1.2 Identificar o tipo de projeto**

- 📱 **Mobile**: React Native, Flutter, iOS nativo, Android nativo
- 🌐 **Web**: Next.js, React, Vue, HTML/JS
- 🔌 **API/Backend**: Node.js, Python, Go
- 🖥️ **Desktop**: Electron, WPF

**1.3 Mapear os fluxos do sistema**

Com base na documentação, identifique os fluxos principais e atribua códigos `FL-XX`:

| Código | Nome do Fluxo | Descrição |
|--------|--------------|-----------|
| FL-01 | [Fluxo principal] | Ex.: Autenticação — Login e Logout |
| FL-02 | [Fluxo secundário] | Ex.: Cadastro de usuário |
| ... | ... | ... |

---

### FASE 2 — Verificar Estrutura de Pastas

Verifique se as pastas do padrão ByStartup existem no projeto:

```
projeto/
├── docs/
│   ├── evidencias/          ← screenshots dos testes
│   └── relatorio-manual.md  ← (ou relatorio-testes-manuais.html)
```

**Se as pastas não existirem**, informe ao usuário:

> ⚠️ As pastas `docs/evidencias/` e/ou `docs/` não existem neste projeto. Para seguir o **padrão ByStartup** de organização, é necessário criá-las. Posso criar agora com um `README.md` de instruções na raiz do projeto?

Somente crie as pastas após confirmação do usuário.

---

### FASE 3 — Criar os Casos de Teste

Para cada fluxo identificado, crie casos de teste com a estrutura padrão:

**Campos obrigatórios por TC:**
- `Código` — identificador único sequencial global (`TC-01`, `TC-02`, ...)
- `Descrição` — o que está sendo testado
- `Pré-condição` — estado necessário antes do teste
- `Resultado Esperado` — comportamento correto
- `Status` — `Pendente ⏳` (inicial), `Aprovado ✅`, `Reprovado ❌`, `Bloqueado ⚠️`

> **Regra:** A numeração dos TCs é **sequencial e global** em todo o relatório — não reinicia a cada fluxo.

**Glossário de Severidade de Bugs:**
- 🔴 **CRÍTICO** — app crasha, perda de dados, impossível usar funcionalidade core
- 🟠 **ALTO** — funcionalidade importante com defeito, workaround difícil
- 🟡 **MÉDIO** — bug visual ou funcionalidade secundária com problema
- ⚪ **BAIXO** — bug cosmético, melhoria de UX, type

---

### FASE 4 — Gerar o Relatório HTML

Gere o arquivo `docs/relatorio-testes-manuais.html` seguindo as especificações em [`references/report-spec.md`](references/report-spec.md).

**Características obrigatórias do relatório:**
- Design dark-mode com paleta ByStartup (accent `#6c63ff`)
- Scoreboard com contadores: Total, Aprovados ✅, Reprovados ❌, Bloqueados ⚠️, Taxa %
- Barra de progresso de aprovação
- Fluxos em acordeão colapsável (`FL-XX`)
- Tabela de TCs por fluxo com status badge
- Galeria de evidências (screenshots) com lightbox
- Caixa de observações por fluxo
- Seção de Log de Bugs (`BG-XX`)
- Matriz de cobertura no final
- Rodapé com metadados (executor, data, ambiente)
- JavaScript para cálculo automático dos counters via `testData`

**Nomenclatura de screenshots:**
```
docs/evidencias/tc01-descricao-curta.jpeg
docs/evidencias/tc07-cadastro-sucesso.jpeg
```

---

### FASE 5 — Checklist Final

Antes de entregar, verifique:

- [ ] `docs/evidencias/` existe no projeto
- [ ] `docs/relatorio-testes-manuais.html` gerado e válido
- [ ] Todos os fluxos do sistema cobertos
- [ ] TCs numerados sequencialmente (TC-01, TC-02, ...)
- [ ] Status inicial de todos os TCs como `Pendente`
- [ ] `testData` no JavaScript configurado corretamente
- [ ] Galeria de evidências com placeholders para os screenshots
- [ ] Seção de bugs preparada (vazia, pronta para preenchimento)
- [ ] Relatório abre no browser sem erros

---

## Estrutura de Entrega

```
projeto/
└── docs/
    ├── relatorio-testes-manuais.html   ← relatório principal
    └── evidencias/                      ← pasta para screenshots
        ├── tc01-nome-do-tc.jpeg
        ├── tc02-nome-do-tc.jpeg
        └── ...
```

---

## Instruções para Preenchimento (orientar o usuário)

O usuário precisa fazer **apenas 3 coisas**. A AI cuida de todo o resto.

### O que o usuário faz:

1. **Execute cada TC** no dispositivo/navegador de teste
2. **Capture screenshot** da tela com o resultado obtido
3. **Envie para a AI** a imagem + o resultado (aprovado ✅, reprovado ❌, bloqueado ⚠️) e qualquer observação relevante sobre o comportamento

### O que a AI faz automaticamente:

- Nomeia o arquivo de evidência no padrão `tc[número]-[descricao-curta].jpeg`
- Atualiza o status do TC no HTML (`pass`, `fail`, `block`)
- Adiciona a imagem na galeria de evidências do fluxo correspondente
- Preenche a caixa de observações com detalhes do teste
- Atualiza os contadores no `testData` do JavaScript
- Registra o bug na seção `BG-XX` se o TC for reprovado (incluindo severidade, passos para reprodução e comportamento obtido)
- Recalcula automaticamente o scoreboard e a taxa de aprovação

> ⏱️ **Prazo estimado:** De 1 a 3 dias úteis para execução completa. Bugs críticos podem estender o prazo (ciclo de reteste). Atrasos devem ser reportados ao Tech Lead.

---

## Referências

- Especificação completa do relatório HTML: [`references/report-spec.md`](references/report-spec.md)
- POP completo: `docs/pop-testes-manuais.html` (quando disponível no projeto)
