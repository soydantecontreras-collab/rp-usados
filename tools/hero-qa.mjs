import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(process.env.RP_PLAYWRIGHT_PACKAGE || 'C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = require('playwright');
const OUT = 'blender/web-integration-v6-1/qa';
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const URL = 'http://127.0.0.1:9400/?rp_hero_preview=1&hero_debug=1';
const report = { date: new Date().toISOString(), cases: [], warnings: [] };
const wait = (page, state) => page.waitForFunction(s => document.querySelector('[data-hero-3d]')?.dataset.state === s, state, { timeout: 70000 });
const snapshot = page => page.evaluate(() => ({ ...window.__RP_HERO_DIAGNOSTICS__, jsHeap: performance.memory?.usedJSHeapSize }));
async function pose(page, fraction) {
  await page.evaluate(p => {
    const root = document.querySelector('[data-hero-3d]');
    const distance = parseFloat(root.style.getPropertyValue('--hero-scroll'));
    scrollTo(0, distance * p);
  }, fraction);
  await page.waitForTimeout(450);
  return snapshot(page);
}
async function simpleCase(name, options = {}, before) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ...options });
  const requests = [];
  page.on('request', r => requests.push(r.url()));
  if (before) await before(page);
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  assert(await page.locator('.hero-webgl__poster').evaluate(e => e.complete && e.naturalWidth > 0), name + ' poster');
  assert(await page.getByRole('link', { name: 'Ver vehículos', exact: false }).first().isVisible(), name + ' CTA');
  assert.equal(await page.locator('canvas').count(), 0, name + ' canvas');
  assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), name + ' overflow');
  if (!before) assert(!requests.some(u => /controller-|hero\.glb/.test(u)), name + ' heavyweight request');
  await page.screenshot({ path: `${OUT}/${name}.png` });
  report.cases.push({ name, passed: true, requests3D: requests.filter(u => /controller-|hero\.glb/.test(u)), state: await page.locator('[data-hero-3d]').getAttribute('data-state') });
  await page.close();
}
try {
 const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
 const errors = [], requests = [];
 page.on('pageerror', e => errors.push(e.message));
 page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); else if(m.type() === 'warning') report.warnings.push(m.text()); });
 page.on('request', r => requests.push(r.url()));
 await page.addInitScript(() => {
   window.__longTasks = [];
   new PerformanceObserver(list => window.__longTasks.push(...list.getEntries().map(e => ({start:e.startTime,duration:e.duration})))).observe({ type:'longtask', buffered:true });
 });
 await page.goto(URL, { waitUntil: 'domcontentloaded' });
 await wait(page, 'ready');
 assert.equal(await page.locator('.hero-webgl__canvas canvas').count(),1,'exactly one mounted renderer');
 assert.equal(requests.filter(u=>u.endsWith('/hero.glb')).length,1,'single GLB request');
 report.cases.push({name:'single module initialization, GLB request and canvas',passed:true});
 await page.waitForTimeout(500);
 report.initial = await snapshot(page);
 await page.screenshot({ path: `${OUT}/desktop-initial.png` });
 report.poses = [];
 for (const [name, fraction] of [['middle',.5],['arrival',.83],['threshold',.92],['inside',.999]]) {
   const state = await pose(page, fraction);
   report.poses.push({ name, progress:state.progress, camera:state.cameraPosition });
   await page.screenshot({ path: `${OUT}/desktop-${name}.png` });
   if (name === 'inside') {
     await page.locator('.hero-webgl__visual').evaluate(e => e.style.opacity = '1');
     await page.locator('#trayectoria').evaluate(e => e.style.opacity = '0');
     await page.screenshot({ path: `${OUT}/diagnostic-inside-without-transition.png` });
     await page.locator('#trayectoria').evaluate(e => e.style.removeProperty('opacity'));
   }
 }
 const back = await pose(page, 0);
 assert(back.cameraPosition.every((n,i) => Math.abs(n-report.initial.cameraPosition[i])<.0001), 'reversible camera');
 report.cases.push({ name:'forward and reverse camera',passed:true });
 await page.keyboard.press('Tab');
 assert(await page.locator('.skip-link').evaluate(e=>e===document.activeElement),'preview keyboard skip link');
 report.cases.push({name:'preview keyboard first focus',passed:true});
 report.motion = await page.evaluate(async () => {
   const root = document.querySelector('[data-hero-3d]');
   const distance = parseFloat(root.style.getPropertyValue('--hero-scroll'));
   const intervals = [], before = window.__RP_HERO_DIAGNOSTICS__.frames;
   let previous, start;
   await new Promise(resolve => {
     function tick(now) {
       start ??= now;
       if (previous) intervals.push(now-previous);
       previous = now;
       scrollTo(0, Math.min(1,(now-start)/3000)*distance);
       if(now-start<3000) requestAnimationFrame(tick); else resolve();
     }
     requestAnimationFrame(tick);
   });
   const elapsed = intervals.reduce((a,b)=>a+b,0);
   const sorted = [...intervals].sort((a,b)=>a-b);
   return { durationMs:elapsed, browserRafFps:intervals.length/elapsed*1000,
     renderedFrames:window.__RP_HERO_DIAGNOSTICS__.frames-before,
     intervalP95:sorted[Math.floor(sorted.length*.95)], intervals };
 });
 await page.evaluate(() => scrollTo(0,document.body.scrollHeight));
 await page.waitForTimeout(500);
 const outside1 = await snapshot(page); await page.waitForTimeout(600); const outside2 = await snapshot(page);
 assert.equal(outside1.frames,outside2.frames,'offscreen render pause');
 report.cases.push({name:'out of viewport pause',passed:true,frames:outside2.frames});
 await pose(page,.4);
 const sizeBefore = await snapshot(page);
 await page.setViewportSize({width:1200,height:800}); await page.waitForTimeout(600);
 const resized = await snapshot(page);
 assert.equal(resized.viewport.width,1200); assert(resized.viewport.height<800);
 report.cases.push({name:'desktop resize',passed:true,viewport:resized.viewport});
 await page.evaluate(() => { Object.defineProperty(document,'hidden',{ configurable:true,value:true }); document.dispatchEvent(new Event('visibilitychange')); });
 const hidden1 = await snapshot(page); await pose(page,.6); const hidden2 = await snapshot(page);
 assert.equal(hidden1.frames,hidden2.frames,'hidden render pause');
 await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
 await page.waitForTimeout(300);
 assert((await snapshot(page)).frames>hidden2.frames,'visibility resume');
 report.cases.push({name:'visibility event lifecycle (simulated hidden state)',passed:true});
 report.longTasks = await page.evaluate(() => window.__longTasks);
 await page.emulateMedia({reducedMotion:'reduce'}); await page.waitForTimeout(400);
 assert.equal(await page.locator('canvas').count(),0,'live reduced motion dispose');
 assert.equal(await page.locator('[data-hero-3d]').evaluate(e=>e.style.getPropertyValue('--hero-scroll')),'');
 report.cases.push({name:'live reduced motion cleanup',passed:true});
 report.errors = errors; assert.equal(errors.length,0,'browser errors');
 await page.close();
 await simpleCase('mobile',{viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await simpleCase('compact',{viewport:{width:320,height:740},isMobile:true,hasTouch:true});
 await simpleCase('reduced-motion',{reducedMotion:'reduce'});
 await simpleCase('no-javascript',{javaScriptEnabled:false});
 await simpleCase('glb-failure',{},p=>p.route('**/hero.glb',r=>r.abort()));
 await simpleCase('webgl-failure',{},p=>p.addInitScript(() => {
   const original = HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext = function(type,...args) { return /webgl/.test(type) ? null : original.call(this,type,...args); };
 }));
 const routePage = await browser.newPage();
 const network=[]; routePage.on('request',r=>network.push(r.url()));
 for(const path of ['/','/vehiculos/','/?s=auto','/unidad-inexistente/']) {
   network.length=0;
   await routePage.goto('http://127.0.0.1:9400'+path,{waitUntil:'networkidle'});
   assert(!network.some(u=>/bootstrap-|controller-|hero\.glb|environment\.hdr/.test(u)), 'isolated route '+path);
   report.cases.push({name:'no 3D requests '+path,passed:true});
 }
 await routePage.close();
 const slow = await browser.newPage({viewport:{width:1440,height:900}});
 await slow.route('**/hero.glb',async r=>{ await new Promise(r=>setTimeout(r,35000)); await r.abort().catch(()=>{}); });
 await slow.goto(URL,{waitUntil:'domcontentloaded'});
 await slow.locator('.hero-webgl__poster').waitFor();
 const skip = slow.getByRole('link',{name:'Ver vehículos',exact:false}).first();
 await skip.click(); await slow.waitForURL('**/vehiculos/');
 report.cases.push({name:'catalog skip while GLB pending',passed:true});
 await slow.close();
} catch(error) { report.failure=error.stack; process.exitCode=1; }
finally { await writeFile(`${OUT}/qa-report.json`,JSON.stringify(report,null,2)); console.log(JSON.stringify({cases:report.cases,initial:report.initial?.readyMs,motion:report.motion && {...report.motion,intervals:undefined},failure:report.failure},null,2)); await browser.close(); }
