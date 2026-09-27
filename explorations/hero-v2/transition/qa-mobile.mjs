import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire('C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium,webkit}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const URL='http://127.0.0.1:9420/hero-v2/transition/';
const OUT=new globalThis.URL('../qa/mobile-integration/',import.meta.url);await mkdir(OUT,{recursive:true});
const report={browser:await browser.version(),checks:[],profiles:[],limitations:['Chromium touch/viewport emulation is not a physical mobile device or Safari. Localhost timings do not represent mobile network delivery.']};
const check=(name,value)=>{assert(value,name);report.checks.push({name,passed:true});};
const percentile=(a,f)=>[...a].sort((x,y)=>x-y)[Math.floor(a.length*f)]??null;
const shot=(p,name)=>p.screenshot({path:fileURLToPath(new globalThis.URL(name+'.png',OUT))});
async function pose(p,v){
 await p.evaluate(v=>{const r=document.querySelector('.hero-track'),s=document.querySelector('.hero-stage');scrollTo(0,r.offsetTop-document.querySelector('header').offsetHeight+(r.offsetHeight-s.offsetHeight)*v);},v);
 await p.waitForFunction(v=>Math.abs(__RP_V2__.progress-v)<.003&&!document.querySelector('video').seeking&&Math.abs(__RP_V2__.presentedTime-__RP_V2__.targetTime)<.013,v);
}
async function motion(p,reverse,duration=3000){
 await pose(p,reverse?.98:0);
 const raw=await p.evaluate(async({reverse,duration})=>{
   const d=__RP_V2__,n=d.presentations.length,k=d.seekLatencies.length;let first,last;const intervals=[],lag=[];
   const distance=document.querySelector('.hero-track').offsetHeight-document.querySelector('.hero-stage').offsetHeight;
   await new Promise(done=>{function tick(t){first??=t;if(last)intervals.push(t-last);last=t;
    const x=Math.min(1,(t-first)/duration);scrollTo(0,distance*.98*(reverse?1-x:x));lag.push(Math.abs((d.presentedTime??0)-d.targetTime));
    if(x<1)requestAnimationFrame(tick);else done();}requestAnimationFrame(tick);});
   return {ms:last-first,intervals,lag,presentations:d.presentations.slice(n),seeks:d.seekLatencies.slice(k)};
 },{reverse,duration});
 await pose(p,reverse?0:.98);
 return {durationMs:raw.ms,rafFPS:raw.intervals.length*1000/raw.ms,presentedFPS:raw.presentations.length*1000/raw.ms,seekP50:percentile(raw.seeks,.5),seekP95:percentile(raw.seeks,.95),lagP95Seconds:percentile(raw.lag,.95)};
}
try{
 for(const width of [1440,375,390,430]){
  const mobile=width<900,ctx=await browser.newContext({viewport:{width,height:mobile?844:900},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
  const p=await ctx.newPage(),requests=[],errors=[];p.on('request',r=>requests.push(r.url()));p.on('pageerror',e=>errors.push(e.message));
  const cdp=await ctx.newCDPSession(p);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await p.goto(URL);await p.waitForFunction(()=>__RP_V2__?.state==='ready');
  const profile={width,device:mobile?'mobile':'desktop',cold:await p.evaluate(()=>({preparedMs:__RP_V2__.firstPresentedMs,loadedMs:__RP_V2__.loadedDataMs,navigationToReadyMs:performance.now(),heap:performance.memory?.usedJSHeapSize,source:document.querySelector('video').currentSrc,poster:document.querySelector('.hero-poster').currentSrc}))};
  check(`${width}: correct video`,profile.cold.source.includes(mobile?'hero-mobile-portrait-crf18.mp4':'hero-fast-dark-doors.mp4'));
  check(`${width}: only selected MP4`,requests.filter(u=>u.includes('.mp4')).every(u=>u.includes(mobile?'hero-mobile-portrait':'hero-fast-dark-doors')));
  check(`${width}: only selected poster`,requests.filter(u=>u.includes('.png')&&/poster/.test(u)).every(u=>u.includes(mobile?'portrait-crf18-poster':'poster-fast-dark-doors')));
  check(`${width}: 3 seconds and paused`,await p.locator('video').evaluate(v=>v.duration===3&&v.paused&&!v.autoplay));
  profile.posterDifference=await p.evaluate(async()=>{const v=document.querySelector('video'),im=document.querySelector('.hero-poster');await im.decode();const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(v,0,0);const a=x.getImageData(0,0,c.width,c.height).data;x.drawImage(im,0,0,c.width,c.height);const b=x.getImageData(0,0,c.width,c.height).data;let sum=0,n=0;for(let i=0;i<a.length;i+=64)for(let k=0;k<3;k++){sum+=Math.abs(a[i+k]-b[i+k]);n++;}return sum/n;});
  check(`${width}: matching poster color`,profile.posterDifference<3);await shot(p,`${width}-initial`);
  if(width===390||width===1440){profile.forward=await motion(p,false);profile.reverse=await motion(p,true);profile.fastForward=await motion(p,false,500);profile.fastReverse=await motion(p,true,500);}
  // Small increments exercise slow manual inspection, not just continuous scrubbing.
  for(const v of [.10,.12,.14,.16,.30,.56,.85,.98,.60,.30,0])await pose(p,v);
  check(`${width}: slow, forward, reverse, return top`,true);
  await pose(p,.56);await shot(p,`${width}-middle`);
  await cdp.send('Network.setCacheDisabled',{cacheDisabled:false});await p.reload();await p.waitForFunction(()=>__RP_V2__?.state==='ready'&&Math.abs(__RP_V2__.progress-.56)<.015);await pose(p,.56);
  await p.reload();await p.waitForFunction(()=>__RP_V2__?.state==='ready'&&Math.abs(__RP_V2__.progress-.56)<.015);
  profile.warm=await p.evaluate(()=>({preparedMs:__RP_V2__.firstPresentedMs,progress:__RP_V2__.progress}));check(`${width}: reload restores midpoint`,true);
  if(mobile){
   await p.setViewportSize({width:932,height:430});await p.waitForFunction(()=>__RP_V2__?.device==='mobile'&&Math.abs(__RP_V2__.progress-.56)<.025);await pose(p,.56);
   check(`${width}: orientation stays mobile asset`,requests.filter(u=>u.includes('.mp4')).every(u=>u.includes('hero-mobile-portrait')));
   check(`${width}: landscape full frame retained`,await p.locator('video').evaluate(v=>getComputedStyle(v).objectFit==='contain'));
   await shot(p,`${width}-landscape`);await p.setViewportSize({width,height:844});await pose(p,.56);
  }
  await pose(p,.98);await shot(p,`${width}-end`);
  if(mobile){
    check(`${width}: black web bridge matches video`,await p.evaluate(()=>getComputedStyle(document.querySelector('.hero-stage')).backgroundColor==='rgb(0, 0, 0)'&&getComputedStyle(document.querySelector('.transition-bridge')).backgroundColor==='rgb(0, 0, 0)'));
    check(`${width}: subtle curve`,await p.locator('.catalog-cap').evaluate(e=>e.getBoundingClientRect().height===66));
  }
  await p.getByRole('navigation',{name:'Navegación principal'}).getByRole('link',{name:'Ver vehículos'}).click();
  check(`${width}: catalog focused`,await p.evaluate(()=>document.activeElement.id==='catalogo'));
  await shot(p,`${width}-catalog`);
  check(`${width}: no V1 resources`,!requests.some(u=>/\.glb|\.hdr|three[./-]|hero-webgl/.test(u)));
  check(`${width}: no overflow/errors`,!errors.length&&await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  report.profiles.push(profile);await ctx.close();
 }
 for(const mode of ['reduced','blocked','no-js']){
   const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:mode==='reduced'?'reduce':'no-preference',javaScriptEnabled:mode!=='no-js'}),p=await ctx.newPage(),requests=[];p.on('request',r=>requests.push(r.url()));
   if(mode==='blocked')await p.route('**/*.mp4',r=>r.abort());await p.goto(URL);
   if(mode==='blocked')await p.waitForFunction(()=>__RP_V2__?.state==='fallback');
   check(`${mode}: dedicated mobile poster`,await p.locator('.hero-poster').evaluate(x=>x.currentSrc.includes('portrait-crf18-poster')&&getComputedStyle(x).visibility==='visible'));
   if(mode!=='blocked')check(`${mode}: no video download`,!requests.some(u=>u.includes('.mp4')));
   await shot(p,mode);await p.getByRole('navigation',{name:'Navegación principal'}).getByRole('link',{name:'Ver vehículos'}).click();
   check(`${mode}: catalog accessible`,await p.locator('.section-heading').isVisible());await ctx.close();
 }
 // Encoding comparison uses the exact same page and controller, swapping only the mobile URL before parsing.
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await ctx.newPage();
 await p.route('**/hero-v2/transition/',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('portrait-crf18','portrait-crf20')});});
 await p.goto(URL);await p.waitForFunction(()=>__RP_V2__?.state==='ready');
 report.comparisonCRF20={forward:await motion(p,false),reverse:await motion(p,true)};await pose(p,.56);await shot(p,'crf20-middle');await ctx.close();
 try{const w=await webkit.launch({headless:true});await w.close();report.webkit='runtime available, physical iPhone still not tested';}catch{report.webkit='WebKit runtime unavailable; Safari not tested';}
}finally{await writeFile(new globalThis.URL('report.json',OUT),JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report,null,2));
