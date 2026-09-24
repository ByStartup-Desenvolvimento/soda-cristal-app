/**
 * QA do PDV offline e do raio de check-in.
 *
 * Roda contra o build de producao (dist/) servido localmente, com a API
 * respondida por stub. Nao toca no servidor do cliente.
 *
 *   npx vite preview --port 41733 &
 *   node qa/qa-offline-pdv.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.QA_BASE || "http://127.0.0.1:41733";

const PRODUTOS = [
  {
    id: 101,
    descricao: "XAROPE GUARANA QA",
    valor_unitario: "24.00",
    valor_unitario_revenda: "24.00",
    valor_preco_especial: "22.00",
    ativo: 1,
    categoria: "Xarope",
  },
];
const PAGAMENTOS = [
  { id: 1, descricao: "DINHEIRO QA" },
  { id: 2, descricao: "PIX QA" },
];
const PROMOCOES = [
  {
    id: 900,
    ativo: true,
    descricao: "REVENDA 6 A 11 UN",
    quantidade: 6,
    data_validade: "2030-01-01",
    valor_desconto: 2,
    tipo: "revenda",
    un: "UN",
  },
];

const resultados = [];
function check(nome, ok, detalhe = "") {
  resultados.push({ nome, ok, detalhe });
  console.log(`${ok ? "PASS" : "FALHA"}  ${nome}${detalhe ? ` — ${detalhe}` : ""}`);
}

const json = (body) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(body),
});

async function stubApi(context, { falhar = false } = {}) {
  await context.unroute("**/api/**").catch(() => {});
  await context.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (falhar) return route.abort("internetdisconnected");
    if (url.includes("/produtos/")) return route.fulfill(json(PRODUTOS));
    if (url.includes("/meiospagamento/")) return route.fulfill(json(PAGAMENTOS));
    if (url.includes("/promocoes/")) return route.fulfill(json(PROMOCOES));
    return route.fulfill(json([]));
  });
}

const run = async () => {
  // Usa o Chrome do sistema: os browsers baixados do Playwright estao numa
  // versao diferente da lib instalada neste projeto.
  const browser = await chromium.launch({ channel: "chrome" });
  const context = await browser.newContext();

  await context.addInitScript(() => {
    localStorage.setItem("auth_token", "qa-token");
    localStorage.setItem("vendedorId", "21");
    localStorage.setItem("distribuidorId", "1");
    localStorage.setItem(
      "user",
      JSON.stringify({ id: 1, name: "QA Vendedor", username: "qa" }),
    );

    // Offline do ponto de vista do app: navigator.onLine falso + API
    // inalcancavel. Nao usamos context.setOffline porque ele bloquearia
    // tambem o servidor local que entrega o bundle (no celular o app ja
    // esta aberto/carregado quando o vendedor perde o sinal).
    if (localStorage.getItem("qa_offline") === "1") {
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        get: () => false,
      });
    }
  });

  const page = await context.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") console.log("   [console]", m.text().slice(0, 140));
  });

  // ---------- ETAPA 1: online, popula o cache ----------
  await stubApi(context);
  await page.goto(`${BASE}/pdv`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // A aba padrao e "Sifão" (garrafas); os xaropes da API ficam na aba "Xarope".
  const abrirAbaXarope = async () => {
    const aba = page.getByRole("button", { name: "Xarope", exact: true });
    if (await aba.count()) await aba.first().click();
    await page.waitForTimeout(400);
  };
  await abrirAbaXarope();

  const onlineTxt = await page.locator("body").innerText();
  check(
    "1. Online: catalogo carrega do servidor",
    onlineTxt.includes("XAROPE GUARANA QA"),
    onlineTxt.includes("XAROPE GUARANA QA") ? "" : "produto nao apareceu",
  );
  check(
    "2. Online: banner normal (sem aviso de cache)",
    !onlineTxt.includes("catálogo salvo no aparelho"),
  );

  // Confirma que o cache foi realmente gravado no IndexedDB
  await page.waitForTimeout(800);
  const gravado = await page.evaluate(async () => {
    const req = indexedDB.open("keyval-store");
    const db = await new Promise((res, rej) => {
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
    return await new Promise((res) => {
      const tx = db.transaction("keyval", "readonly");
      const g = tx.objectStore("keyval").get("soda-catalogo-pdv-storage");
      g.onsuccess = () => res(g.result ?? null);
      g.onerror = () => res(null);
    });
  });
  const temCacheGravado =
    !!gravado && JSON.stringify(gravado).includes("XAROPE GUARANA QA");
  check("3. Catalogo gravado no IndexedDB do aparelho", temCacheGravado);

  // ---------- ETAPA 2: offline ----------
  await page.evaluate(() => localStorage.setItem("qa_offline", "1"));
  await stubApi(context, { falhar: true });
  await page.goto(`${BASE}/pdv`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await abrirAbaXarope();

  const offTxt = await page.locator("body").innerText();
  const produtoOffline = offTxt.includes("XAROPE GUARANA QA");
  check(
    "4. OFFLINE: catalogo abre com os dados salvos",
    produtoOffline,
    produtoOffline ? "" : "tela abriu sem produto",
  );
  check(
    "5. OFFLINE: aviso de catalogo salvo aparece",
    offTxt.includes("catálogo salvo no aparelho"),
  );
  check(
    "6. OFFLINE: nao mostra erro bloqueante de catalogo",
    !offTxt.includes("Não foi possível carregar o catálogo nem"),
  );

  // Formas de pagamento disponiveis offline = a venda fecha
  const selectHab = await page
    .locator('[role="combobox"], select')
    .first()
    .isEnabled()
    .catch(() => false);
  check("7. OFFLINE: seletor de pagamento habilitado", selectHab);

  // ---------- ETAPA 3: controle negativo ----------
  // Sem cache e sem internet tem que falhar de forma clara (prova que quem
  // sustentou a etapa 2 foi o cache, e nao um acaso).
  await page.evaluate(async () => {
    const req = indexedDB.open("keyval-store");
    const db = await new Promise((res) => {
      req.onsuccess = () => res(req.result);
    });
    await new Promise((res) => {
      const tx = db.transaction("keyval", "readwrite");
      tx.objectStore("keyval").delete("soda-catalogo-pdv-storage");
      tx.oncomplete = () => res();
    });
  });
  await page.goto(`${BASE}/pdv`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await abrirAbaXarope();
  const semCacheTxt = await page.locator("body").innerText();
  check(
    "8. CONTROLE: sem cache e sem internet, avisa com clareza",
    !semCacheTxt.includes("XAROPE GUARANA QA") &&
      semCacheTxt.includes("Não foi possível carregar"),
  );

  await browser.close();

  const falhas = resultados.filter((r) => !r.ok);
  console.log(
    `\n=== ${resultados.length - falhas.length}/${resultados.length} passaram ===`,
  );
  process.exit(falhas.length ? 1 : 0);
};

run().catch((e) => {
  console.error("ERRO NO QA:", e);
  process.exit(2);
});
