import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire('C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const out=resolve(import.meta.dirname,'../../artifacts/catalog-cursors');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const report={url:'http://127.0.0.1:9480/cursors.html',checks:[],speed:{},callbacks:{}};
const check=(name,pass)=>{assert(pass,name);report.checks.push(name);};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.goto(report.url,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  check('Three identical cards with common B',await page.locator('.cursor-card.variant-b').count()===3&&await page.locator('.light-band').count()===0);
  check('One photo each, same resource',await page.locator('.vehicle-photo').evaluateAll(images=>images.length===3&&new Set(images.map(i=>i.currentSrc)).size===1));
  check('No V1, hero, GSAP or additional photo loaded',!requests.some(url=>/hero|\.glb|\.hdr|gsap|rear|front/.test(url)));
  await page.screenshot({path:resolve(out,'comparison.png'),fullPage:true});
  const a=page.locator('[data-cursor=A] .vehicle-link'),box=await a.boundingBox();
  await page.mouse.move(box.x+30,box.y+90);
  await wait(500);
  for(let n=0;n<18;n++){await page.mouse.move(box.x+30+n,box.y+90);await wait(22);}
  report.speed.slow=await page.evaluate(()=>window.__CURSOR_LAB__.state.length);
  let maximum=0;
  for(let n=0;n<12;n++){
    await page.mouse.move(box.x+(n%2?box.width*.8:box.width*.2),box.y+150+n);
    await wait(12);
    maximum=Math.max(maximum,await page.evaluate(()=>window.__CURSOR_LAB__.state.length));
  }
  report.speed.fastMax=maximum;
  check('Speed Trace responds to speed, capped at 22 px',maximum>report.speed.slow+5&&maximum<=22.1);
  await page.screenshot({path:resolve(out,'speed-trace-moving.png')});
  await wait(600);
  report.speed.stopped=await page.evaluate(()=>window.__CURSOR_LAB__.state.length);
  check('Speed Trace returns to tiny idle pointer and stops RAF',report.speed.stopped<.1&&await page.evaluate(()=>window.__CURSOR_LAB__.state.loops===0));
  await page.mouse.move(3,3);
  check('Normal cursor outside card',await page.locator('.is-cursor-active').count()===0&&await page.locator('.lab-cursor.is-visible').count()===0);
  for(const variant of ['A','B','C']){
    const link=page.locator('[data-cursor='+variant+'] .vehicle-link');
    await link.hover();await wait(250);
    check(variant+': replacement only inside card',await page.locator('.lab-cursor.is-visible').count()===1&&await link.evaluate(el=>getComputedStyle(el).cursor==='none'));
    await wait(500);
    check(variant+': stops RAF while idle inside card',await page.evaluate(()=>window.__CURSOR_LAB__.state.loops===0));
    const position=await link.boundingBox();
    await page.screenshot({path:resolve(out,'cursor-'+variant+'-detail.png'),clip:{x:position.x+position.width/2-45,y:position.y+position.height/2-45,width:90,height:90}});
    await page.mouse.down();await wait(120);
    check(variant+': press feedback',await page.locator('.lab-cursor.is-visible.is-pressed').count()===1);
    await page.screenshot({path:resolve(out,'cursor-'+variant+'-press.png')});
    await page.mouse.move(3,3);await page.mouse.up();
    check(variant+': no running loop outside',await page.evaluate(()=>window.__CURSOR_LAB__.state.loops===0));
  }
  await page.locator('#cursor-enabled').uncheck();
  await a.hover();
  check('Toggle restores native pointer',await a.evaluate(el=>getComputedStyle(el).cursor==='pointer')&&await page.locator('.lab-cursor.is-visible').count()===0);
  await page.locator('#cursor-enabled').check();
  await page.locator('[data-view=C]').click();
  check('Enlarged selector works',await page.locator('.concept:visible').count()===1);
  await page.locator('[data-cursor=C] .vehicle-link').hover();await wait(180);
  await page.screenshot({path:resolve(out,'facet-enlarged.png'),fullPage:true});
  const popupReady=page.waitForEvent('popup');
  await page.locator('[data-cursor=C] .vehicle-link').click();
  const popup=await popupReady;await popup.waitForLoadState('domcontentloaded');
  check('Native navigation opens real local DEMO detail',popup.url().includes('/vehiculos/demo-vento/')&&await popup.locator('#unit-title').isVisible());
  await popup.close();
  await page.locator('[data-view=all]').click();await page.keyboard.press('Tab');await a.focus();
  check('Keyboard focus maintained',await a.evaluate(el=>document.activeElement===el&&getComputedStyle(el).outlineStyle!=='none'));
  check('No cursor text, overlay never intercepts pointer',await page.locator('.lab-cursor').evaluateAll(nodes=>nodes.every(n=>!n.textContent.trim()&&getComputedStyle(n).pointerEvents==='none')));
  check('No errors or overflow',!errors.length&&await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  report.callbacks=await page.evaluate(()=>Object.fromEntries(Object.entries(window.__CURSOR_LAB__.stats).map(([key,values])=>{values.sort((a,b)=>a-b);return[key,{samples:values.length,p95ms:values[Math.max(0,Math.ceil(values.length*.95)-1)]||0}];})));
  await context.close();
  for(const options of [{name:'touch',viewport:{width:390,height:844},isMobile:true,hasTouch:true},{name:'reduced',viewport:{width:1440,height:900},reducedMotion:'reduce'},{name:'no-js',viewport:{width:1440,height:900},javaScriptEnabled:false}]){
    const ctx=await browser.newContext(options),p=await ctx.newPage();await p.goto(report.url,{waitUntil:'networkidle'});
    if(options.name!=='touch')await p.locator('[data-cursor=A] .vehicle-link').hover();
    check(options.name+': native cursor and no active overlay',await p.locator('.is-cursor-active').count()===0&&await p.locator('.lab-cursor.is-visible').count()===0);
    await ctx.close();
  }
}finally{await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify({passed:report.checks.length,speed:report.speed,callbacks:report.callbacks},null,2));
