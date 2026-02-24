# Guia Rápido: React + Vite → APK com Capacitor

Transformar um projeto **React + Vite** em APK usando **Capacitor** (WebView nativa).

---

## Visão geral

- Você continua codando tudo em React + Vite.
- Capacitor só empacota o `dist` em um app Android nativo (WebView).
- Build web (`npm run build`) → sincroniza com Capacitor → gera APK no Android Studio.

---

## 1. Requisitos

- Node.js + npm instalados.
- Android Studio (SDK + emulador ou device físico).
- Projeto React + Vite já funcionando.
- ADB opcional para instalar APK pelo terminal.

---

## 2. Instalar Capacitor no projeto

Na raiz do projeto:

`npm install @capacitor/core @capacitor/cli @capacitor/android`

---

## 3. Inicializar Capacitor

`npx cap init`

Valores sugeridos:

- App name: `Meu App`
- App ID: `com.meuusuario.meuapp`
- Web dir: `dist` (pasta de build do Vite).

Exemplo de `capacitor.config.ts`:

`tsimport { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meuusuario.meuapp',
  appName: 'Meu App',
  webDir: 'dist',
  bundledWebRuntime: false,
};

export default config;`

---

## 4. Ajustar Vite para rodar em WebView

No `vite.config.(ts|js)`:

`tsimport { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // importante para assets funcionarem dentro do APK
});`

Isso evita que a WebView quebre caminhos de JS/CSS/imagens.

---

## 5. Gerar build da aplicação web

`bashnpm run build`

- Saída: pasta `dist` com tudo pronto para ser servido na WebView.

---

## 6. Criar projeto Android com Capacitor

`npx cap add android`

- Cria a pasta `android/` com o projeto nativo.

---

## 7. Sincronizar web → Android

Sempre que fizer um novo build:

`npm run build
npx cap sync android`

- `sync` copia `dist` e atualiza dependências nativas.

---

## 8. Abrir no Android Studio e rodar

`npx cap open android`

No Android Studio:

- Aguarde o Gradle sincronizar.
- Selecione um emulador ou device físico.
- Clique em **Run** (botão verde play) para instalar e testar o app.

---

## 9. Gerar APK de release

No Android Studio:

1. Menu **Build → Generate Signed Bundle / APK**.
2. Escolha **APK**.
3. Crie/seleciona uma keystore e configure senha/alias.
4. Escolha `release`.
5. Finalize o wizard.

Caminho típico do APK:

`textandroid/app/build/outputs/apk/release/app-release.apk`

Instalar via ADB (opcional):

`adb install app-release.apk`

---

## 10. (Opcional) Live reload no device

1. Rodar dev server do Vite:

`npm run dev -- --host`

1. Ajustar `capacitor.config.ts`:

`tsconst config: CapacitorConfig = {
  appId: 'com.meuusuario.meuapp',
  appName: 'Meu App',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'http://SEU_IP_LOCAL:5173/',
    cleartext: true,
  },
};`

1. Rodar no Android:

`npx cap run android`

A WebView passa a apontar para o servidor do Vite com hot reload.

---

## 11. Checklist rápido

- [ ]  Configurar `base: './'` no Vite.
- [ ]  `npm install @capacitor/core @capacitor/cli @capacitor/android`
- [ ]  `npx cap init` (webDir = `dist`)
- [ ]  `npm run build`
- [ ]  `npx cap add android`
- [ ]  `npx cap sync android`
- [ ]  `npx cap open android`
- [ ]  Gerar APK em **Build → Generate Signed Bundle / APK**.

---

amigo crie um documento me md para eu guardar no notion

`text# Transformar React + Vite em APK Android com Capacitor

Este guia mostra como pegar um projeto React com Vite e gerar um APK Android usando Capacitor (WebView nativa).[web:7][web:13]

---

## 1. Requisitos

- Node.js e npm instalados.
- Android Studio instalado (com Android SDK e emulador configurado).[web:14]
- Projeto React + Vite já criado e rodando com `npm run dev`.
- Git opcional, mas recomendado.

---

## 2. Instalação do Capacitor

Na raiz do projeto React + Vite:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android`

Isso adiciona o core do Capacitor, a CLI e o suporte nativo para Android.[web:7][web:14]

---

## **3. Inicializar o Capacitor no projeto**

