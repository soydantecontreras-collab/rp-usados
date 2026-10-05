import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const require = createRequire(process.env.RP_PLAYWRIGHT_PACKAGE || 'C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = require('playwright');
const base = process.env.RP_DEMO_URL || 'http://127.0.0.1:9470';
const out = process.env.RP_QA_OUT || 'artifacts/vehicle-experience';
await mkdir(out, {recursive:true});
const browser = await chromium.launch({channel:'msedge',headless:true});
const report = {base,profiles:[],checks:[]};
const check = (label,value) => {assert(value,label);report.checks.push(label);};
const imageRequests = requests => [...new Set(requests.filter(url=>url.includes('/wp-content/uploads/')))].map(url=>new URL(url).pathname);
try {
  for(const profile of [{name:'desktop',width:1440,height:900,mobile:false},{name:'laptop-1280',width:1280,height:800,mobile:false},{name:'tablet-768',width:768,height:1024,mobile:true},{name:'mobile-375',width:375,height:812,mobile:true},{name:'mobile-390',width:390,height:844,mobile:true},{name:'mobile-430',width:430,height:932,mobile:true}]){
    const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},isMobile:profile.mobile,hasTouch:profile.mobile,deviceScaleFactor:1});
    const page=await context.newPage(),requests=[],errors=[];
    page.on('request',request=>requests.push(request.url()));page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base+'/vehiculos/',{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForTimeout(450);
    const catalogInitial=imageRequests(requests);
    check(`${profile.name}: 9 price-free cards`,await page.locator('.vehicle').count()===9&&await page.locator('.vehicle-arrow').count()===0&&await page.locator('.vehicle-price').count()===0);
    check(`${profile.name}: only cover image URLs in archive`,catalogInitial.every(path=>!path.includes('vento-rear')&&!path.includes('vento-front')));
    await page.screenshot({path:`${out}/catalog-${profile.name}.png`});
    if(!profile.mobile){
      await page.locator('.vehicle-link').first().hover({position:{x:160,y:120}});
      await page.waitForTimeout(100);
      check('desktop: rejected contextual cursor disabled',await page.locator('.card-cursor').count()===0);
      await page.screenshot({path:`${out}/catalog-hover-desktop.png`});
      await page.mouse.move(2,2);
      check('desktop: ordinary cursor outside card',await page.locator('.card-cursor').count()===0);
    }else check(`${profile.name}: no custom cursor`,await page.locator('.card-cursor').count()===0);
    for (const image of await page.locator('.vehicle-photo').all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(element=>element.decode());
    }
    const catalogScrolled=imageRequests(requests);
    check(`${profile.name}: images work after scrolling`,await page.locator('.vehicle-photo').evaluateAll(images=>images.every(image=>image.complete&&image.naturalWidth>0)));
    requests.length=0;await page.goto(base+'/vehiculos/demo-vento/',{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>document.fonts.ready);
    await page.locator('.gallery-photo').first().evaluate(image=>image.decode());await page.waitForTimeout(450);
    const detailInitial=imageRequests(requests);
    check(`${profile.name}: initial detail and four gallery photos`,await page.locator('.gallery-slide').count()===4&&await page.locator('.unit-heading h1').isVisible());
    check(`${profile.name}: price only in detail`,(await page.locator('.unit-price .vehicle-price').innerText()).includes('TST'));
    check(`${profile.name}: specific WhatsApp copy`,(await page.locator('.unit-panel .action-whatsapp').innerText()).includes('Vento'));
    check(`${profile.name}: no fake recipient`,await page.locator('a[href^="https://wa.me/"]').count()===0);
    check(`${profile.name}: no overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
    await page.screenshot({path:`${out}/detail-${profile.name}.png`});
    if(!profile.mobile){
      await page.locator('.unit-panel .action-whatsapp').hover();
      await page.waitForTimeout(260);
      await page.screenshot({path:`${out}/detail-button-hover-desktop.png`});
    }
    await page.screenshot({path:`${out}/detail-full-${profile.name}.png`,fullPage:true});
    await page.locator('[data-next]').click();await page.waitForFunction(()=>document.querySelector('[data-position]').textContent.startsWith('02'));
    await page.locator('[data-image="3"]').click();await page.waitForFunction(()=>document.querySelector('[data-position]').textContent.startsWith('04'));
    const detailBrowsed=imageRequests(requests);
    await page.locator('.gallery-slide').last().locator('.gallery-open').click();
    check(`${profile.name}: fullscreen gallery`,await page.locator('.gallery-lightbox').evaluate(dialog=>dialog.open));
    await page.keyboard.press('Escape');check(`${profile.name}: lightbox closes with Escape`,await page.locator('.gallery-lightbox').evaluate(dialog=>!dialog.open));
    check(`${profile.name}: no JavaScript errors`,errors.length===0);
    await page.keyboard.press('Tab');
    await page.locator('.gallery-choices a').first().focus();
    check(`${profile.name}: keyboard focus visible on gallery`,await page.locator('.gallery-choices a').first().evaluate(link=>link===document.activeElement&&getComputedStyle(link).outlineStyle!=='none'));
    report.profiles.push({...profile,catalogInitial,catalogScrolled,detailInitial,detailBrowsed,errors});
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const reduced=await context.newPage();await reduced.goto(base+'/vehiculos/');
  check('reduced motion: no custom cursor',await reduced.locator('.card-cursor').count()===0);
  await context.close();
  const noJsContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,javaScriptEnabled:false});
  const noJs=await noJsContext.newPage();await noJs.goto(base+'/vehiculos/demo-vento/');
  check('no JS: gallery links remain usable',await noJs.locator('.gallery-slide').count()===4&&await noJs.locator('.gallery-open[href$=".jpg"]').count()>=3);
  check('no JS: essential detail visible',await noJs.locator('.unit-price').isVisible()&&await noJs.locator('.full-specs').isVisible());
  await noJsContext.close();
  const variedContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const varied=await variedContext.newPage();
  await varied.goto(base+'/vehiculos/demo-hilux/');
  check('portrait/reserved: image and state fit',await varied.locator('.gallery-photo').first().evaluate(image=>image.complete&&image.naturalWidth>0)&&await varied.locator('.unit-heading .reserved').isVisible()&&await varied.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
  await varied.screenshot({path:`${out}/detail-portrait-mobile.png`});
  await varied.goto(base+'/vehiculos/demo-duster/');
  check('missing optional facts: no empty rows',await varied.locator('.unit-facts>div').count()===1&&await varied.locator('.full-specs>div').count()===3);
  await variedContext.close();
}finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify({passed:report.checks.length,counts:report.profiles.map(p=>({name:p.name,catalogInitial:p.catalogInitial.length,catalogScrolled:p.catalogScrolled.length,detailInitial:p.detailInitial.length,detailBrowsed:p.detailBrowsed.length}))}));
