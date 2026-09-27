import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const require=createRequire('C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright'),b=await chromium.launch({channel:'msedge',headless:true});
const ROOT='http://127.0.0.1:9440',OUT='artifacts/vehicle-flow';
const {vehicles}=JSON.parse(await readFile(OUT+'/admin-report.json','utf8'));
const report={browser:b.version(),checks:[],limits:['Mobile emulated in Chromium/Edge, not physical Safari/iPhone.','QA graphics verify aspect ratios and loading, not real automotive photography.','WhatsApp URL inspected only; no message sent.']};
function check(name,ok){assert(ok,name);report.checks.push(name);}
const hash=x=>createHash('sha256').update(x).digest('hex');
const overflow=p=>p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
const images=p=>p.locator('.vehicle-photo,.gallery-slide img').evaluateAll(imgs=>Promise.all(imgs.map(i=>{i.loading='eager';return i.decode();})));
try{
 for(const width of [1440,1280,768,430,390,375]){
  const c=await b.newContext({viewport:{width,height:width>900?1000:844},reducedMotion:'reduce',isMobile:width<900,hasTouch:width<900}),p=await c.newPage();
  const requests=[],errors=[];p.on('request',r=>requests.push(r.url()));p.on('pageerror',e=>errors.push(e.message));
  await p.goto(ROOT);await p.evaluate(()=>document.fonts.ready);await images(p);
  check(width+': four eligible cards only',await p.locator('.vehicle').count()===4);
  check(width+': one reserved and three available',await p.locator('.vehicle[data-state="reservado"]').count()===1&&await p.locator('.vehicle[data-state="disponible"]').count()===3);
  check(width+': sold excluded',!await p.locator('.vehicle-link[href="'+vehicles.find(v=>v.state==='vendido').url+'"]').count());
  check(width+': no catalog price',!(await p.locator('#catalogo').innerText()).includes('TST'));
  check(width+': full card is one link',await p.locator('.vehicle').evaluateAll(a=>a.every(e=>e.children.length===1&&e.firstElementChild.tagName==='A')));
  check(width+': no empty fact rows',await p.locator('.vehicle-info dd').evaluateAll(a=>a.every(e=>e.textContent.trim().length)));
  check(width+': card crops without stretching',await p.locator('.vehicle-photo').evaluateAll(a=>a.every(e=>e.naturalWidth>0&&getComputedStyle(e).objectFit==='cover')));
  await p.locator('#catalogo').evaluate(e=>scrollTo(0,e.offsetTop-90));
  if([375,430].includes(width))await p.screenshot({path:OUT+'/catalog-'+width+'.png'});
  check(width+': no home overflow',!await overflow(p));
  for(const v of vehicles){
   await p.goto(v.url);await images(p);
   check(width+' '+v.name+': state shown', (await p.locator('.unit-title .stock-state').innerText()).toLowerCase()===v.state);
   check(width+' '+v.name+': no overflow',!await overflow(p));
   if(v.name==='Opcionales vacíos'){
    check(width+': missing price explicit, no invented data',(await p.locator('.vehicle-price').innerText()).includes('[dato pendiente — confirmar con el cliente]')&&await p.locator('.full-specs dd').count()===0);
    check(width+': missing WhatsApp has fallback',await p.locator('.unit-enquiry .action').getAttribute('href')==='#contacto-pendiente');
   }else{
    check(width+' '+v.name+': price only detail',(await p.locator('.vehicle-price').innerText()).includes('TST'));
    const wa=new URL(await p.locator('.unit-enquiry .action').getAttribute('href'));
    check(width+' '+v.name+': WA includes title and canonical URL',wa.hostname==='wa.me'&&wa.searchParams.get('text').includes(await p.locator('h1').innerText())&&wa.searchParams.get('text').includes(v.url));
   }
   if(v.name==='Reservado')check(width+': zero km is not omitted',(await p.locator('.unit-strip').innerText()).includes('0 km'));
   if(v.name==='Galería'){
    check(width+': four distinct photos',await p.locator('.gallery-slide').count()===4);
    check(width+': full ratio photos without distortion',await p.locator('.gallery-slide img').evaluateAll(a=>a.every(e=>getComputedStyle(e).objectFit==='contain'&&e.naturalWidth>0)));
    for(const n of [2,3,4]){await p.locator('[data-next]').click();await p.waitForFunction(n=>document.querySelector('[data-position]').textContent.startsWith(n+' /'),n);}
    check(width+': end button disabled',await p.locator('[data-next]').isDisabled());
    await p.locator('.gallery-viewport').focus();await p.keyboard.press('ArrowLeft');await p.waitForFunction(()=>document.querySelector('[data-position]').textContent.startsWith('3 /'));
    await p.locator('[data-image="0"]').click();await p.waitForFunction(()=>document.querySelector('[data-position]').textContent.startsWith('1 /'));
    check(width+': gallery forward/reverse/key/direct navigation',await p.locator('[data-previous]').isDisabled());
   }
  }
  check(width+': no JS errors or V1 resources',!errors.length&&!requests.some(u=>/\.glb|\.hdr|three[./-]|hero-webgl/.test(u)));
  await c.close();
 }
 // Verify interaction, focus and state motion, without activating any outgoing CTA.
 const c=await b.newContext({viewport:{width:1440,height:1000}}),p=await c.newPage();await p.goto(ROOT+'/#opciones');
 const button=p.locator('#opciones .action');await button.hover();
 await p.waitForFunction(()=>getComputedStyle(document.querySelector('#opciones .action'),'::before').transform==='matrix(1, 0, 0, 1, 0, 0)');
 check('CTA: lateral fill completes within 240ms declared',await button.evaluate(e=>getComputedStyle(e,'::before').transitionDuration==='0.24s'));
 await p.screenshot({path:OUT+'/button-hover.png'});
 await p.mouse.move(0,0);await p.keyboard.press('Tab');await button.focus();
 check('keyboard focus remains visible',await button.evaluate(e=>e.matches(':focus-visible')&&getComputedStyle(e).outlineStyle==='solid'));
 await p.screenshot({path:OUT+'/button-focus.png'});
 await p.emulateMedia({reducedMotion:'reduce'});await button.hover();
 check('reduced motion: instant fill, no label movement',await button.evaluate(e=>getComputedStyle(e,'::before').transitionDuration==='0s'&&getComputedStyle(e.querySelector('span:not(.arrow)')).transform==='none'));
 await c.close();
 const touch=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),t=await touch.newPage();await t.goto(ROOT+'/#opciones');
 await t.locator('#opciones .action').tap();check('touch CTA works with missing global number',t.url().endsWith('#contacto-pendiente')&&await t.locator('#contacto-pendiente').isVisible());await touch.close();
 // No-JS stock/gallery stays useful.
 const nojs=await b.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),n=await nojs.newPage();await n.goto(vehicles.find(v=>v.name==='Galería').url);
 check('no JS: all photos and anchors exist',await n.locator('.gallery-slide').count()===4&&await n.locator('.gallery-choices a').count()===4);await nojs.close();
 for(const width of [1440,390]){
  const c=await b.newContext({viewport:{width,height:900},reducedMotion:'reduce',isMobile:width<900,hasTouch:width<900}),p=await c.newPage();
  await p.route('**/assets/app-*.css',async route=>{const r=await route.fetch(),css=await r.text(),cut=css.indexOf(':root{--rp-red:');assert(cut>0);await route.fulfill({response:r,body:css.slice(0,cut)});});
  await p.goto('http://127.0.0.1:9400/');await p.evaluate(()=>document.fonts.ready);await p.locator('.hero-poster').evaluate(i=>i.decode());const before=await p.screenshot();
  await p.unroute('**/assets/app-*.css');await p.reload();await p.evaluate(()=>document.fonts.ready);await p.locator('.hero-poster').evaluate(i=>i.decode());const after=await p.screenshot({path:OUT+'/protected-hero-'+width+'.png'});
  check(width+': header and static hero pixel-identical before/after style pass',hash(before)===hash(after));await c.close();
 }
 const hashes=JSON.parse(await readFile(OUT+'/protected-hashes.json','utf8'));
 for(const [f,expected] of Object.entries(hashes))check('unchanged: '+f,hash(await readFile('theme/rp-usados/'+f))===expected);
 const rgb=hex=>hex.match(/\w\w/g).map(s=>parseInt(s,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);
 const lum=hex=>rgb(hex).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);
 report.contrast=(lum('f5f4ef')+.05)/(lum('b51f2b')+.05);check('primary white/red contrast >= 4.5',report.contrast>=4.5);
}finally{await writeFile(OUT+'/public-report.json',JSON.stringify(report,null,2));await b.close();console.log(report.checks.length+' passing checks');}
