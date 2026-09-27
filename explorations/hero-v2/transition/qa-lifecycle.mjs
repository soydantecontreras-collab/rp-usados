import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire('C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const b=await chromium.launch({channel:'msedge',headless:true});
const url='http://127.0.0.1:9420/hero-v2/transition/';
const results=[];
function check(name,value){assert(value,name);results.push({name,passed:true});}
try{
 const c=await b.newContext({viewport:{width:1440,height:900}}),p=await c.newPage();await p.goto(url);
 await p.waitForFunction(()=>__RP_V2__?.state==='ready');
 await p.keyboard.press('Tab');check('keyboard skip receives focus',await p.locator('.skip').evaluate(x=>x===document.activeElement));
 await p.keyboard.press('Enter');check('keyboard skip focuses catalog',await p.evaluate(()=>document.activeElement.id==='catalogo'));
 await p.getByRole('button',{name:'WhatsApp',exact:true}).click();await p.keyboard.press('Escape');
 check('WhatsApp retains pending-contact dialog and returns focus',await p.evaluate(()=>document.activeElement.hasAttribute('data-whatsapp')));
 await p.evaluate(()=>{const d=document.querySelector('.hero-track').offsetHeight-document.querySelector('.hero-stage').offsetHeight;scrollTo(0,d*.99);requestAnimationFrame(()=>scrollTo(0,d*.15));});
 await p.waitForFunction(()=>Math.abs(__RP_V2__.progress-.15)<.003&&Math.abs(__RP_V2__.presentedTime-__RP_V2__.targetTime)<.013);
 check('fast reversal ends at latest target',true);
 await p.setViewportSize({width:1100,height:760});
 await p.waitForFunction(()=>!document.querySelector('video').seeking&&Math.abs(__RP_V2__.presentedTime-__RP_V2__.targetTime)<.013);
 check('resize retains frame synchronization',true);
 await p.evaluate(()=>{document.documentElement.style.zoom='2';});
 await p.getByRole('navigation',{name:'Navegación principal'}).getByRole('link',{name:'Ver vehículos'}).click();
 check('200% zoom no horizontal overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await c.close();
 const f=await b.newContext({viewport:{width:1440,height:900}}),q=await f.newPage();await q.route('**/*.mp4',r=>r.abort());await q.goto(url);
 await q.waitForFunction(()=>__RP_V2__?.state==='fallback');
 check('media failure keeps poster',await q.locator('.hero-poster').evaluate(x=>getComputedStyle(x).visibility!=='hidden'));
 await q.getByRole('navigation',{name:'Navegación principal'}).getByRole('link',{name:'Ver vehículos'}).click();
 check('media failure keeps catalog reachable',await q.evaluate(()=>document.activeElement.id==='catalogo'));
 await f.close();
}finally{await writeFile(new URL('../qa/transition/lifecycle.json',import.meta.url),JSON.stringify(results,null,2));await b.close();}
console.log(JSON.stringify(results,null,2));
