import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const require=createRequire('C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const home=process.env.RP_PREVIEW_URL||'http://127.0.0.1:9461';
const out=process.env.RP_PREVIEW_QA_OUT||'artifacts/vercel-preview/local';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--autoplay-policy=document-user-activation-required']});
const report={url:home,browser:browser.version(),checks:[],profiles:[],platformInjections:[],limitations:['Chromium touch emulation; not physical Safari/iPhone.','No confirmed inventory or WhatsApp recipient; detail/send paths cannot be commercially validated.']};
const check=(name,value)=>{assert(value,name);report.checks.push({name,passed:true});};
async function ready(p){await p.waitForFunction(()=>__RP_V2__?.state==='ready'&&document.querySelector('.hero-poster').hasAttribute('data-presented')&&!document.querySelector('video').seeking&&Math.abs(__RP_V2__.targetTime-__RP_V2__.presentedTime)<.013,null,{timeout:30000});}
async function pose(p,value){await p.evaluate(v=>{const h=document.querySelector('.hero-track'),s=document.querySelector('.hero-stage');scrollTo({top:h.offsetTop-document.querySelector('header').offsetHeight+(h.offsetHeight-s.offsetHeight)*v,behavior:'instant'});},value);await p.waitForFunction(v=>Math.abs(__RP_V2__.progress-v)<.015,value);await ready(p);}
try{
 for(const [width,height,mobile] of [[1440,900,false],[1280,800,false],[375,812,true],[390,844,true],[430,932,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
  const p=await context.newPage(),requests=[],errors=[],failed=[];
  p.on('request',r=>requests.push(r.url()));p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(new URL(r.url()).origin===new URL(home).origin&&r.status()>=400)failed.push({url:r.url(),status:r.status()});});
  const response=await p.goto(home);await ready(p);await p.evaluate(()=>document.fonts.ready);
  const media=await p.locator('video').evaluate(v=>({src:v.currentSrc,width:v.videoWidth,height:v.videoHeight,duration:v.duration}));
  check(width+': video dimensions/duration',media.width===(mobile?720:1600)&&media.height===(mobile?1280:900)&&Math.abs(media.duration-3)<.1);
  check(width+': HTTP 200 and real empty catalog',response.status()===200&&await p.locator('.stock-empty').count()===1&&await p.locator('.vehicle-link').count()===0);
  check(width+': correct single MP4 resource',requests.some(u=>u.includes('.mp4'))&&requests.filter(u=>u.includes('.mp4')).every(u=>u.includes(mobile?'hero-mobile-portrait-crf18.mp4':'hero-fast-dark-doors.mp4')));
  check(width+': correct single poster resource',requests.filter(u=>u.includes('poster')&&u.includes('.png')).every(u=>u.includes(mobile?'portrait-crf18-poster':'poster-fast-dark-doors')));
  check(width+': font families',await p.evaluate(()=>getComputedStyle(document.body).fontFamily.includes('Manrope')&&getComputedStyle(document.querySelector('.label')).fontFamily.includes('Archivo')));
  await p.screenshot({path:out+'/hero-'+width+'.png'});
  for(const v of [.18,.78,.3,0])await pose(p,v);
  check(width+': forward/reverse/return',true);
  for(const position of [0,.56]){await pose(p,position);await p.reload();await ready(p);check(width+': reload p='+position,Math.abs(await p.evaluate(()=>__RP_V2__.progress)-position)<.02);}
  if(width===390){await p.setViewportSize({width:932,height:430});await ready(p);check('orientation retains vertical contain',await p.locator('video').evaluate(v=>v.videoWidth===720&&getComputedStyle(v).objectFit==='contain'));await p.setViewportSize({width,height});await ready(p);}
  await p.evaluate(()=>{const h=document.querySelector('.hero-track'),s=document.querySelector('.hero-stage');for(const v of [.9,.2,.7,.22])scrollTo({top:h.offsetTop-document.querySelector('header').offsetHeight+(h.offsetHeight-s.offsetHeight)*v,behavior:'instant'});});await p.waitForFunction(()=>Math.abs(__RP_V2__.progress-.22)<.015);await ready(p);
  check(width+': fast reversal latest pose',true);
  await pose(p,.998);check(width+': dark terminal pose',await p.locator('.hero-visual').evaluate(e=>Number(getComputedStyle(e).opacity)<.01));
  await p.locator('header nav a').click();check(width+': skip catalog focus',await p.evaluate(()=>document.activeElement.id==='catalogo'));
  check(width+': subtle curve',await p.locator('.catalog-cap').evaluate((e,m)=>Math.round(e.getBoundingClientRect().height)===(m?66:96),mobile));
  check(width+': no horizontal overflow',await p.evaluate(()=>document.documentElement.scrollWidth===document.documentElement.clientWidth));
  await p.locator('#ubicacion').scrollIntoViewIfNeeded();check(width+': map and directions',await p.locator('iframe[src*="google.com/maps/embed"]').count()===1&&await p.locator('a[href*="/maps/dir/"]').count()===1);
  await p.locator('header [data-contact-pending]').click();check(width+': honest pending contact',await p.locator('#contacto-pendiente').isVisible()&&!await p.locator('a[href^="https://wa.me/"]').count());
  check(width+': no V1/local resources or errors',!errors.length&&!failed.length&&!requests.some(u=>/\.glb|\.hdr|three[./-]|hero-webgl|127\.0\.0\.1:(?:9400|9430|9440)/.test(u)));
  report.profiles.push({width,media,firstPresentedMs:await p.evaluate(()=>__RP_V2__.firstPresentedMs),seekLatencies:await p.evaluate(()=>__RP_V2__.seekLatencies),errors,failed,mediaRequests:requests.filter(u=>/\.mp4|poster.*png/.test(u))});await context.close();
 }
 for(const mode of ['reduced','no-js','failed-video']){
  const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:mode==='reduced'?'reduce':'no-preference',javaScriptEnabled:mode!=='no-js'}),p=await c.newPage(),requests=[];
  p.on('request',r=>requests.push(r.url()));if(mode==='failed-video')await p.route('**/*.mp4',r=>r.abort());await p.goto(home);if(mode==='failed-video')await p.waitForFunction(()=>__RP_V2__?.state==='fallback');
  check(mode+': mobile poster',await p.locator('.hero-poster').evaluate(e=>e.currentSrc.includes('portrait')&&getComputedStyle(e).visibility==='visible'));
  if(mode!=='failed-video')check(mode+': no MP4',!requests.some(u=>u.includes('.mp4')));
  await p.locator('header nav a').click();check(mode+': accessible catalog',await p.locator('.stock-empty').isVisible());await c.close();
 }
 const c=await browser.newContext({viewport:{width:390,height:844}}),p=await c.newPage(),requests=[];p.on('request',r=>requests.push(r.url()));
 const response=await p.goto(home+'/vehiculos/');check('archive HTTP 200, no hero media',response.status()===200&&await p.locator('.stock-empty').count()===1&&!requests.some(u=>/\.mp4|poster.*png|main-BJ07zQ2b/.test(u)));
 await p.keyboard.press('Tab');check('keyboard skip first target',await p.locator('.skip').evaluate(e=>e===document.activeElement));await p.keyboard.press('Enter');check('keyboard skip main',await p.evaluate(()=>document.activeElement.id==='main-content'));await c.close();
 const manifest=JSON.parse(await readFile('artifacts/vercel-preview/export-report.json','utf8'));
 if(manifest.routes.includes('/demo/ficha/'))for(const width of [1440,390]){
  const c=await browser.newContext({viewport:{width,height:width>900?900:844},isMobile:width<900,hasTouch:width<900}),p=await c.newPage(),requests=[],errors=[];
  p.on('request',r=>requests.push(r.url()));p.on('pageerror',e=>errors.push(e.message));const r=await p.goto(home+'/demo/ficha/');await p.evaluate(()=>document.fonts.ready);
  check(width+': demo explicitly labelled',r.status()===200&&(await p.locator('#unit-title').innerText()).includes('DEMO VISUAL')&&(await p.locator('.prose').innerText()).includes('No representa stock real'));
  await p.locator('.gallery-slide img').first().evaluate(i=>i.decode());
  check(width+': three labelled test patterns, initial loaded',await p.locator('.gallery-slide img').count()===3&&await p.locator('.gallery-slide img').evaluateAll(imgs=>imgs.every(i=>i.alt.includes('DEMO'))&&imgs[0].complete&&imgs[0].naturalWidth>0));
  await p.locator('[data-next]').click();await p.waitForFunction(()=>document.querySelector('[data-position]').textContent.startsWith('2'));
  await p.locator('.gallery-viewport').focus();await p.keyboard.press('ArrowRight');await p.waitForFunction(()=>document.querySelector('[data-position]').textContent.startsWith('3'));
  await p.locator('[data-previous]').click();await p.waitForFunction(()=>document.querySelector('[data-position]').textContent.startsWith('2'));await p.waitForFunction(()=>[...document.querySelectorAll('.gallery-slide img')].every(i=>i.complete&&i.naturalWidth>0));check(width+': demo gallery controls and lazy images',true);
  check(width+': demo no invented price/contact',await p.locator('.vehicle-price').innerText()==='[dato pendiente — confirmar con el cliente]'&&!await p.locator('a[href^="https://wa.me/"]').count());
  check(width+': demo no hero downloads/errors/overflow',!errors.length&&!requests.some(u=>/\.mp4|poster.*png|main-BJ07zQ2b/.test(u))&&await p.evaluate(()=>document.documentElement.scrollWidth===document.documentElement.clientWidth));
  await p.locator('[data-image="0"]').click();await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:out+'/demo-ficha-'+width+'.png'});await c.close();
 }
 for(const [file,info] of Object.entries(manifest.files)){
  if(file==='vercel.json'||file==='.vercelignore')continue;
  const r=await fetch(home+'/'+file);let data=Buffer.from(await r.arrayBuffer());
  // Vercel adds its own review-toolbar script to preview HTML. Only normalize
  // that exact platform addition; every remaining byte and every asset must match.
  if(file.endsWith('.html')){
   const text=data.toString('utf8'),scripts=text.match(/<script\b[^>]*src="https:\/\/vercel\.live\/_next-live\/feedback\/feedback\.js"[^>]*><\/script>/g)||[];
   if(scripts.length){report.platformInjections.push({file,scripts});data=Buffer.from(text.replace(/<script\b[^>]*src="https:\/\/vercel\.live\/_next-live\/feedback\/feedback\.js"[^>]*><\/script>/g,''));}
  }
  check('byte integrity '+file,r.status===200&&createHash('sha256').update(data).digest('hex')===info.sha256);
 }
 for(const video of ['hero-fast-dark-doors.mp4','hero-mobile-portrait-crf18.mp4']){
  const r=await fetch(home+'/wp-content/themes/rp-usados/assets/hero/v2/'+video,{headers:{Range:'bytes=0-1023'}});check('MP4 byte ranges '+video,r.status===206&&r.headers.get('content-range')?.startsWith('bytes 0-1023/')&&(await r.arrayBuffer()).byteLength===1024);
 }
}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify({url:home,checks:report.checks.length,profiles:report.profiles.length}));
