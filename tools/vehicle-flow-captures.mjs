import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
const require=createRequire('C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright'),phase=process.argv[2]||'after';
const b=await chromium.launch({channel:'msedge',headless:true}),ROOT='http://127.0.0.1:9440',OUT='artifacts/vehicle-flow';
const {vehicles}=JSON.parse(await readFile(OUT+'/admin-report.json','utf8'));
try{for(const width of [1440,390]){
 const c=await b.newContext({viewport:{width,height:width===1440?1000:844},reducedMotion:'reduce',hasTouch:width<900,isMobile:width<900}),p=await c.newPage();
 if(phase==='before')await p.route('**/assets/app-*.css',async route=>{const r=await route.fetch();const css=await r.text(),cut=css.indexOf(':root{--rp-red:');await route.fulfill({response:r,body:cut<0?css:css.slice(0,cut)});});
 const settle=async()=>{await p.locator('.vehicle-photo,.gallery-slide img').evaluateAll(imgs=>Promise.all(imgs.map(i=>{i.loading='eager';return i.decode().catch(()=>{});})));};
 const top=selector=>p.locator(selector).evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY-90));
 await p.goto(ROOT);await p.evaluate(()=>document.fonts.ready);
 for(const [name,selector] of [['catalog','#catalogo'],['finance','#opciones'],['heritage','#nosotros'],['contact','#contacto']]){
  await top(selector);await settle();await p.screenshot({path:OUT+'/'+phase+'-'+name+'-'+width+'.png'});
 }
 if(phase==='after'){
  for(const v of vehicles){await p.goto(v.url);await p.evaluate(()=>document.fonts.ready);await settle();await p.screenshot({path:OUT+'/vehicle-'+v.id+'-'+width+'.png'});
   if(v.name==='Galería'){await p.locator('[data-next]').click();await p.waitForFunction(()=>document.querySelector('[data-position]').textContent.startsWith('2'));await p.screenshot({path:OUT+'/gallery-second-'+width+'.png'});}
  }
 }
 await p.goto(vehicles.find(v=>v.name==='Disponible').url);await top('#unit-info');await p.screenshot({path:OUT+'/'+phase+'-detail-'+width+'.png'});
 await c.close();
}}finally{await b.close();}
