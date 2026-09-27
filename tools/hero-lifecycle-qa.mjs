import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire('C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright'),b=await chromium.launch({channel:'msedge',headless:true,ignoreDefaultArgs:['--disable-back-forward-cache']});
const HOME='http://127.0.0.1:9400/',report={checks:[],restores:[],limits:['Visibility states are injected: headless tabs all report visible.','Physical Safari/iPhone unavailable; Chromium mobile emulation.']};
const check=(name,ok)=>{assert(ok,name);report.checks.push(name);};
const ready=p=>p.waitForFunction(()=>window.__RP_V2__?.state==='ready'&&document.querySelector('.hero-poster').hasAttribute('data-presented')&&!document.querySelector('video').seeking&&Math.abs(__RP_V2__.presentedTime-__RP_V2__.targetTime)<.013,null,{timeout:10000});
const pose=async(p,v)=>{await p.evaluate(v=>{const h=document.querySelector('.hero-track'),s=document.querySelector('.hero-stage');scrollTo({top:h.offsetTop-document.querySelector('header').offsetHeight+(h.offsetHeight-s.offsetHeight)*v,behavior:'instant'});},v);await p.waitForFunction(v=>Math.abs(__RP_V2__.progress-v)<.015,v);};
try{
 for(const width of [375,390,430]){
  const c=await b.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),p=await c.newPage(),requests=[];p.on('request',r=>requests.push(r.url()));
  await p.goto(HOME);await p.waitForFunction(()=>window.__RP_V2__);await p.reload();await p.waitForFunction(()=>window.__RP_V2__);
  check(width+': reduced motion stays static, no MP4',!requests.some(u=>u.includes('.mp4'))&&await p.locator('video').evaluate(v=>!v.currentSrc));
  check(width+': correct mobile poster',await p.locator('.hero-poster').evaluate(e=>e.currentSrc.includes('portrait')&&!e.hasAttribute('data-presented')));
  await p.locator('header nav a').click();check(width+': reduced motion catalog reachable',await p.locator('#catalogo').evaluate(e=>document.activeElement===e));await c.close();
 }
 for(const hiddenInitially of [true,false]){
  const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await c.newPage();
  await p.addInitScript(initial=>{
   let hidden=initial;Object.defineProperty(document,'hidden',{get:()=>hidden});Object.defineProperty(document,'visibilityState',{get:()=>hidden?'hidden':'visible'});
   window.__qaVisibility=value=>{hidden=!value;document.dispatchEvent(new Event('visibilitychange'));};
  },hiddenInitially);
  await p.goto(HOME);await p.waitForFunction(()=>window.__RP_V2__);
  if(hiddenInitially){check('background initialization has no source yet',await p.locator('video').evaluate(v=>!v.currentSrc));await p.evaluate(()=>__qaVisibility(true));}
  await ready(p);check('visible initialization '+hiddenInitially,true);
  await p.evaluate(()=>__qaVisibility(false));const before=await p.evaluate(()=>__RP_V2__.seeks);await pose(p,.56);
  check('hidden scroll does not issue seek '+hiddenInitially,await p.evaluate(()=>__RP_V2__.seeks)===before);
  await p.evaluate(()=>__qaVisibility(true));await ready(p);check('visible resumes latest desired frame '+hiddenInitially,true);await c.close();
 }
 const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await c.newPage();
 await p.addInitScript(()=>{window.__pages=[];addEventListener('pageshow',e=>__pages.push({persisted:e.persisted}));});
 await p.goto(HOME);await ready(p);await pose(p,.56);await ready(p);
 await p.goto(HOME+'vehiculos/');await p.goBack({waitUntil:'commit'});await ready(p);
 check('history back restores frame and progress',Math.abs(await p.evaluate(()=>__RP_V2__.progress)-.56)<.015);report.restores.push(await p.evaluate(()=>({pages:__pages,navigation:performance.getEntriesByType('navigation')[0].type})));
 await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await pose(p,.3);
 await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await ready(p);check('persisted lifecycle resumes controller',true);
 await p.locator('header nav a').click();await p.waitForFunction(()=>__RP_V2__.progress===1);await pose(p,.4);await ready(p);check('return from catalog resumes video',true);
 report.restores.at(-1).touchAfterRestore=await p.evaluate(()=>({points:navigator.maxTouchPoints,coarse:matchMedia('(pointer:coarse)').matches}));
 await c.close();
 // Chromium BFCache restores maxTouchPoints=0 in this emulation environment.
 // Test orientation in a fresh context that still represents a touch device.
 const rotated=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),r=await rotated.newPage();
 await r.goto(HOME);await ready(r);await pose(r,.4);await ready(r);
 await r.setViewportSize({width:932,height:430});
 await r.waitForFunction(()=>innerWidth===932&&matchMedia('(pointer:coarse)').matches&&document.querySelector('video').currentSrc.includes('portrait')&&__RP_V2__.device==='mobile');
 await ready(r);check('orientation retains vertical source on touch device',true);
 await r.setViewportSize({width:390,height:844});await ready(r);await rotated.close();
 for(const mode of ['no-rvfc','error']){
  const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await c.newPage();
  if(mode==='no-rvfc')await p.addInitScript(()=>Object.defineProperty(HTMLVideoElement.prototype,'requestVideoFrameCallback',{value:undefined}));
  else await p.route('**/*.mp4',route=>route.abort());
  await p.goto(HOME);
  if(mode==='no-rvfc'){await ready(p);await pose(p,.56);await ready(p);check('seeked + paint fallback without rVFC',true);}
  else{await p.waitForFunction(()=>__RP_V2__?.state==='fallback');check('real media failure retains poster',await p.locator('.hero-poster').evaluate(e=>!e.hasAttribute('data-presented')));}
  await c.close();
 }
}finally{await writeFile('artifacts/hero-reload/lifecycle-report.json',JSON.stringify(report,null,2));await b.close();console.log(report.checks.length+' lifecycle checks passed');}
