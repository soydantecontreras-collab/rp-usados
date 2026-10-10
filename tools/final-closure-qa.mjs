/** Final regression against disposable local WordPress fixtures, never live stock. */
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(process.env.RP_PLAYWRIGHT_PACKAGE||'C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const base=process.env.RP_DEMO_URL||'http://127.0.0.1:9470',out=process.env.RP_QA_OUT||'tools/.preview/final-closure';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const report={base,browser:browser.version(),checks:[],profiles:[],limitations:['Touch and viewport emulation; physical Android/Safari browser chrome not reproduced.','Fixtures isolated from production inventory.']};
const check=(name,value)=>{assert(value,name);report.checks.push(name);};
const ready=p=>p.waitForFunction(()=>window.__RP_V2__?.state==='ready'&&document.querySelector('.hero-poster').hasAttribute('data-presented')&&!document.querySelector('video').seeking&&Math.abs(__RP_V2__.presentedTime-__RP_V2__.targetTime)<.013,null,{timeout:15000});
async function pose(p,v){await p.evaluate(v=>{const r=document.querySelector('.hero-track'),s=document.querySelector('.hero-stage');scrollTo({top:r.offsetTop-document.querySelector('header').offsetHeight+(r.offsetHeight-s.offsetHeight)*v,behavior:'instant'});},v);await p.waitForFunction(v=>Math.abs(__RP_V2__.progress-v)<.015,v);await ready(p);}
const overflow=p=>p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
try{
 const state=await (await fetch(base+'/qa-state.json')).json();
 check('registered CPT and isolated available/reserved/sold fixtures',state.cpt&&['disponible','reservado','vendido'].every(s=>state.records.some(r=>r.state===s)));
 const eligible=state.records.filter(r=>r.state==='disponible'||r.state==='reservado');
 check('fixture with optional values absent and gallery persisted',state.records.some(r=>!r.meta.rp_kilometraje)&&state.records.some(r=>r.gallery.length===4));
 for(const [width,height] of [[1920,1080],[1440,900],[1280,800],[1024,768],[900,900],[899,900],[768,1024],[430,932],[390,844],[375,812]]){
  const mobile=width<900,c=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1}),p=await c.newPage();
  const requests=[],errors=[],badResponses=[],failed=[];
  p.on('request',r=>requests.push(r.url()));p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  p.on('response',r=>{if(r.status()>=400)badResponses.push({url:r.url(),status:r.status()});});
  p.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
  await p.goto(base,{waitUntil:'domcontentloaded'});await ready(p);await p.evaluate(()=>document.fonts.ready);
  check(`${width}: current hero and poster align`,await p.locator('video').evaluate(v=>{const i=document.querySelector('.hero-poster'),a=v.getBoundingClientRect(),b=i.getBoundingClientRect();return a.width===b.width&&a.height===b.height&&a.top===b.top&&getComputedStyle(v).objectFit===getComputedStyle(i).objectFit;}));
  check(`${width}: correct video, poster and 48fps mapping`,requests.filter(u=>/\.mp4(?:\?|$)/.test(u)).length>0&&requests.filter(u=>/\.mp4(?:\?|$)|poster\.png/.test(u)).every(u=>u.includes(mobile?'hero-mobile-v4-1080':'hero-desktop-1080'))&&await p.locator('video').evaluate(v=>v.videoWidth===(innerWidth<900?1080:1920)));
  check(`${width}: real catalog and sold excluded`,await p.locator('.vehicle').count()===eligible.length&&await p.locator('.vehicle[data-state="reservado"]').count()===2&&await p.locator('.vehicle-link[href*="demo-vendido"]').count()===0);
  check(`${width}: no price/search/featured in Home catalog`,await p.locator('#catalogo .vehicle-price,#catalogo input[type="search"],#catalogo .featured').count()===0&&!(await p.locator('#catalogo').innerText()).includes('TST'));
  check(`${width}: semantic entire-card links and responsive covers`,await p.locator('.vehicle').evaluateAll(cards=>cards.every(card=>card.querySelectorAll('a').length===1&&card.firstElementChild.matches('a.vehicle-link')&&card.querySelectorAll('img').length===1&&card.querySelector('img').sizes&&card.querySelector('img').srcset&&card.querySelector('img').width>0)));
  await p.screenshot({path:`${out}/home-${width}.png`});
  for(const v of [.05,.3,.56,.98,.4,0])await pose(p,v);
  check(`${width}: forward/reverse complete scroll`,true);
  await p.screenshot({path:`${out}/hero-return-${width}.png`});
  if(mobile){
   const before=await p.evaluate(()=>({image:document.querySelector('.hero-video').getBoundingClientRect().top,cta:document.querySelector('[data-skip]').getBoundingClientRect().top,media:document.querySelector('.hero-visual').getBoundingClientRect().height}));
   for(const delta of [16,72]){
    await p.setViewportSize({width,height:height+delta});
    const after=await p.evaluate(()=>({image:document.querySelector('.hero-video').getBoundingClientRect().top,cta:document.querySelector('[data-skip]').getBoundingClientRect().top,media:document.querySelector('.hero-visual').getBoundingClientRect().height}));
    check(`${width}: viewport +${delta} preserves image and CTA`,Math.abs(before.image-after.image)<1&&Math.abs(before.cta-after.cta)<1&&before.media===after.media);
   }
   await p.setViewportSize({width,height});await ready(p);
   const menu=p.locator('.header-menu-toggle');await menu.click();check(`${width}: three-line menu opens`,await menu.getAttribute('aria-expanded')==='true'&&await p.locator('.header-hamburger').first().locator('span').count()===3);
   await p.screenshot({path:`${out}/menu-open-${width}.png`});
   await p.keyboard.press('Escape');check(`${width}: Escape closes and returns focus`,await menu.getAttribute('aria-expanded')==='false'&&await menu.evaluate(e=>e===document.activeElement));
   // Copy intentionally has pointer-events:none; hit the actual media surface.
   await menu.click();await p.locator('.hero-video').click({position:{x:20,y:300}});check(`${width}: outside click closes menu`,await menu.getAttribute('aria-expanded')==='false');
  }
  for(const id of ['catalog-title','nosotros','opciones']){
   if(mobile)await p.locator('.header-menu-toggle').click();
   await p.locator(mobile?'.header-navigation-mobile':'.header-navigation-desktop').locator(`a[href$="#${id}"]`).click();
   await p.waitForFunction(id=>{const top=document.getElementById(id).getBoundingClientRect().top,b=document.querySelector('header').getBoundingClientRect().bottom;return document.activeElement.id===id&&top>=b-1&&top<b+25;},id);
   check(`${width}: ${id} anchor clear of header`,true);
   if(mobile)check(`${width}: ${id} selection closes menu`,await p.locator('.header-menu-toggle').getAttribute('aria-expanded')==='false');
  }
  check(`${width}: approved typography and no numbered Home labels`,await p.evaluate(()=>getComputedStyle(document.body).fontFamily.includes('Manrope')&&getComputedStyle(document.querySelector('.vehicle-info dd')).fontFamily.includes('Archivo'))&&await p.locator('main section>.wrap>.label, .section .section-number').count()===0);
  check(`${width}: financing/permuta/consignment and real owner image`,await p.locator('#opciones .service').count()===3&&await p.locator('#nosotros img').getAttribute('src')?.then(src=>src.includes('local-institucional')));
  await p.locator('#ubicacion').scrollIntoViewIfNeeded();
  check(`${width}: confirmed map and directions`,await p.locator('#ubicacion iframe[src*="google.com/maps/embed"]').count()===1&&await p.locator('#ubicacion a[href*="/maps/dir/"]').count()===1);
  await p.locator('footer').scrollIntoViewIfNeeded();
  check(`${width}: confirmed WhatsApp throughout`,await p.locator('a[href^="https://wa.me/"]').evaluateAll(links=>links.length>=3&&links.every(a=>new URL(a.href).pathname==='/5491125348193')));
  check(`${width}: no horizontal overflow`,!await overflow(p));
  check(`${width}: archive never fetches other galleries or V1`,!requests.some(u=>/vento-rear|vento-front|\.glb|\.hdr|three[./-]|hero-webgl/.test(u)));
  const localBad=badResponses.filter(r=>r.url.startsWith(base)),localFailed=failed.filter(r=>r.url.startsWith(base)&&!r.error?.includes('ERR_ABORTED'));
  check(`${width}: no local HTTP/JS/console failures`,errors.length===0&&localBad.length===0&&localFailed.length===0);
  report.profiles.push({width,height,requests:requests.filter(u=>/\.mp4|poster\.png/.test(u)),preparedMs:await p.evaluate(()=>__RP_V2__.firstPresentedMs),externalResponses:badResponses.filter(r=>!r.url.startsWith(base)),externalFailures:failed.filter(r=>!r.url.startsWith(base))});
  await c.close();
 }
 for(const width of [1440,375,390,430]){
  const c=await browser.newContext({viewport:{width,height:900},isMobile:width<900,hasTouch:width<900,reducedMotion:'reduce'}),p=await c.newPage(),requests=[];
  await p.goto(base+'/vehiculos/');await p.locator('.vehicle-link[href*="demo-vento"]').click();await p.waitForURL('**/demo-vento/');
  check(`${width}: card navigates to actual individual page`,await p.locator('.unit-panel').isVisible());
  const detail=await c.newPage();detail.on('request',r=>requests.push(r.url()));await detail.goto(base+'/vehiculos/demo-vento/');
  check(`${width}: detail loads no hero or GSAP resources`,!requests.some(u=>/\.mp4|poster\.png|main-DotqqFXD/.test(u))&&await detail.evaluate(()=>!window.__RP_V2__));
  await detail.locator('.gallery-viewport').focus();await detail.keyboard.press('ArrowRight');await detail.waitForFunction(()=>document.querySelector('[data-position]').textContent.startsWith('02'));
  await detail.locator('[data-image="1"]').focus();await detail.keyboard.press('Enter');
  await detail.locator('.gallery-slide').nth(1).locator('.gallery-open').click();await detail.locator('[data-lightbox-next]').click();
  await detail.waitForFunction(()=>document.querySelector('[data-lightbox-position]').textContent.startsWith('03'));
  await detail.keyboard.press('ArrowLeft');await detail.waitForFunction(()=>document.querySelector('[data-lightbox-position]').textContent.startsWith('02'));
  await detail.keyboard.press('Escape');check(`${width}: gallery/lightbox keyboard and close`,await detail.locator('.gallery-lightbox').evaluate(d=>!d.open));
  await detail.goto(base+'/vehiculos/demo-vendido/');check(`${width}: sold detail accurately labels state`,(await detail.locator('.unit-heading .stock-state').innerText()).includes('Vendido'));
  await c.close();
 }
 for(const mode of ['reduced','no-js','failed-video']){
  const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,javaScriptEnabled:mode!=='no-js',reducedMotion:mode==='reduced'?'reduce':'no-preference'}),p=await c.newPage(),requests=[];
  p.on('request',r=>requests.push(r.url()));if(mode==='failed-video')await p.route('**/*.mp4',r=>r.abort());await p.goto(base);
  if(mode==='failed-video')await p.waitForFunction(()=>__RP_V2__?.state==='fallback');
  check(`${mode}: correct fallback poster`,await p.locator('.hero-poster').evaluate(e=>e.currentSrc.includes('mobile-v4-1080')&&!e.hasAttribute('data-presented')));
  if(mode!=='failed-video')check(`${mode}: no video downloaded`,!requests.some(u=>u.includes('.mp4')));
  if(mode==='no-js')await p.locator('.header-menu summary').click();else await p.locator('.header-menu-toggle').click();
  const destination=p.locator('.header-navigation-mobile a[href$="#opciones"]');
  if(mode==='no-js'){
   // Chromium with JS disabled can stall Playwright's RAF stability waiter,
   // although the CSS animation finishes. Verify hit testing and native input.
   const box=await destination.boundingBox(),point={x:box.x+box.width/2,y:box.y+box.height/2};
   check('no-js: native link receives pointer',await p.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('a')?.hash==='#opciones',point));
   await p.mouse.click(point.x,point.y);
  }else await destination.click();
  await p.waitForFunction(()=>document.querySelector('#opciones').getBoundingClientRect().top>=document.querySelector('header').getBoundingClientRect().bottom);
  check(`${mode}: native anchors and essential content`,await p.locator('#opciones .service').count()===3&&!await overflow(p));await c.close();
 }
 const c=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),p=await c.newPage();await p.goto(base);await p.keyboard.press('Tab');check('keyboard: skip is first target',await p.locator('.skip').evaluate(e=>document.activeElement===e));await p.keyboard.press('Enter');check('keyboard: skip focuses catalog',await p.evaluate(()=>document.activeElement.id==='catalogo'));
 await p.evaluate(()=>document.documentElement.style.zoom='2');check('200% zoom without overflow',!await overflow(p));await c.close();
 if(process.env.RP_EMPTY_URL){const c=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),p=await c.newPage();await p.goto(process.env.RP_EMPTY_URL);check('WordPress without stock: honest empty state',await p.locator('.stock-empty').count()===1&&await p.locator('.vehicle').count()===0);await c.close();}
}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify({passed:report.checks.length,profiles:report.profiles},null,2));
