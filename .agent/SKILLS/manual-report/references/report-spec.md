# Especificação Técnica — Relatório de Testes Manuais HTML

## Paleta de Cores (CSS Variables)

```css
:root {
  --bg-page: #0f1117;
  --bg-card: #1a1d27;
  --bg-card2: #20233a;
  --border: #2a2f4a;
  --accent: #6c63ff;
  --accent-light: #8b85ff;
  --accent-glow: rgba(108, 99, 255, 0.15);
  --pass: #22c55e;
  --fail: #ef4444;
  --block: #f59e0b;
  --pending: #94a3b8;
  --text-primary: #e2e8f0;
  --text-muted: #8892a4;
  --radius: 12px;
  --font: 'Inter', 'Segoe UI', system-ui, sans-serif;
}
```

## Estrutura HTML do Relatório

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Relatório de Testes Manuais — [NOME DO PROJETO]</title>
  <!-- Google Fonts: Inter -->
  <!-- CSS completo com dark mode ByStartup -->
</head>
<body>

  <!-- LIGHTBOX para ampliar imagens -->
  <div id="lightbox">
    <span id="lightbox-close" onclick="closeLightbox()">&#x2715;</span>
    <img id="lightbox-img" src="" alt="Evidência ampliada" />
  </div>

  <!-- TOPBAR -->
  <header class="topbar">
    <div class="topbar-brand">
      <div class="logo-dot">🎯</div>
      <div>
        <h1>[Nome do Projeto]</h1>
        <span>Relatório de Testes Manuais</span>
      </div>
    </div>
    <div class="topbar-meta">
      <span class="badge-version">v1.0 — [Sprint/Versão]</span>
    </div>
  </header>

  <!-- HERO com metadados -->
  <section class="hero">
    <div class="hero-inner">
      <div class="hero-tag">📋 QA Report</div>
      <h2>Relatório de Testes Manuais</h2>
      <p>[Descrição do objetivo dos testes]</p>
      <div class="hero-meta">
        <div class="hero-meta-item">
          <label>Projeto</label>
          <span>[Nome]</span>
        </div>
        <div class="hero-meta-item">
          <label>Plataforma</label>
          <span>[Mobile/Web/API]</span>
        </div>
        <div class="hero-meta-item">
          <label>Executor</label>
          <span id="meta-executor">—</span>
        </div>
        <div class="hero-meta-item">
          <label>Data</label>
          <span id="meta-data">—</span>
        </div>
        <div class="hero-meta-item">
          <label>Ambiente</label>
          <span>[Homologação/Staging/Dev]</span>
        </div>
      </div>
    </div>
  </section>

  <main class="container">

    <!-- SCOREBOARD -->
    <div class="scoreboard" id="scoreboard">
      <div class="score-card total">
        <div class="score-icon">🧪</div>
        <div class="score-num" id="sc-total">0</div>
        <div class="score-label">Total de Casos</div>
      </div>
      <div class="score-card pass">
        <div class="score-icon">✅</div>
        <div class="score-num" id="sc-pass">0</div>
        <div class="score-label">Aprovados</div>
      </div>
      <div class="score-card fail">
        <div class="score-icon">❌</div>
        <div class="score-num" id="sc-fail">0</div>
        <div class="score-label">Reprovados</div>
      </div>
      <div class="score-card block">
        <div class="score-icon">⚠️</div>
        <div class="score-num" id="sc-block">0</div>
        <div class="score-label">Bloqueados</div>
      </div>
      <div class="score-card pct">
        <div class="score-icon">📊</div>
        <div class="score-num" id="sc-pct">—</div>
        <div class="score-label">Taxa de Aprovação</div>
      </div>
    </div>

    <!-- BARRA DE PROGRESSO -->
    <div class="progress-section">
      <h3>Progresso geral de aprovação</h3>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" id="progress-bar" style="width: 0%"></div>
      </div>
      <div class="progress-labels">
        <span>0%</span>
        <span id="progress-pct-label">0%</span>
      </div>
    </div>

    <!-- TÍTULO DA SEÇÃO DE FLUXOS -->
    <div class="section-title">
      <div class="icon">🧪</div>
      Casos de Teste por Fluxo
    </div>

    <!-- FLUXO (repetir para cada FL-XX) -->
    <div class="flow-block open" id="flow-[id]">
      <div class="flow-header" onclick="toggleFlow('flow-[id]')">
        <div class="flow-header-left">
          <span class="flow-id">FL-01</span>
          <span class="flow-title">[Nome do Fluxo]</span>
        </div>
        <span class="flow-chevron">▼</span>
      </div>
      <div class="flow-body">
        <table class="test-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Caso de Teste</th>
              <th>Pré-condição</th>
              <th>Resultado Esperado</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>TC-01</td>
              <td>[Descrição do teste]</td>
              <td>[Pré-condição]</td>
              <td>[Resultado esperado]</td>
              <td><span class="status pending dot">Pendente</span></td>
            </tr>
          </tbody>
        </table>

        <!-- GALERIA DE EVIDÊNCIAS -->
        <div class="evidence-section">
          <h4>📸 Evidências Visuais</h4>
          <div class="evidence-gallery" id="gallery-[id]">
            <div class="evidence-placeholder">
              <span>📷</span>
              Screenshots serão adicionados após execução dos testes
            </div>
          </div>
        </div>

        <!-- OBSERVAÇÕES -->
        <div class="obs-box">
          <strong>Observações:</strong>
          Testes pendentes de execução.
        </div>
      </div>
    </div>

    <!-- LOG DE BUGS -->
    <div class="section-title" style="margin-top: 2rem;">
      <div class="icon">🐛</div>
      Log de Bugs
    </div>

    <!-- BUG CARD (repetir para cada BG-XX) -->
    <div class="bug-card [severidade]">
      <div class="bug-header">
        <div>
          <span class="bug-id">BG-01</span>
          <div class="bug-title">[Título do Bug]</div>
        </div>
        <span class="severity [severidade]">[CRÍTICO/ALTO/MÉDIO/BAIXO]</span>
      </div>
      <dl class="bug-body">
        <dt>TC Relacionado</dt>
        <dd>TC-XX</dd>
        <dt>Passos para Reproduzir</dt>
        <dd>[Passos]</dd>
        <dt>Comportamento Esperado</dt>
        <dd>[Esperado]</dd>
        <dt>Comportamento Obtido</dt>
        <dd>[Obtido]</dd>
        <dt>Ambiente</dt>
        <dd>[Dispositivo/Browser/SO]</dd>
        <dt>Status</dt>
        <dd>🔴 Aberto / ✅ Corrigido</dd>
      </dl>
    </div>

    <!-- MATRIZ DE COBERTURA -->
    <div class="section-title" style="margin-top: 2rem;">
      <div class="icon">📊</div>
      Matriz de Cobertura
    </div>
    <table class="matrix-table">
      <thead>
        <tr>
          <th>Fluxo</th>
          <th>Total TCs</th>
          <th>Aprovados</th>
          <th>Reprovados</th>
          <th>Bloqueados</th>
          <th>Taxa</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>FL-01 — [Nome]</td>
          <td>[N]</td>
          <td>[N]</td>
          <td>[N]</td>
          <td>[N]</td>
          <td>[%]</td>
        </tr>
        <!-- ... mais linhas ... -->
        <tr style="font-weight: 700; background: rgba(108,99,255,0.06);">
          <td>TOTAL</td>
          <td id="mat-total">—</td>
          <td id="mat-pass">—</td>
          <td id="mat-fail">—</td>
          <td id="mat-block">—</td>
          <td id="mat-pct">—</td>
        </tr>
      </tbody>
    </table>

  </main>

  <footer class="footer">
    Gerado pela equipe de QA — <strong>ByStartup</strong> · POP-QA-001 v1.0
  </footer>

