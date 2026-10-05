import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const require = createRequire(process.env.RP_PLAYWRIGHT_PACKAGE || 'C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = require('playwright');
const origin = (process.env.RP_PREVIEW_URL || 'http://127.0.0.1:9480').replace(/\/$/, '');
const out = process.env.RP_PREVIEW_QA_OUT || 'artifacts/vercel-demo-preview/local';
await mkdir(out, {recursive:true});
const report = {origin,checks:[],profiles:[],limitations:['Chromium touch emulation is not a physical iPhone/Safari test.','Demo vehicles and prices are test data; the static preview has no WordPress runtime.']};
const check = (name,condition) => {assert(condition,name);report.checks.push(name);};
const browser = await chromium.launch({channel:'msedge',headless:true,args:['--autoplay-policy=document-user-activation-required']});
async function ready(page){await page.waitForFunction(()=>window.__RP_V2__?.state==='ready'&&document.querySelector('.hero-poster').hasAttribute('data-presented')&&!document.querySelector('video').seeking&&Math.abs(window.__RP_V2__.targetTime-window.__RP_V2__.presentedTime)<.013,null,{timeout:30000});}
async function pose(page,value){await page.evaluate(v=>{const h=document.querySelector('.hero-track'),s=document.querySelector('.hero-stage');scrollTo({top:h.offsetTop-document.querySelector('header').offsetHeight+(h.offsetHeight-s.offsetHeight)*v,behavior:'instant'});},value);await page.waitForFunction(v=>Math.abs(__RP_V2__.progress-v)<.016,value);await ready(page);}
try {
  for(const [width,height,mobile] of [[1440,900,false],[1280,800,false],[375,812,true],[390,844,true],[430,932,true]]) {
    const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
    const page=await context.newPage(),requests=[],errors=[],failed=[];
    page.on('request',request=>requests.push(request.url()));
    page.on('pageerror',error=>errors.push(error.message));
    page.on('response',response=>{if(response.url().startsWith(origin)&&response.status()>=400) failed.push([response.status(),response.url()]);});
    const home=await page.goto(origin+'/'); await ready(page); await page.evaluate(()=>document.fonts.ready);
    const media=await page.locator('video').evaluate(video=>({src:video.currentSrc,width:video.videoWidth,height:video.videoHeight,duration:video.duration}));
    check(`${width}: static demo home`,home.status()===200&&await page.locator('aside[aria-label="Datos de prueba"]').isVisible()&&await page.locator('.vehicle').count()===9);
    check(`${width}: eligible states only`,await page.locator('.vehicle[data-state="reservado"]').count()===2&&await page.locator('.vehicle[data-state="vendido"]').count()===0);
    check(`${width}: full-card links and no list prices`,await page.locator('.vehicle').evaluateAll(cards=>cards.every(card=>card.children.length===1&&card.firstElementChild.matches('a.vehicle-link')))&&await page.locator('#catalogo .vehicle-price').count()===0);
    check(`${width}: source resolution/fps duration`,media.width===(mobile?720:1600)&&media.height===(mobile?1280:900)&&Math.abs(media.duration-3)<.1);
    check(`${width}: only selected device video`,requests.some(url=>url.endsWith(mobile?'hero-mobile-portrait-crf18.mp4':'hero-fast-dark-doors.mp4'))&&requests.filter(url=>url.endsWith('.mp4')).every(url=>url.endsWith(mobile?'hero-mobile-portrait-crf18.mp4':'hero-fast-dark-doors.mp4')));
    check(`${width}: only selected device poster`,requests.some(url=>url.includes(mobile?'portrait-crf18-poster':'poster-fast-dark-doors'))&&!requests.some(url=>url.includes(mobile?'poster-fast-dark-doors':'portrait-crf18-poster')));
    check(`${width}: fonts`,await page.evaluate(()=>getComputedStyle(document.body).fontFamily.includes('Manrope')&&getComputedStyle(document.querySelector('.label')).fontFamily.includes('Archivo')));
    check(`${width}: no separate year badge`,await page.locator('.heritage-type').count()===0&&(await page.locator('#nosotros').innerText()).includes('desde 1990'));
    await page.screenshot({path:`${out}/home-${width}.png`});
    for(const value of [.18,.78,.3,0]) await pose(page,value);
    for(const value of [0,.55]){await pose(page,value);await page.reload();await ready(page);check(`${width}: reload at ${value}`,Math.abs(await page.evaluate(()=>__RP_V2__.progress)-value)<.02);}
    await pose(page,.998);
    check(`${width}: dark hero end`,await page.locator('.hero-visual').evaluate(node=>Number(getComputedStyle(node).opacity)<.01));
    check(`${width}: subtle curve`,await page.locator('.catalog-cap').evaluate((node,isMobile)=>Math.round(node.getBoundingClientRect().height)===(isMobile?66:96),mobile));
    await page.locator('header nav a').click();
    check(`${width}: skip catalog`,await page.evaluate(()=>document.activeElement.id==='catalogo'));
    await page.locator('.vehicle-photo').evaluateAll(images=>Promise.all(images.map(img=>{img.loading='eager';return img.decode().catch(()=>{});})));
    check(`${width}: demo card images`,await page.locator('.vehicle-photo').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0)));
    await page.locator('#catalogo').screenshot({path:`${out}/catalog-${width}.png`});
    if(width===1440||width===390){
      await page.locator('#nosotros').scrollIntoViewIfNeeded();
      await page.locator('.heritage-media img').evaluate(async image=>{image.loading='eager';await image.decode();});
      check(`${width}: institutional photograph`,await page.locator('.heritage-media img').evaluate(image=>image.complete&&image.naturalWidth>0));
      await page.locator('#nosotros').screenshot({path:`${out}/nosotros-${width}.png`});
      check(`${width}: final financing copy`,(await page.locator('#opciones').innerText()).includes('Evaluamos cada operación de manera particular')&&(await page.locator('#opciones').innerText()).includes('se confirman directamente con RP Usados')&&(await page.locator('#opciones').innerText()).includes('La posibilidad de tomarlo y sus condiciones'));
      await page.locator('#opciones').screenshot({path:`${out}/financiacion-${width}.png`});
    }
    check(`${width}: map and route`,await page.locator('iframe[src*="google.com/maps/embed"]').count()===1&&await page.locator('a[href*="/maps/dir/"]').count()===1);
    check(`${width}: no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
    check(`${width}: no V1/Three/GLB/HDR or errors`,!errors.length&&!failed.length&&!requests.some(url=>/\.glb|\.hdr|three[./-]|hero-webgl|127\.0\.0\.1:(?:9400|9470)/.test(url)));
    if(mobile){
      await pose(page,.42);
      const before=await page.evaluate(()=>scrollY);
      await page.setViewportSize({width,height:height+72});
      await page.waitForTimeout(150);
      const after=await page.evaluate(()=>({scroll:scrollY,bottom:document.querySelector('.hero-stage').getBoundingClientRect().bottom,viewport:visualViewport.height}));
      check(`${width}: address-bar height change keeps native scroll`,Math.abs(after.scroll-before)<2&&Math.abs(after.bottom-after.viewport)<2);
      await page.setViewportSize({width,height});
    }
    report.profiles.push({width,media,firstPresentedMs:await page.evaluate(()=>__RP_V2__.firstPresentedMs),seekLatencies:await page.evaluate(()=>__RP_V2__.seekLatencies),failed,errors});
    await context.close();
  }
  for(const [mode,options] of [['reduced',{reducedMotion:'reduce'}],['no-js',{javaScriptEnabled:false}],['failed-video',{}]]) {
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,...options});
    const page=await context.newPage(),requests=[];page.on('request',request=>requests.push(request.url()));
    if(mode==='failed-video') await page.route('**/*.mp4',route=>route.abort());
    await page.goto(origin+'/');
    if(mode==='failed-video') await page.waitForFunction(()=>window.__RP_V2__?.state==='fallback');
    check(`${mode}: correct poster`,await page.locator('.hero-poster').evaluate(node=>node.currentSrc.includes('portrait')&&getComputedStyle(node).visibility==='visible'));
    if(mode!=='failed-video') check(`${mode}: no video download`,!requests.some(url=>url.endsWith('.mp4')));
    await page.locator('header nav a').click();check(`${mode}: catalog accessible`,await page.locator('.vehicle').count()===9);
    await context.close();
  }
  for(const slug of ['demo-vento','demo-hilux','demo-duster']) {
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
    const response=await page.goto(origin+`/vehiculos/${slug}/`);await page.evaluate(()=>document.fonts.ready);
    check(`${slug}: static labelled detail`,response.status()===200&&(await page.locator('aside[aria-label="Datos de prueba"]').innerText()).includes('DEMO VISUAL · NO ES STOCK REAL')&&(await page.locator('#unit-title').innerText()).includes('DEMO'));
    check(`${slug}: price only here and no fabricated WhatsApp`,(await page.locator('.vehicle-price').innerText()).includes('TST')&&await page.locator('a[href^="https://wa.me/"]').count()===0);
    check(`${slug}: detail no overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
    if(slug==='demo-vento') {
      check('demo-vento: four gallery images',await page.locator('.gallery-slide').count()===4);
      await page.locator('[data-next]').click();await page.waitForFunction(()=>document.querySelector('[data-position]').textContent.startsWith('02'));
      await page.locator('.gallery-viewport').focus();await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('[data-position]').textContent.startsWith('03'));
      check('demo-vento: gallery click and keyboard',true);
      await page.screenshot({path:`${out}/detail-390.png`});
    }
    if(slug==='demo-duster') check('demo-duster: optional fields collapse',await page.locator('.full-specs>div').count()===3&&await page.locator('.unit-facts dt').count()===1);
    await context.close();
  }
  const archive=await browser.newPage();const archiveResponse=await archive.goto(origin+'/vehiculos/');
  check('archive: 9 eligible demos, no sold/price',archiveResponse.status()===200&&await archive.locator('.vehicle').count()===9&&await archive.locator('.vehicle[data-state="vendido"]').count()===0&&await archive.locator('.vehicle-price').count()===0);
  await archive.close();
  const manifest=JSON.parse(await readFile(process.env.RP_EXPORT_REPORT || 'artifacts/vercel-demo-preview/export-report.json','utf8'));
  for(const [path,info] of Object.entries(manifest.files)) {
    if(path==='vercel.json'||path==='.vercelignore')continue;
    const response=await fetch(origin+'/'+path);let data=Buffer.from(await response.arrayBuffer());
    if(path.endsWith('.html')){
      const content=data.toString('utf8');
      const match=content.match(/<script\b[^>]*src="https:\/\/vercel\.live\/_next-live\/feedback\/feedback\.js"[^>]*><\/script>/g)||[];
      if(match.length){report.vercelFeedback=(report.vercelFeedback||0)+match.length;data=Buffer.from(content.replace(/<script\b[^>]*src="https:\/\/vercel\.live\/_next-live\/feedback\/feedback\.js"[^>]*><\/script>/g,''));}
    }
    check(`asset integrity ${path}`,response.status===200&&createHash('sha256').update(data).digest('hex')===info.sha256);
  }
  for(const video of ['hero-fast-dark-doors.mp4','hero-mobile-portrait-crf18.mp4']){
    const response=await fetch(origin+'/wp-content/themes/rp-usados/assets/hero/v2/'+video,{headers:{Range:'bytes=0-1023'}});
    check(`range ${video}`,response.status===206&&response.headers.get('content-range')?.startsWith('bytes 0-1023/')&&(await response.arrayBuffer()).byteLength===1024);
  }
} finally {await writeFile(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify({origin,passed:report.checks.length,profiles:report.profiles.length}));
