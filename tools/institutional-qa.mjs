import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire('C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright'),out=process.env.RP_QA_OUT || 'artifacts/institutional',base=process.env.RP_DEMO_URL || 'http://127.0.0.1:9470/';
await mkdir(out,{recursive:true});
const report={base,checks:[],profiles:[]},check=(name,value)=>{assert(value,name);report.checks.push(name);};
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const [width,height] of [[1920,1080],[1440,1000],[1280,900],[768,1024],[430,932],[390,844],[375,812]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:width<900,hasTouch:width<900,deviceScaleFactor:1}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));await page.goto(base,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);
  const about=page.locator('#nosotros'),finance=page.locator('#opciones'),image=about.locator('img');
  async function captureSection(section,name){
   // Isolated component evidence excludes fixed overlays, only during capture.
   const overlay=await page.addStyleTag({content:'.v2-header,.skip{visibility:hidden!important}'});
   await section.screenshot({path:`${out}/${name}-${width}.png`});await overlay.evaluate(el=>el.remove());
  }
  await about.scrollIntoViewIfNeeded();await image.evaluate(el=>el.decode());
  const media=await image.evaluate(el=>({src:el.currentSrc,w:el.naturalWidth,h:el.naturalHeight,fit:getComputedStyle(el).objectFit}));
  // Browser natural dimensions can be density-corrected/rounded by srcset.
  check(`${width}: new owner photo, full portrait, lazy`,media.src.includes('local-institucional-')&&Math.abs(media.h/media.w-4/3)<.005&&media.fit==='contain'&&await image.getAttribute('loading')==='lazy');
  const order=await about.evaluate(el=>{const h=el.querySelector('.heritage-heading').getBoundingClientRect(),m=el.querySelector('.heritage-visual').getBoundingClientRect(),c=el.querySelector('.heritage-copy').getBoundingClientRect();return{h:h.y,m:m.y,c:c.y,cols:getComputedStyle(el.querySelector('.heritage-grid')).gridTemplateColumns};});
  check(`${width}: deliberate mobile/photo layout`,width<=760?order.h<order.m&&order.m<order.c:order.cols.split(' ').length===2);
  check(`${width}: 1990 only in prose`,(await about.locator('p.heritage-lead').innerText()).includes('desde 1990')&&!(await about.locator('.label').innerText()).includes('1990')&&!(await about.locator('h2').innerText()).includes('1990'));
  check(`${width}: no section overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&[...document.querySelectorAll('#nosotros *,#opciones *')].every(el=>{const r=el.getBoundingClientRect();return r.width===0||(r.left>=-.5&&r.right<=innerWidth+.5);})));
  await captureSection(about,'nosotros');
  await finance.scrollIntoViewIfNeeded();
  check(`${width}: explicit case/confirmation and WhatsApp`,(await finance.innerText()).includes('dependen de la unidad')&&(await finance.innerText()).includes('evaluación y confirmación de RP Usados')&&await finance.locator('.action-whatsapp').count()===1);
  check(`${width}: no invented terms`,!/\b(tasa|banco|garantizada|\d+ cuotas|\d+%)\b/i.test(await finance.innerText()));
  check(`${width}: same approved pending-contact fallback`,await finance.locator('.action-whatsapp').getAttribute('href')==='#contacto-pendiente');
  await captureSection(finance,'financiacion');
  check(`${width}: no errors`,errors.length===0);report.profiles.push({width,height,media,order});
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage();
 await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('#opciones .action').focus();await page.keyboard.press('Enter');
 check('keyboard CTA reaches existing pending contact',await page.evaluate(()=>document.activeElement.id==='contacto-pendiente'));
 check('reduced motion leaves image/copy present',await page.locator('#nosotros img').count()===1&&await page.locator('#opciones .service').count()===2);
 await page.evaluate(()=>document.documentElement.style.zoom='2');await page.locator('#nosotros').scrollIntoViewIfNeeded();
 check('200% zoom without horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await context.close();
 await writeFile(out+'/qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.checks.length,profiles:report.profiles},null,2));
}finally{await browser.close();}
