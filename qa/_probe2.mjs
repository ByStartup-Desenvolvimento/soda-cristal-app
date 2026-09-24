import { chromium } from "playwright";
const BASE = "http://127.0.0.1:41733";
const b = await chromium.launch({ channel: "chrome" });
const ctx = await b.newContext();
const PRODUTOS=[{id:101,descricao:"XAROPE GUARANA QA",valor_unitario:"24.00",valor_unitario_revenda:"24.00",valor_preco_especial:"22.00",ativo:1,categoria:"Xarope"}];
let falhar=false;
await ctx.route("**/api/**", async (r) => {
  if (falhar) return r.abort("internetdisconnected");
  const u=r.request().url();
  const j=(x)=>r.fulfill({status:200,contentType:"application/json",body:JSON.stringify(x)});
  if(u.includes("/produtos/"))return j(PRODUTOS);
  if(u.includes("/meiospagamento/"))return j([{id:1,descricao:"DINHEIRO QA"}]);
  if(u.includes("/promocoes/"))return j([]);
  return j([]);
});
await ctx.addInitScript(() => {
  localStorage.setItem("auth_token","qa-token");
  localStorage.setItem("vendedorId","21");
  localStorage.setItem("distribuidorId","1");
  localStorage.setItem("user",JSON.stringify({id:1,name:"QA",username:"qa"}));
  if (localStorage.getItem("qa_offline")==="1") {
    Object.defineProperty(navigator,"onLine",{configurable:true,get:()=>false});
  }
});
const p = await ctx.newPage();
await p.goto(`${BASE}/#/pdv`,{waitUntil:"networkidle"}); await p.waitForTimeout(2000);
await p.evaluate(()=>localStorage.setItem("qa_offline","1"));
falhar=true;
await p.goto(`${BASE}/#/pdv`,{waitUntil:"domcontentloaded"}); await p.waitForTimeout(2500);
console.log("=== OFFLINE COM CACHE ===");
console.log((await p.locator("body").innerText()).slice(0,600));
await b.close();
