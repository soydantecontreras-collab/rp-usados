import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const require = createRequire('C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = require('playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const base = 'http://127.0.0.1:9411/explorations/stage-1/';
const out = resolve('explorations/stage-1/review/iteration-2');
await mkdir(out, { recursive: true });
const results=[];
try {
  for (const width of [1440,768,390,320]) {
    for (const file of ['index.html','vehiculo.html?estado=reservado']) {
      const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(base+file,{waitUntil:'domcontentloaded'});
      await page.evaluate(()=>document.fonts.ready);
      await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});
      const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,bodyFont:getComputedStyle(document.body).fontFamily,dataFont:getComputedStyle(document.querySelector('dd')).fontFamily,filters:document.querySelectorAll('input,select,form').length,badImages:[...document.images].filter(i=>!i.naturalWidth).length,fonts:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family),reduced:getComputedStyle(document.querySelector('.action')).transitionDuration,heading:document.querySelector('h1').textContent}));
      if(state.overflow||state.filters||state.badImages||errors.length)throw Error(JSON.stringify({width,file,state,errors}));
      await page.keyboard.press('Tab');
      if(!await page.locator('.skip').evaluate(e=>e===document.activeElement))throw Error('Skip focus failed');
      const label=file.startsWith('index')?'home':'detail';
      if(width===1440||width===390){
        await page.locator('h1').click();
        await page.screenshot({path:resolve(out,`${label}-${width}.png`),fullPage:true});
        if(label==='home'){
          await page.locator('#catalogo').screenshot({path:resolve(out,`catalog-${width}.png`)});
          await page.locator('#ubicacion').scrollIntoViewIfNeeded();
          await page.frameLocator('iframe').getByText('R.P. Usados',{exact:true}).first().waitFor({state:'visible',timeout:20000}).catch(()=>{});
          await page.waitForFunction(()=>document.querySelector('iframe')?.getBoundingClientRect().top<innerHeight);
          await page.waitForTimeout(1200);
          const map=page.frames().find(f=>f.url().includes('google.com/maps/embed'));
          const mapState=map?await map.locator('body').innerText({timeout:12000}).catch(()=> 'not readable'):'frame not loaded';
          results.push({width,mapState:mapState.slice(0,700)});
          await page.locator('#ubicacion').screenshot({path:resolve(out,`map-${width}.png`)});
          await page.screenshot({path:resolve(out,`home-${width}.png`),fullPage:true});
        }else{
          await page.locator('#next-image').click();
          if(!(await page.locator('#gallery-position').textContent()).startsWith('02'))throw Error('Gallery next failed');
          await page.locator('.gallery').focus();await page.keyboard.press('ArrowLeft');
          if(!(await page.locator('#gallery-position').textContent()).startsWith('01'))throw Error('Gallery keyboard failed');
          if(!(await page.locator('#unit-state').textContent()).includes('Reservado'))throw Error('Reserved lost');
          await page.evaluate(()=>scrollTo(0,0));
          await page.screenshot({path:resolve(out,`detail-viewport-${width}.png`)});
        }
      }
      results.push({width,file,...state,errors});await page.close();
    }
  }
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  for(const target of ['.vehicle-media','.vehicle-title','.vehicle-info dl']){
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.locator('.vehicle').first().locator(target).click();
    await page.waitForURL('**/vehiculo.html?estado=disponible');
  }
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);
  await page.locator('.vehicle-link').first().hover();await page.waitForTimeout(300);
  const motion=await page.locator('.photo-field').first().evaluate(e=>getComputedStyle(e).transform);
  if(motion==='none')throw Error('Hover missing');
  await page.locator('.vehicle').first().screenshot({path:resolve(out,'card-hover.png')});
  await page.locator('[data-whatsapp]').first().click();
  if(!await page.locator('dialog').isVisible())throw Error('WA feedback missing');
  for(let i=0;i<6;i++){await page.keyboard.press('Tab');if(!await page.evaluate(()=>document.querySelector('dialog').contains(document.activeElement)))throw Error('Dialog focus escaped')}
  await page.keyboard.press('Escape');
  if(!await page.locator('[data-whatsapp]').first().evaluate(e=>e===document.activeElement))throw Error('Focus not restored');
  await page.evaluate(()=>{document.body.style.zoom='2';scrollTo(0,0)});
  const zoomOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  if(zoomOverflow)throw Error('CSS zoom 200% overflow');
  results.push({cardSurfaceClicks:['image','title','specs'],hover:motion,whatsapp:'dialog, no outbound contact, focus and Escape passed',zoomCss200Overflow:zoomOverflow});
  await page.close();
  const noJs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
  await noJs.goto(base);await noJs.locator('.vehicle-link').first().click();await noJs.waitForURL('**/vehiculo.html?estado=disponible');
  results.push({noJs:'Catalog links open standalone detail without JavaScript'});await noJs.close();
  await writeFile(resolve(out,'results.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify({passed:true,checks:results.length,out}));
} finally {await browser.close();}
