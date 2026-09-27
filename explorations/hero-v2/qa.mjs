import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire('C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium, webkit } = require('playwright');
const OUT = new URL('./qa/', import.meta.url);
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const base = 'http://127.0.0.1:9420/hero-v2/';
const report = { date:new Date().toISOString(), browser:await browser.version(), profiles:[], cases:[], limitations:['No physical iPhone available. Chromium touch emulation is not Safari.'] };
const percentile = (values, fraction) => [...values].sort((a,b)=>a-b)[Math.floor(values.length*fraction)] ?? null;
function check(name, actual) { assert(actual,name); report.cases.push({name,passed:true}); }
async function settled(page, p) {
  await page.evaluate(p => {
    const root=document.querySelector('.hero-track'), stage=document.querySelector('.hero-stage');
    scrollTo(0,(root.offsetHeight-stage.offsetHeight)*p);
  },p);
  await page.waitForFunction(p => {
    const d=window.__RP_V2__, v=document.querySelector('video');
    return d && Math.abs(d.progress-p)<.003 && !v.seeking && Math.abs((d.presentedTime??-10)-d.targetTime)<.013;
  },p,{timeout:15000});
}
async function runMotion(page, direction, duration=3000) {
  await settled(page,direction==='forward'?0:.99);
  return page.evaluate(async ({direction,duration}) => {
    const d=window.__RP_V2__; const root=document.querySelector('.hero-track'), stage=document.querySelector('.hero-stage');
    const distance=root.offsetHeight-stage.offsetHeight;
    const count=d.presentations.length, seekCount=d.seekLatencies.length;
    const frames=[], lag=[];let first,last;
    await new Promise(done=>{
      function tick(now) {
        first??=now;if(last) frames.push(now-last);last=now;
        const p=Math.min(1,(now-first)/duration);
        scrollTo(0,distance*(direction==='forward'?p*.99:(1-p)*.99));
        lag.push(Math.abs((d.presentedTime??0)-d.targetTime));
        if(p<1)requestAnimationFrame(tick);else done();
      }requestAnimationFrame(tick);
    });
    return {direction,durationMs:last-first,rafFPS:frames.length*1000/(last-first),frameIntervals:frames,
      mediaPresentations:d.presentations.slice(count),seekMs:d.seekLatencies.slice(seekCount),lagSeconds:lag};
  },{direction,duration});
}
try {
 for (const [encoding,path,options] of [['fast','',{}],['compact','compact/',{}],['mobile','mobile-study/',{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}]]) {
  const context=await browser.newContext({viewport:{width:1440,height:900},...options});
  const page=await context.newPage();const requests=[],errors=[];
  page.on('request',r=>requests.push(r.url())); page.on('pageerror',e=>errors.push(e.message));
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await page.addInitScript(()=>{window.__longTasks=[];new PerformanceObserver(list=>window.__longTasks.push(...list.getEntries().map(x=>({start:x.startTime,duration:x.duration})))).observe({type:'longtask',buffered:true});});
  await page.goto(base+path,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__RP_V2__?.state==='ready',null,{timeout:20000});
  const profile={encoding,cold:await page.evaluate(()=>({preparedMs:__RP_V2__.firstPresentedMs,loadedMs:__RP_V2__.loadedDataMs,heap:performance.memory?.usedJSHeapSize,
    width:document.querySelector('video').videoWidth,height:document.querySelector('video').videoHeight,duration:document.querySelector('video').duration,api:__RP_V2__.presentationAPI,
    mediaResources:performance.getEntriesByType('resource').filter(x=>/mp4/.test(x.name)).map(x=>({name:x.name,duration:x.duration,transfer:x.transferSize}))}))};
  check(`${encoding}: paused, not autoplay`,await page.locator('video').evaluate(v=>v.paused&&!v.autoplay));
  profile.posterDifference=await page.evaluate(async()=>{
    const v=document.querySelector('video'),img=document.querySelector('.hero-poster');await img.decode();
    const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;
    const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(v,0,0,c.width,c.height);const a=ctx.getImageData(0,0,c.width,c.height).data;
    ctx.drawImage(img,0,0,c.width,c.height);const b=ctx.getImageData(0,0,c.width,c.height).data;
    let sum=0,max=0,count=0;for(let i=0;i<a.length;i+=16){for(let k=0;k<3;k++){const n=Math.abs(a[i+k]-b[i+k]);sum+=n;max=Math.max(max,n);count++;}}
    return {meanChannelDifference:sum/count,maxChannelDifference:max,scale:255};
  });
  await page.screenshot({path:new URL(`${encoding}-initial.png`,OUT).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
  for(const direction of ['forward','reverse']) {
    const m=await runMotion(page,direction);profile[direction]={durationMs:m.durationMs,rafFPS:m.rafFPS,rafP95:percentile(m.frameIntervals,.95),seekP50:percentile(m.seekMs,.5),seekP95:percentile(m.seekMs,.95),seekMax:Math.max(0,...m.seekMs),presentations:m.mediaPresentations.length,lagP95:percentile(m.lagSeconds,.95),raw:m};
  }
  await settled(page,.5);await page.screenshot({path:new URL(`${encoding}-middle.png`,OUT).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
  if(encoding==='fast') {
    await page.setViewportSize({width:1200,height:800});await settled(page,.5);
    check('resize preserves correct frame',await page.evaluate(()=>Math.abs(__RP_V2__.presentedTime-__RP_V2__.targetTime)<.024));
    await page.setViewportSize({width:1440,height:900});
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));scrollTo(0,150);});
    await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
    await settled(page,.5);check('visibility resume (simulated document.hidden)',true);
  }
  await settled(page,.92);await page.screenshot({path:new URL(`${encoding}-transition.png`,OUT).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
  await page.evaluate(()=>{const r=document.querySelector('.hero-track'),s=document.querySelector('.hero-stage');const distance=r.offsetHeight-s.offsetHeight;scrollTo(0,distance*.15);scrollTo(0,distance*.94);scrollTo(0,distance*.28);});
  await settled(page,.28);
  check(`${encoding}: latest target after reversal`,await page.evaluate(()=>Math.abs(__RP_V2__.presentedTime-__RP_V2__.targetTime)<.024));
  await cdp.send('Network.setCacheDisabled',{cacheDisabled:false});
  // Populate HTTP cache after the deliberately uncached pass, then measure the next reload.
  await settled(page,.5);await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>__RP_V2__?.state==='ready',null,{timeout:20000});
  await settled(page,.5);await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>__RP_V2__?.state==='ready'&&Math.abs(__RP_V2__.presentedTime-__RP_V2__.targetTime)<.024,null,{timeout:20000});
  profile.warmReload=await page.evaluate(()=>({preparedMs:__RP_V2__.firstPresentedMs,progress:__RP_V2__.progress,time:__RP_V2__.presentedTime,target:__RP_V2__.targetTime,url:location.href}));
  check(`${encoding}: stable reload`,profile.warmReload.url===base+path&&profile.warmReload.progress>.45&&profile.warmReload.progress<.55);
  await settled(page,0);
  await page.getByRole('link',{name:'Ver vehículos',exact:true}).click();
  check(`${encoding}: skip + focus`,await page.locator('#catalogo').evaluate(e=>document.activeElement===e&&!e.inert&&e.getBoundingClientRect().top>=0&&e.getBoundingClientRect().top<100));
  await page.screenshot({path:new URL(`${encoding}-catalog.png`,OUT).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__RP_V2__);
  check(`${encoding}: catalog reload retains V2`,await page.locator('.hero-track').count()===1&&!await page.locator('[data-hero-3d]').count());
  check(`${encoding}: no V1 downloads`,!requests.some(u=>/\.glb|\.hdr|three|controller-CsEEoJ53|hero-webgl/.test(u)));
  check(`${encoding}: no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  check(`${encoding}: no JS errors`,errors.length===0);
  profile.longTasks=await page.evaluate(()=>__longTasks);profile.requests=[...new Set(requests)];report.profiles.push(profile);
  await context.close();
 }
 for(const [name,settings] of [['mobile-poster',{viewport:{width:390,height:844},isMobile:true,hasTouch:true}],['reduced',{reducedMotion:'reduce'}],['no-js',{javaScriptEnabled:false}]]) {
   const page=await browser.newPage({viewport:{width:1440,height:900},...settings});const requests=[];page.on('request',r=>requests.push(r.url()));
   await page.goto(base,{waitUntil:'networkidle'});
   check(`${name}: no video download`,!requests.some(u=>u.endsWith('.mp4')));
   await page.getByRole('link',{name:'Ver vehículos',exact:true}).click();
   check(`${name}: catalog visible`,await page.locator('#catalogo').evaluate(e=>getComputedStyle(e).opacity==='1'&&!e.inert));
   await page.screenshot({path:new URL(`${name}.png`,OUT).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
   await page.close();
 }
 const failurePage=await browser.newPage({viewport:{width:1440,height:900}});
 await failurePage.route('**/*.mp4',route=>route.abort());
 await failurePage.goto(base);await failurePage.waitForFunction(()=>window.__RP_V2__?.state==='fallback');
 check('media failure retains matching poster',await failurePage.locator('.hero-poster').evaluate(e=>e.complete&&e.naturalWidth>0&&getComputedStyle(e).visibility==='visible'));
 await failurePage.getByRole('link',{name:'Ver vehículos',exact:true}).click();
 check('media failure skip',await failurePage.locator('#catalogo').evaluate(e=>!e.inert&&getComputedStyle(e).opacity==='1'));
 await failurePage.close();
 try { const safari=await webkit.launch({headless:true});report.webkit='Available, requires separate codec validation';await safari.close(); }
 catch(error) { report.webkit='Unavailable: '+error.message.split('\n')[0]; }
} catch(error) {report.failure=error.stack;process.exitCode=1;}
finally { await writeFile(new URL('report.json',OUT),JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify({...report,profiles:report.profiles.map(({forward,reverse,requests,longTasks,...p})=>({...p,forward:{...forward,raw:undefined},reverse:{...reverse,raw:undefined}}))},null,2)); }
