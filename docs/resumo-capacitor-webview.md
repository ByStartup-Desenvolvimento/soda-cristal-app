# Resumo: Configuração do Capacitor WebView

**Data:** 24/02/2026
**Branch:** `feature/capacitor-webview`

---

## Objetivo

Configurar o projeto **Soda Cristal App** (React + Vite) para gerar um APK Android via **Capacitor** (WebView nativa).

---

## Decisões Técnicas

- **Branch separada** — Mantida independente da `main` para não afetar o deploy web (Vercel)
- **HashRouter** — Necessário porque `BrowserRouter` não funciona em `file://` (WebView local)
- **Base relativa** — `base: './'` garante que JS/CSS/imagens carreguem corretamente no APK
- **App ID** — `com.sodacristal`

---

## Alterações Realizadas

### [MODIFY] `src/main.tsx`
- `BrowserRouter` → `HashRouter` (compatibilidade com WebView)

### [MODIFY] `vite.config.ts`
- Adicionado `base: './'` (caminhos relativos para assets)

### [NEW] `capacitor.config.ts`
- Configuração do Capacitor com `appId: 'com.sodacristal'` e `webDir: 'dist'`

### [NEW] `android/`
- Projeto nativo Android gerado pelo Capacitor

---

## Comandos Executados

```bash
# 1. Criação da branch
git checkout -b feature/capacitor-webview

# 2. Instalação do Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 3. Inicialização
npx cap init "sodacristal" "com.sodacristal" --web-dir dist

# 4. Build web
npm run build

# 5. Adição da plataforma Android
npx cap add android

# 6. Sincronização
npx cap sync android
```

---

## Próximos Passos

1. **Abrir no Android Studio:** `npx cap open android`
2. **Testar** no emulador ou device físico
3. **Gerar APK:** Build → Generate Signed Bundle / APK → APK

> **Workflow de atualização:** ao alterar código React, sempre rodar:
> ```bash
> npm run build && npx cap sync android
> ```
