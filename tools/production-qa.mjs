import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(process.env.RP_PLAYWRIGHT_PACKAGE || 'C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const HOME='http://127.0.0.1:9400',QA='http://127.0.0.1:9430';
const OUT='artifacts/production';await mkdir(OUT,{recursive:true});
const report={browser:browser.version(),checks:[],profiles:[],limitations:['Stock fixtures run only on 9430; 9400 has no fabricated inventory.','Touch/viewport emulation, not a physical iPhone or Safari.']};
function check(name,value){assert(value,name);report.checks.push({name,passed:true});}
const shot=(p,name,fullPage=false)=>p.screenshot({path:OUT+'/'+name+'.png',fullPage});
const overflow=p=>p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
async function pose(p,v){
 await p.evaluate(v=>{const r=document.querySelector('.hero-track'),s=document.querySelector('.hero-stage');scrollTo(0,r.offsetTop-document.querySelector('header').offsetHeight+(r.offsetHeight-s.offsetHeight)*v);},v);
 await p.waitForFunction(v=>Math.abs(__RP_V2__.progress-v)<.004&&!document.querySelector('video').seeking&&Math.abs(__RP_V2__.presentedTime-__RP_V2__.targetTime)<.013,v);
}
try{
 for(const [name,width,height] of [['wide',1920,1080],['desktop',1440,900],['laptop',1280,800],['tablet',768,1024],['mobile-430',430,932],['mobile-390',390,844],['mobile-375',375,812]]){
  const mobile=width<900,c=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1}),p=await c.newPage();
  const requests=[],errors=[];p.on('request',r=>requests.push(r.url()));p.on('pageerror',e=>errors.push(e.message));
  const res=await p.goto(HOME);await p.waitForFunction(()=>window.__RP_V2__?.state==='ready');await p.evaluate(()=>document.fonts.ready);
  check(name+': WordPress home and approved hero ready',res.status()===200&&await p.locator('.stock-empty').count()===1);
  check(name+': one correct video',requests.filter(u=>u.includes('.mp4')).length>0&&requests.filter(u=>u.includes('.mp4')).every(u=>u.includes(mobile?'hero-mobile-portrait-crf18':'hero-fast-dark-doors')));
  check(name+': correct poster only',requests.filter(u=>u.includes('poster')&&u.includes('.png')).every(u=>u.includes(mobile?'portrait-crf18-poster':'poster-fast-dark-doors')));
  check(name+': Manrope/Archivo',await p.evaluate(()=>getComputedStyle(document.body).fontFamily.includes('Manrope')&&getComputedStyle(document.querySelector('.label')).fontFamily.includes('Archivo')));
  check(name+': native custom-logo support/fallback does not use silhouette as logo',await p.locator('.brand-name,.custom-logo-link').count()===1);
  await shot(p,'home-'+name+'-initial');
  for(const v of [.1,.12,.3,.56,.98,.4,0])await pose(p,v);
  check(name+': forward reverse slow and return top',true);
  await pose(p,.56);await p.reload();await p.waitForFunction(()=>window.__RP_V2__?.state==='ready'&&Math.abs(__RP_V2__.progress-.56)<.02);
  check(name+': refresh midpoint restored',true);
  if(name==='mobile-390'){
   await p.setViewportSize({width:932,height:430});await p.waitForFunction(()=>__RP_V2__.device==='mobile'&&Math.abs(__RP_V2__.progress-.56)<.025);
   check('orientation: vertical stays selected',await p.locator('video').evaluate(v=>v.currentSrc.includes('portrait')&&getComputedStyle(v).objectFit==='contain'));
   await shot(p,'home-mobile-landscape');await p.setViewportSize({width,height});await pose(p,.56);
  }
  await p.evaluate(()=>{const d=document.querySelector('.hero-track').offsetHeight-document.querySelector('.hero-stage').offsetHeight;scrollTo(0,d*.98);requestAnimationFrame(()=>scrollTo(0,d*.17));});
  await p.waitForFunction(()=>Math.abs(__RP_V2__.progress-.17)<.005&&Math.abs(__RP_V2__.presentedTime-__RP_V2__.targetTime)<.013);
  check(name+': abrupt reversal latest frame',true);
  await pose(p,.98);await shot(p,'home-'+name+'-black');
  await p.locator('header nav a').click();check(name+': skip focuses catalog',await p.evaluate(()=>document.activeElement.id==='catalogo'));
  check(name+': subtle curve',await p.locator('.catalog-cap').evaluate((e,m)=>e.getBoundingClientRect().height===(m?66:96),mobile));
  await shot(p,'home-'+name+'-catalog');
  check(name+': institutional order',await p.locator('main>section').evaluateAll(a=>a.map(x=>x.id||'hero').join(',')==='hero,catalogo,nosotros,opciones,ubicacion,contacto'));
  await p.locator('#ubicacion').scrollIntoViewIfNeeded();
  check(name+': map embed and directions',await p.locator('#ubicacion iframe[src*="google.com/maps/embed"]').count()===1&&await p.locator('#ubicacion a[href*="/maps/dir/"]').count()===1);
  if(name==='desktop'||name==='mobile-390')await shot(p,'map-'+name);
  await p.locator('#contacto').scrollIntoViewIfNeeded();check(name+': no overflow',!await overflow(p));
  check(name+': no errors or V1 resources',!errors.length&&!requests.some(u=>/\.glb|\.hdr|three[./-]|hero-webgl/.test(u)));
  report.profiles.push({name,preparedMs:await p.evaluate(()=>__RP_V2__.firstPresentedMs),requests:requests.filter(u=>/\.mp4|poster.*png/.test(u)),errors});
  await c.close();
 }
 for(const mode of ['reduced','no-js','failed-video']){
  const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,javaScriptEnabled:mode!=='no-js',reducedMotion:mode==='reduced'?'reduce':'no-preference'}),p=await c.newPage(),requests=[];
  p.on('request',r=>requests.push(r.url()));if(mode==='failed-video')await p.route('**/*.mp4',r=>r.abort());await p.goto(HOME);
  if(mode==='failed-video')await p.waitForFunction(()=>__RP_V2__?.state==='fallback');
  check(mode+': mobile poster visible',await p.locator('.hero-poster').evaluate(e=>e.currentSrc.includes('portrait')&&getComputedStyle(e).visibility==='visible'));
  if(mode!=='failed-video')check(mode+': no video requested',!requests.some(u=>u.includes('.mp4')));
  await p.locator('header nav a').click();check(mode+': catalog reachable',await p.locator('.stock-empty').isVisible());
  check(mode+': no overflow',!await overflow(p));await shot(p,'fallback-'+mode);await c.close();
 }
 // Real WordPress routes populated only in the separate, labelled QA instance.
 for(const width of [1440,768,430,390,375]){
  const c=await browser.newContext({viewport:{width,height:width>900?900:844},reducedMotion:'reduce'}),p=await c.newPage();
  const requests=[],errors=[];p.on('request',r=>requests.push(r.url()));p.on('pageerror',e=>errors.push(e.message));
  await p.goto(QA);await p.locator('header nav a').click();
  check(width+': all 15 eligible records, no 12-item limit',await p.locator('.vehicle').count()===15);
  check(width+': reserved present and sold absent',await p.locator('.vehicle[data-state=reservado]').count()===1&&await p.locator('.vehicle[data-state=vendido]').count()===0&&!await p.locator('.vehicle-link[href*=qa-excluir]').count());
  check(width+': no catalog price/filter/search/featured',await p.locator('.vehicle-price,input[type=search],.filters,.featured').count()===0&&!(await p.locator('#catalogo').innerText()).includes('TST'));
  check(width+': entire card is one link',await p.locator('.vehicle').evaluateAll(cards=>cards.every(c=>c.children.length===1&&c.firstElementChild.matches('a.vehicle-link')&&c.querySelectorAll('a').length===1)));
  if(width===1440||width===390){await p.locator('.vehicle-link[href*=qa-reservado]').scrollIntoViewIfNeeded();await shot(p,'stock-qa-'+width);}
  await p.goto(QA+'/vehiculos/');check(width+': archive all eligible without prices',await p.locator('.vehicle').count()===15&&!(await p.locator('main').innerText()).includes('TST'));
  await p.locator('.vehicle-link[href*=qa-disponible]').click();await p.waitForURL('**/qa-disponible/');await p.evaluate(()=>document.fonts.ready);
  check(width+': individual price', (await p.locator('.vehicle-price').innerText()).includes('TST')&&(await p.locator('.vehicle-price').innerText()).includes('12'));
  check(width+': three gallery photos with full framing',await p.locator('.gallery-slide img').count()===3&&await p.locator('.gallery-slide img').first().evaluate(e=>getComputedStyle(e).objectFit==='contain'&&e.complete&&e.naturalWidth>0));
  const wa=await p.locator('.unit-enquiry a[href^="https://wa.me/"]').getAttribute('href');const message=new URL(wa).searchParams.get('text');
  check(width+': unit WhatsApp includes title and canonical URL',message.includes('QA LOCAL')&&message.includes('/vehiculos/qa-disponible/')&&new URL(wa).pathname==='/99999999');
  await p.locator('[data-next]').click();await p.waitForFunction(()=>document.querySelector('[data-position]').textContent.startsWith('2'));
  await p.locator('.gallery-viewport').focus();await p.keyboard.press('ArrowRight');await p.waitForFunction(()=>document.querySelector('[data-position]').textContent.startsWith('3'));
  await p.locator('[data-previous]').click();await p.waitForFunction(()=>document.querySelector('[data-position]').textContent.startsWith('2'));
  check(width+': gallery pointer and keyboard',true);
  await p.locator('[data-image="0"]').click();await p.evaluate(()=>scrollTo(0,0));
  await shot(p,'vehicle-qa-'+width);
  await p.locator('#unit-info').scrollIntoViewIfNeeded();if(width===1440||width===390)await shot(p,'vehicle-info-qa-'+width);
  check(width+': detail no overflow/errors',!await overflow(p)&&!errors.length);
  // New context: single page must not bootstrap hero or fetch hero video/poster/GSAP.
  const single=await c.newPage(),sr=[];single.on('request',r=>sr.push(r.url()));await single.goto(QA+'/vehiculos/qa-reservado/');
  check(width+': single no hero/V1 downloads',!sr.some(u=>/\.mp4|poster.*png|\.glb|\.hdr|three[./-]/.test(u))&&await single.evaluate(()=>!window.__RP_V2__));
  check(width+': reserved single state',await single.locator('.unit-title>.stock-state').innerText()==='Reservado');
  await single.goto(QA+'/vehiculos/qa-sin-datos/');check(width+': absent facts not fabricated',await single.locator('.full-specs>div').count()===0&&(await single.locator('.vehicle-price').innerText()).includes('[dato pendiente'));
  await c.close();
 }
 const c=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),p=await c.newPage();await p.goto(HOME);
 await p.keyboard.press('Tab');check('skip first keyboard target',await p.locator('.skip').evaluate(e=>e===document.activeElement));await p.keyboard.press('Enter');check('skip keyboard focuses stock',await p.evaluate(()=>document.activeElement.id==='catalogo'));
 await p.evaluate(()=>document.documentElement.style.zoom='2');check('200 percent zoom no overflow',!await overflow(p));await shot(p,'zoom-200');
 await p.locator('header [data-contact-pending]').click();check('pending WhatsApp honest and reachable',await p.locator('#contacto-pendiente').isVisible());await c.close();
 const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),n=await nojs.newPage();await n.goto(QA+'/vehiculos/qa-disponible/');
 check('single without JS has gallery, price and WhatsApp',await n.locator('.gallery-slide').count()===3&&await n.locator('.vehicle-price').count()===1&&await n.locator('.unit-enquiry a[href^="https://wa.me/"]').count()===1);await nojs.close();
 // Full-page evidence uses static reduced-motion mode, preserving the approved poster.
 for(const width of [1440,390]){const c=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),p=await c.newPage();await p.goto(HOME);await p.locator('#ubicacion').scrollIntoViewIfNeeded();await p.evaluate(()=>scrollTo(0,0));await shot(p,'home-full-'+width,true);await c.close();}
}finally{await writeFile(OUT+'/report.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify({checks:report.checks.length,passed:report.checks.every(c=>c.passed),profiles:report.profiles},null,2));