</body>
</html>
```

## JavaScript Obrigatório

```javascript
// Configurar com os totais reais após execução
const testData = {
  fluxo1: { total: 5, pass: 0, fail: 0, block: 0 },
  fluxo2: { total: 4, pass: 0, fail: 0, block: 0 },
  // adicione um por fluxo
};

// Funções obrigatórias (incluir no relatório):
// - initScoreboard() — calcula e exibe os totais
// - toggleFlow(id) — abre/fecha fluxo no acordeão
// - openLightbox(src) — abre imagem em lightbox
// - closeLightbox() — fecha lightbox
// - Inicialização: document.addEventListener('DOMContentLoaded', ...)
//   que seta meta-executor, meta-data e chama initScoreboard()
```

## Status Badges

```html
<!-- Aprovado -->
<span class="status pass dot">Aprovado</span>

<!-- Reprovado -->
<span class="status fail dot">Reprovado</span>

<!-- Bloqueado -->
<span class="status block dot">Bloqueado</span>

<!-- Pendente -->
<span class="status pending dot">Pendente</span>
```

## Adicionando Evidência na Galeria

```html
<div class="evidence-item" onclick="openLightbox('evidencias/tc01-nome.jpeg')">
  <img src="evidencias/tc01-nome.jpeg" alt="TC-01 — Descrição"
    onerror="this.style.display='none';this.parentElement.querySelector('.evidence-caption').textContent='📷 TC-01 (imagem na pasta evidencias/)';" />
  <div class="evidence-caption">TC-01 — Descrição ✅</div>
</div>
```

## Nomenclatura dos Arquivos de Evidência

| Padrão | Exemplo |
|--------|---------|
| `tc[número]-[descricao-curta].[ext]` | `tc01-tela-login.jpeg` |
| | `tc07-cadastro-sucesso.png` |
| | `tc15-detalhe-produto.jpeg` |

**Extensões aceitas:** `.jpeg`, `.jpg`, `.png`, `.webp`, `.gif`

## Checklist de Qualidade do Relatório Gerado

- [ ] Abre no browser sem erros JavaScript no console
- [ ] Scoreboard exibe os números corretos
- [ ] Barra de progresso funciona
- [ ] Acordeão abre/fecha cada fluxo
- [ ] Lightbox funciona ao clicar nas imagens
- [ ] Todos os TCs começam como "Pendente"
- [ ] Seção de bugs presente (mesmo que vazia)
- [ ] Matriz de cobertura calculada
- [ ] Footer com referência ao POP-QA-001
- [ ] Relatório é autocontido (sem dependências externas de servidor)
