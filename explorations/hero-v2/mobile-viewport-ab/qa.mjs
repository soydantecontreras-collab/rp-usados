// Local geometry/compositor checks. Never changes production or deploys.
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const require=createRequire(process.env.RP_QA_RUNTIME||'C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright'),sharp=require('sharp');
const out=resolve(import.meta.dirname,'../../../tools/.preview/hero-mobile-ab');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={sourceCommit:'3d081cac07b02105634b8f01eaa24423bec53d4d',checks:[],geometry:[],phaseGeometry:[],reloads:[],resources:[],screenshots:[],limits:['Desktop emulation, not actual Android Chrome toolbar or system navigation.','Crop is geometric source coverage, not a pixel-level estimate of the dark render.']};
const check=(name,pass,data)=>{report.checks.push({name,pass,data});if(!pass)console.error('FAIL',name,data);};
const m=f=>f.evaluate(()=>window.__HERO_AB__);
async function ready(f){await f.waitForFunction(()=>window.__RP_V2__?.state==='ready'&&!document.querySelector('video').seeking&&document.querySelector('.hero-poster').hasAttribute('data-presented'),{},{timeout:15000});await f.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function pose(f,p){await f.evaluate(p=>{const root=document.querySelector('.hero-track'),stage=document.querySelector('.hero-stage');window.scrollTo({top:root.offsetTop-document.querySelector('header').offsetHeight+p*(root.offsetHeight-stage.offsetHeight),behavior:'instant'});},p);await f.waitForFunction(p=>Math.abs(window.__RP_V2__.progress-p)<.003&&Math.abs(window.__RP_V2__.presentedTime-window.__RP_V2__.targetTime)<.013&&!document.querySelector('video').seeking,p,{timeout:15000});await f.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
try{
 const page=await browser.newPage({viewport:{width:1440,height:1120},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>report.resources.push(r.url()));
 for(const width of [375,390,393,430]){
  await page.goto(`http://127.0.0.1:9493/?width=${width}&small=760`);
  const f=page.frames().find(f=>f.url().includes('hero.html'));await ready(f);
  for(const variant of ['A','B']){
   await page.locator('[data-delta="0"]').click();
   await f.waitForFunction(()=>innerHeight===760);await page.locator(`[data-variant="${variant}"]`).click();
   await f.waitForFunction(v=>window.__HERO_AB__?.variant===v,variant);
   const baseline=await m(f);
   for(const delta of [0,16,72]){
    await page.locator(`[data-delta="${delta}"]`).click();
    await f.waitForFunction(h=>window.__HERO_AB__?.viewport.height===h,760+delta);
    const metrics=await m(f),movement={};for(const key of ['image','cta','title','copy'])movement[key]=metrics[key].top-baseline[key].top;
    report.geometry.push({width,variant,delta,movement,metrics});
    check(`${width}/${variant}/+${delta}: stable image and overlays`,Object.values(movement).every(v=>Math.abs(v)<.02),movement);
    check(`${width}/${variant}/+${delta}: expected black coverage`,variant==='A'?Math.abs(metrics.blackBelowPlane-delta)<.02:metrics.blackBelowImage<.02,metrics.blackBelowImage);
    check(`${width}/${variant}/+${delta}: no overflow`,await f.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    if(width===393){const path=resolve(out,`${variant.toLowerCase()}-initial-plus-${delta}.png`);await page.locator('#hero-frame').screenshot({path});report.screenshots.push(path);}
   }
  }
  if(width===393){
   await page.locator('[data-delta="0"]').click();await f.waitForFunction(()=>innerHeight===760);
   for(const [label,progress] of [['mid',.48],['arrival',.88]]){
    await pose(f,progress);
    const before=await m(f);
    for(const variant of ['A','B']){
     await page.locator(`[data-variant="${variant}"]`).click();await f.waitForFunction(v=>window.__HERO_AB__.variant===v,variant);
     const after=await m(f);check(`${label}/${variant}: switching keeps pose`,Math.abs(after.time-before.time)<.002&&Math.abs(after.progress-before.progress)<.0001,{before:before.time,after:after.time});
     const path=resolve(out,`${variant.toLowerCase()}-${label}.png`);await page.locator('#hero-frame').screenshot({path});report.screenshots.push(path);
    }
    // Height-only resize while the camera is moving must not reset the requested frame.
    const phaseBase=await m(f);
    for(const delta of [16,72]){
     await page.locator(`[data-delta="${delta}"]`).click();await f.waitForFunction(h=>innerHeight===h,760+delta);
     const expanded=await m(f),movement={};for(const key of ['image','cta','title','copy'])movement[key]=expanded[key].top-phaseBase[key].top;
     report.phaseGeometry.push({label,delta,movement,metrics:expanded});
     check(`${label}/+${delta}: resize keeps camera frame`,Math.abs(expanded.time-before.time)<.002&&Math.abs(expanded.progress-before.progress)<.0001,{before:before.time,after:expanded.time});
     check(`${label}/+${delta}: stable image and overlays`,Object.values(movement).every(v=>Math.abs(v)<.02),movement);
    }
    await page.locator('[data-delta="0"]').click();await f.waitForFunction(()=>innerHeight===760);
   }
   await pose(f,0);
  }
 }
 check('No JavaScript errors in sandbox',errors.length===0,errors);
 check('Only mobile hero assets in sandbox',!report.resources.some(u=>/hero-fast-dark-doors|poster-fast-dark-doors|\.glb|\.hdr|three(?:\.js|[-.])/i.test(u)));
 // A must remain visually identical to the approved frozen frontend.
 const baselinePage=await browser.newPage({viewport:{width:393,height:760}}),aPage=await browser.newPage({viewport:{width:393,height:760}});
 await baselinePage.goto('http://127.0.0.1:9492/');await aPage.goto('http://127.0.0.1:9493/hero.html?variant=A&mode=simulation&small=760&maximum=832');
 await ready(baselinePage);await ready(aPage);await Promise.all([baselinePage.evaluate(()=>document.fonts.ready),aPage.evaluate(()=>document.fonts.ready)]);
 const original=await baselinePage.screenshot(),a=await aPage.screenshot();
 const pixels1=await sharp(original).raw().toBuffer(),pixels2=await sharp(a).raw().toBuffer();let changed=0;
 for(let i=0;i<pixels1.length;i+=3)if(pixels1[i]!==pixels2[i]||pixels1[i+1]!==pixels2[i+1]||pixels1[i+2]!==pixels2[i+2])changed++;
 check('A pixel-identical to approved snapshot',changed===0,{changedPixels:changed,pixels:393*760});await baselinePage.close();await aPage.close();
 for(const variant of ['A','B'])for(const width of [375,390,430]){
  const context=await browser.newContext({viewport:{width,height:760},hasTouch:true,isMobile:true});const p=await context.newPage();
  const resources=[];p.on('request',r=>resources.push(r.url()));
  const cdp=await context.newCDPSession(p);await cdp.send('Network.enable');
  await p.goto(`http://127.0.0.1:9493/hero.html?variant=${variant}&mode=simulation&small=760&maximum=832`);await ready(p);
  for(const progress of [.02,.18,.78,.33,0])await pose(p,progress);
  check(`${width}/${variant}: forward/reverse`,(await m(p)).time===0);
  await p.mouse.move(width/2,300);await p.mouse.wheel(0,16);
  await p.waitForFunction(()=>scrollY>=15&&window.__RP_V2__.progress>0);check(`${width}/${variant}: native small scroll`,await p.evaluate(()=>scrollY>=15));
  await p.mouse.wheel(0,520);await p.waitForFunction(()=>scrollY>500);
  await p.mouse.wheel(0,-536);await p.waitForFunction(()=>scrollY===0);await ready(p);
  check(`${width}/${variant}: native fast forward/reverse`,(await m(p)).time===0);
  for(const cold of [true,false]){
   await cdp.send('Network.setCacheDisabled',{cacheDisabled:cold});await pose(p,.48);
   await p.reload();await ready(p);const mid=await m(p);
   check(`${width}/${variant}/${cold?'cold':'warm'} reload mid`,Math.abs(mid.progress-.48)<.003,{progress:mid.progress,state:mid.state});
   report.reloads.push({width,variant,cold,position:'mid',metrics:mid});
   await pose(p,0);await p.reload();await ready(p);const top=await m(p);
   check(`${width}/${variant}/${cold?'cold':'warm'} reload top`,top.time===0&&top.state==='ready',{frame:top.frame,state:top.state});
   report.reloads.push({width,variant,cold,position:'top',metrics:top});
  }
  check(`${width}/${variant}: only mobile video/poster`,!resources.some(u=>/hero-fast-dark-doors|poster-fast-dark-doors|\.glb|\.hdr|three(?:\.js|[-.])/i.test(u)));
  await context.close();
 }
 const reducedContext=await browser.newContext({viewport:{width:390,height:760},reducedMotion:'reduce'}),rp=await reducedContext.newPage();const reducedResources=[];rp.on('request',r=>reducedResources.push(r.url()));
 await rp.goto('http://127.0.0.1:9493/hero.html?variant=B&mode=simulation&small=760&maximum=832');await rp.waitForFunction(()=>window.__HERO_AB__?.state==='poster');
 check('Reduced motion: static poster, no video request',!(reducedResources.some(u=>u.endsWith('.mp4')))&&await rp.locator('.hero-poster').isVisible());
 await reducedContext.close();
 const failed=await browser.newPage({viewport:{width:390,height:760}});await failed.route('**/*.mp4',route=>route.abort());
 await failed.goto('http://127.0.0.1:9493/hero.html?variant=B&mode=simulation&small=760&maximum=832');await failed.waitForFunction(()=>window.__RP_V2__?.state==='fallback');
 check('Video failure retains coherent mobile poster and navigation',await failed.locator('.hero-poster').isVisible()&&await failed.locator('.hero-caption .action').isVisible());await failed.close();
 const nojsContext=await browser.newContext({viewport:{width:390,height:760},javaScriptEnabled:false}),nojs=await nojsContext.newPage();const nojsResources=[];nojs.on('request',r=>nojsResources.push(r.url()));
 await nojs.goto('http://127.0.0.1:9493/hero.html?variant=B');check('Without JS: approved poster and no video request',await nojs.locator('.hero-poster').isVisible()&&!nojsResources.some(u=>u.endsWith('.mp4')));await nojsContext.close();
 const native=await browser.newPage({viewport:{width:390,height:760}});await native.goto('http://127.0.0.1:9493/hero.html?variant=B');await ready(native);report.native=await m(native);check('Native route captures CSS LVH',report.native.maximumViewport===760&&report.native.mode==='native');
 await native.setViewportSize({width:760,height:390});await native.waitForFunction(()=>innerWidth===760&&window.__HERO_AB__?.viewport.height===390);report.landscape=await m(native);check('Landscape preserves full approved vertical video',report.landscape.effectiveFit==='contain'&&report.landscape.crop.bottom===0);
 await native.setViewportSize({width:390,height:760});await native.waitForFunction(()=>innerWidth===390&&window.__HERO_AB__?.viewport.height===760);check('Orientation returns to portrait without overflow',await native.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await native.close();
 await page.goto('http://127.0.0.1:9493/');await page.keyboard.press('Tab');report.keyboard=await page.evaluate(()=>({tag:document.activeElement.tagName,label:document.activeElement.textContent,outline:getComputedStyle(document.activeElement).outlineStyle}));check('Keyboard selector has visible focus',report.keyboard.tag==='BUTTON'&&report.keyboard.outline!=='none');
 await page.close();
 for(const label of ['initial-plus-0','initial-plus-72','mid','arrival']){
  const a=await sharp(resolve(out,`a-${label}.png`)).png().toBuffer(),b=await sharp(resolve(out,`b-${label}.png`)).png().toBuffer();const meta=await sharp(a).metadata();
  const path=resolve(out,`compare-${label}.png`);await sharp({create:{width:meta.width*2+16,height:meta.height,channels:3,background:'#242426'}}).composite([{input:a,left:0,top:0},{input:b,left:meta.width+16,top:0}]).png().toFile(path);
  report.screenshots.push(path);
 }
}finally{
 await browser.close();report.passed=report.checks.filter(c=>c.pass).length;report.failed=report.checks.filter(c=>!c.pass).length;
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,passed:report.passed,failed:report.failed,reloads:report.reloads.length}));
}
if(report.failed)process.exitCode=1;
