/**
 * QA da regra de GPS do check-in: raio de 350m e leitura tolerante a offline.
 *
 * Importa o modulo REAL do app (src/shared/utils/location.ts) atraves do
 * servidor de desenvolvimento do Vite, com navigator.geolocation simulado.
 *
 *   npx vite --port 41734 &
 *   node qa/qa-gps.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.QA_BASE || "http://127.0.0.1:41734";

const resultados = [];
function check(nome, ok, detalhe = "") {
  resultados.push({ nome, ok });
  console.log(`${ok ? "PASS" : "FALHA"}  ${nome}${detalhe ? ` — ${detalhe}` : ""}`);
}

const run = async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log("   [pageerror]", e.message));

  await page.goto(BASE, { waitUntil: "domcontentloaded" });

  const out = await page.evaluate(async () => {
    const mod = await import("/src/shared/utils/location.ts");
    const {
      RAIO_CHECKIN_METROS,
      estaDentroDoRaio,
      calculateDistance,
      obterLocalizacaoTolerante,
    } = mod;

    const r = {};
    r.raio = RAIO_CHECKIN_METROS;

    // --- Regra do raio ---
    r.dentro120 = estaDentroDoRaio(120, null); // antes (100m) bloqueava
    r.dentro349 = estaDentroDoRaio(349, null);
    r.limite350 = estaDentroDoRaio(350, null);
    r.fora351 = estaDentroDoRaio(351, null);
    r.fora900 = estaDentroDoRaio(900, null);
    // Margem de erro do aparelho entra na conta
    r.margemSalva = estaDentroDoRaio(500, 200); // 500-200=300 -> libera
    r.margemNaoSalvaLonge = estaDentroDoRaio(900, 200); // 900-200=700 -> bloqueia
    r.precisaoInvalidaIgnorada = estaDentroDoRaio(400, NaN); // sem margem -> bloqueia
    r.distanciaInvalidaBloqueia = estaDentroDoRaio(NaN, 10);

    // Coerencia com a Haversine: ~300m ao norte libera, ~900m bloqueia
    const lat = -22.2208, lng = -54.8057; // Dourados/MS
    const d300 = calculateDistance(lat, lng, lat + 0.0027, lng);
    const d900 = calculateDistance(lat, lng, lat + 0.0081, lng);
    r.real300 = { m: Math.round(d300), ok: estaDentroDoRaio(d300, null) };
    r.real900 = { m: Math.round(d900), ok: estaDentroDoRaio(d900, null) };

    // --- Leitura de GPS em duas etapas ---
    const pos = (accuracy) => ({
      coords: { latitude: lat, longitude: lng, accuracy },
    });

    // Cenario A: GPS novo responde normalmente
    let chamadas = [];
    navigator.geolocation.getCurrentPosition = (ok, _err, opts) => {
      chamadas.push(opts);
      ok(pos(12));
    };
    const a = await obterLocalizacaoTolerante();
    r.cenarioA = {
      usouCache: a.usouUltimaPosicaoConhecida,
      precisao: a.precisaoMetros,
      chamadas: chamadas.length,
      timeout1: chamadas[0]?.timeout,
      altaPrecisao1: chamadas[0]?.enableHighAccuracy,
    };

    // Cenario B: leitura nova falha (timeout), cai na ultima posicao conhecida
    chamadas = [];
    navigator.geolocation.getCurrentPosition = (ok, err, opts) => {
      chamadas.push(opts);
      if (opts.maximumAge === 0) return err({ code: 3, message: "TIMEOUT" });
      ok(pos(180));
    };
    const b = await obterLocalizacaoTolerante();
    r.cenarioB = {
      usouCache: b.usouUltimaPosicaoConhecida,
      precisao: b.precisaoMetros,
      chamadas: chamadas.length,
      maximumAge2: chamadas[1]?.maximumAge,
    };

    // Cenario C: nenhuma das duas responde -> erro claro
    navigator.geolocation.getCurrentPosition = (_ok, err) =>
      err({ code: 3, message: "TIMEOUT" });
    try {
      await obterLocalizacaoTolerante();
      r.cenarioC = "NAO_LANCOU";
    } catch {
      r.cenarioC = "LANCOU";
    }

    return r;
  });

  check("1. Raio do check-in = 350m", out.raio === 350, `valor: ${out.raio}`);
  check("2. 120m libera (antes, com 100m, bloqueava)", out.dentro120 === true);
  check("3. 349m libera / 350m libera / 351m bloqueia",
    out.dentro349 === true && out.limite350 === true && out.fora351 === false);
  check("4. 900m continua bloqueado", out.fora900 === false);
  check("5. Margem de erro do aparelho conta (500m com 200m de erro libera)",
    out.margemSalva === true);
  check("6. Margem nao vira passe livre (900m com 200m de erro bloqueia)",
    out.margemNaoSalvaLonge === false);
  check("7. Precisao invalida e ignorada com seguranca",
    out.precisaoInvalidaIgnorada === false);
  check("8. Distancia invalida bloqueia", out.distanciaInvalidaBloqueia === false);
  check(`9. Haversine real: ${out.real300.m}m libera, ${out.real900.m}m bloqueia`,
    out.real300.ok === true && out.real900.ok === false);

  check("10. GPS novo: 1 chamada, alta precisao, 30s (era 15s)",
    out.cenarioA.usouCache === false &&
      out.cenarioA.chamadas === 1 &&
      out.cenarioA.timeout1 === 30000 &&
      out.cenarioA.altaPrecisao1 === true,
    JSON.stringify(out.cenarioA));
  check("11. GPS novo falha: usa a ultima posicao conhecida (antes travava)",
    out.cenarioB.usouCache === true &&
      out.cenarioB.chamadas === 2 &&
      out.cenarioB.maximumAge2 === 300000,
    JSON.stringify(out.cenarioB));
  check("12. Precisao da leitura de cache e propagada para o raio",
    out.cenarioB.precisao === 180);
  check("13. Sem GPS nenhum: erro claro, nao silencioso",
    out.cenarioC === "LANCOU");

  await browser.close();
  const falhas = resultados.filter((r) => !r.ok);
  console.log(`\n=== ${resultados.length - falhas.length}/${resultados.length} passaram ===`);
  process.exit(falhas.length ? 1 : 0);
};

run().catch((e) => {
  console.error("ERRO NO QA:", e);
  process.exit(2);
});