Ainda na raiz:

`bashnpx cap init`

Valores sugeridos:

- **App name**: Nome do seu app (ex.: `Meu App`).
- **App ID**: Identificador único (ex.: `com.meuusuario.meuapp`).[web:19]
- **Web directory**: `dist` (pasta de build do Vite).[web:15]

Se quiser editar depois, abra `capacitor.config.ts` ou `capacitor.config.json` e confira:

`tsconst config: CapacitorConfig = {
  appId: 'com.meuusuario.meuapp',
  appName: 'Meu App',
  webDir: 'dist',
  bundledWebRuntime: false,
};
export default config;`

---

## **4. Ajuste do Vite (importante para WebView)**

No `vite.config.js` (ou `vite.config.ts`), garanta que a base dos assets seja relativa:

`tsimport { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // garante que JS/CSS carreguem corretamente dentro do APK
});`

Isso evita erros de caminhos de arquivos quando rodar via WebView nativa.[web:6]

---

## **5. Build da aplicação web**

Gere a versão de produção:

`npm run build`

O Vite vai criar a pasta `dist` com o bundle da sua aplicação.[web:13]

---

## **6. Adicionar plataforma Android**

Após o build:

`npx cap add android`

Isso cria a pasta `android/` com o projeto nativo (Android Studio). Se já existir, o comando não precisa ser repetido.[web:14][web:19]

---

## **7. Sincronizar arquivos web com o Android**

Sempre que fizer build novo da aplicação web, rode:`npm run build
npx cap sync android`

`sync` copia o conteúdo de `dist` para o projeto Android e atualiza dependências nativas.[web:16][web:13]

---

## **8. Abrir o projeto no Android Studio**

Use:

`npx cap open android`

Isso abre o projeto `android/` diretamente no Android Studio.[web:19]

No Android Studio:

1. Aguarde o Gradle sincronizar.
2. Selecione um emulador ou dispositivo físico.
3. Clique no botão **Run** (seta verde) para instalar e testar o app.

---

## **9. Gerar APK de release**

No Android Studio:

1. Vá em **Build > Generate Signed Bundle / APK**.
2. Escolha **APK** e avance.
3. Crie uma nova **Key store** (se ainda não tiver) e defina senha/alias.
4. Selecione o módulo `app` e o tipo `release`.
5. Conclua o wizard para gerar o APK.

O APK gerado normalmente fica em:

`textandroid/app/build/outputs/apk/release/app-release.apk`

Você pode instalar no dispositivo com:

`adb install app-release.apk`

(Com `adb` configurado e dispositivo conectado e com modo desenvolvedor ativado.)[web:10]

---

## **10. Live Reload (opcional, para desenvolvimento)**

Se quiser testar com live reload em dispositivo/emulador:

1. Rode o Vite:

`npm run dev -- --host`

1. No `capacitor.config.ts`, adicione o servidor (somente para dev):

`tsconst config: CapacitorConfig = {
  appId: 'com.meuusuario.meuapp',
  appName: 'Meu App',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'http://SEU_IP_LOCAL:5173/',
    cleartext: true,
  },
};`

1. Rode:

`npx cap run android`

Agora a WebView carrega direto do servidor de dev do Vite, com hot reload.[web:18]

---

## **11. Checklist rápido (resumo)**

1. Instalar Capacitor:
    - `npm install @capacitor/core @capacitor/cli @capacitor/android`
2. Inicializar Capacitor:
    - `npx cap init` (webDir = `dist`)
3. Ajustar Vite:
    - `base: './'` no `vite.config`
4. Build web:
    - `npm run build`
5. Adicionar Android:
    - `npx cap add android`
6. Sincronizar:
    - `npx cap sync android`
7. Abrir no Android Studio:
    - `npx cap open android`
8. Rodar e gerar APK:
    - Run pelo Android Studio
    - Build > Generate Signed Bundle / APK > APK.[web:7][web:13][web:14][web:16]

---

## **12. Dicas finais**

- Sempre rode `npm run build` + `npx cap sync android` antes de gerar nova versão.
- Mantenha Android Studio, SDK e Gradle atualizados para evitar erros de build.[web:14]
- Para recursos avançados (push, câmera, etc.), use plugins do Capacitor e chame-os do React.[web:7]