import { chromium } from "playwright";
const BASE = "http://127.0.0.1:41733";
const b = await chromium.launch({ channel: "chrome" });
const ctx = await b.newContext();
const reqs = [];
await ctx.route("**/api/**", async (r) => {
  const u = r.request().url();
  reqs.push(u.replace(BASE, ""));
  if (u.includes("/produtos/")) return r.fulfill({status:200,contentType:"application/json",body:JSON.stringify([{id:101,descricao:"XAROPE GUARANA QA",valor_unitario:"24.00",valor_unitario_revenda:"24.00",valor_preco_especial:"22.00",ativo:1,categoria:"Xarope"}])});
  if (u.includes("/meiospagamento/")) return r.fulfill({status:200,contentType:"application/json",body:JSON.stringify([{id:1,descricao:"DINHEIRO QA"}])});
  if (u.includes("/promocoes/")) return r.fulfill({status:200,contentType:"application/json",body:JSON.stringify([])});
  return r.fulfill({status:200,contentType:"application/json",body:"[]"});
});
await ctx.addInitScript(() => {
  localStorage.setItem("auth_token","qa-token");
  localStorage.setItem("vendedorId","21");
  localStorage.setItem("distribuidorId","1");
  localStorage.setItem("user",JSON.stringify({id:1,name:"QA Vendedor",username:"qa"}));
});
const p = await ctx.newPage();
p.on("pageerror", e => console.log("[pageerror]", e.message));
await p.goto(`${BASE}/#/pdv`, { waitUntil: "networkidle" });
await p.waitForTimeout(2500);
console.log("URL final:", p.url());
console.log("REQUESTS:", JSON.stringify(reqs, null, 1));
const txt = await p.evaluate(() => document.body.innerText.slice(0, 700));
console.log("--- TELA ---\n" + txt);
await b.close();
