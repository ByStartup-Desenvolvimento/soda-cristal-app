import { chromium } from "playwright";
const BASE="http://127.0.0.1:41733";
const b=await chromium.launch({channel:"chrome"});
const ctx=await b.newContext();
let falhar=false; const log=[];
const PRODUTOS=[{id:101,descricao:"XAROPE GUARANA QA",valor_unitario:"24.00",valor_unitario_revenda:"24.00",valor_preco_especial:"22.00",ativo:1,categoria:"Xarope"}];
await ctx.route("**/api/**",async r=>{ const u=r.request().url();
 log.push((falhar?"ABORT ":"OK    ")+u.replace(BASE,""));
 if(falhar) return r.abort("internetdisconnected");
 const j=x=>r.fulfill({status:200,contentType:"application/json",body:JSON.stringify(x)});
 if(u.includes("/produtos/"))return j(PRODUTOS);
 if(u.includes("/meiospagamento/"))return j([{id:1,descricao:"DINHEIRO QA"}]);
 return j([]); });
await ctx.addInitScript(()=>{
 localStorage.setItem("auth_token","t");localStorage.setItem("vendedorId","21");
 localStorage.setItem("distribuidorId","1");localStorage.setItem("user",JSON.stringify({id:1,name:"QA"}));
 if(localStorage.getItem("qa_offline")==="1"){
   try{Object.defineProperty(navigator,"onLine",{configurable:true,get:()=>false});
       window.__ovr="ok";}catch(e){window.__ovr="ERRO: "+e.message;}
 } else { window.__ovr="nao pedido"; }
});
const p=await ctx.newPage();
await p.goto(`${BASE}/#/pdv`,{waitUntil:"networkidle"});await p.waitForTimeout(1500);
await p.evaluate(()=>localStorage.setItem("qa_offline","1"));
falhar=true;
const apagou=await p.evaluate(async()=>{const q=indexedDB.open("keyval-store");
 const db=await new Promise(r=>{q.onsuccess=()=>r(q.result)});
 await new Promise(r=>{const tx=db.transaction("keyval","readwrite");tx.objectStore("keyval").delete("soda-catalogo-pdv-storage");tx.oncomplete=()=>r()});
 const q2=indexedDB.open("keyval-store");const db2=await new Promise(r=>{q2.onsuccess=()=>r(q2.result)});
 return await new Promise(r=>{const tx=db2.transaction("keyval","readonly");const g=tx.objectStore("keyval").get("soda-catalogo-pdv-storage");g.onsuccess=()=>r(g.result===undefined?"APAGADO":"AINDA EXISTE")});});
log.length=0;
await p.goto(`${BASE}/#/pdv`,{waitUntil:"domcontentloaded"});await p.waitForTimeout(3000);
console.log("cache:",apagou);
console.log("override:",await p.evaluate(()=>window.__ovr));
console.log("navigator.onLine:",await p.evaluate(()=>navigator.onLine));
console.log("requisicoes apos recarregar:",JSON.stringify(log,null,1));
console.log("--- TELA ---\n"+(await p.locator("body").innerText()).slice(0,300));
await b.close();
