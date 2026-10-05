import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire('C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const out='artifacts/catalog-cursors/global';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const report={url:'http://127.0.0.1:9480/global.html',checks:[],timings:{}};
function check(name,value){assert(value,name);report.checks.push(name);}
try{
 const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>requests.push(request.url()));
 await page.goto(report.url,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 check('same three DEMO cards, all interaction B',await page.locator('.vehicle.variant-b').count()===3);
 check('one global engine and companion layer',await page.locator('.signature').count()===1&&await page.locator('.dock').count()===1);
 for(const mode of ['A','B','C','D']){
  await page.locator('[data-system='+mode+']').click();
  for(const [selector,expected,tone] of [['.mini-hero','hero','photo'],['.hero-caption-demo .mini-button','button','photo'],['.vehicle-link','card','photo'],['.gallery-picture','gallery','photo'],['.mini-footer .brand','link','dark']]){
   const locator=page.locator(selector).first();await locator.scrollIntoViewIfNeeded();await locator.hover({position:{x:20,y:20}});await page.waitForTimeout(100);
   const state=await page.evaluate(()=>window.__GLOBAL_CURSOR__.state);
   check(`${mode}: ${selector} context`,state.active&&state.mode===mode&&state.context===expected&&state.tone===tone);
   if(expected==='card'){
    const box=await locator.boundingBox();await page.mouse.move(box.x+box.width*.58,box.y+90,{steps:18});
    await page.screenshot({path:`${out}/${mode}-card.png`});
    await page.screenshot({path:`${out}/${mode}-cursor-detail.png`,clip:{x:Math.max(0,box.x+box.width*.58-65),y:Math.max(0,box.y+30),width:130,height:130}});
   }
  }
  // On a light heading the same system must recover the light tone.
  await page.locator('.mini-catalog h2').hover();check(`${mode}: adapts to light surface`,await page.evaluate(()=>window.__GLOBAL_CURSOR__.state.tone==='light'));
  await page.waitForTimeout(1200);check(`${mode}: RAF stops at rest`,await page.evaluate(()=>window.__GLOBAL_CURSOR__.state.running===0));
 }
 report.timings=await page.evaluate(()=>Object.fromEntries(Object.entries(window.__GLOBAL_CURSOR__.stats).map(([key,values])=>{const v=[...values].sort((a,b)=>a-b);return[key,{callbacks:v.length,p50_ms:v[Math.floor(v.length*.5)]||0,p95_ms:v[Math.floor(v.length*.95)]||0,max_ms:v.at(-1)||0}]})));
 await page.locator('.mini-story [data-native-cursor]').hover();check('native cursor restored for selectable body text',await page.evaluate(()=>!document.body.classList.contains('has-signature')));
 await page.locator('#global-enabled').uncheck();await page.locator('.mini-catalog h2').hover();check('manual off restores native cursor',await page.evaluate(()=>!document.body.classList.contains('has-signature')));
 await page.locator('#global-enabled').check();await page.locator('.mini-catalog h2').hover();check('manual on restores selected system',await page.evaluate(()=>window.__GLOBAL_CURSOR__.state.active));
 await page.locator('#gallery-next').click();check('gallery next works',await page.locator('#gallery-counter').innerText()==='02 / 03');
 await page.locator('#gallery-prev').click();check('gallery previous works',await page.locator('#gallery-counter').innerText()==='01 / 03');
 await page.locator('[data-photo="2"]').click();check('portrait gallery works',await page.locator('#study-photo').getAttribute('src').then(src=>src.includes('683x1024')));
 await page.locator('#contact-demo').click();check('no fabricated WhatsApp',await page.locator('#pending-contact').isVisible());
 await page.keyboard.press('Tab');check('keyboard focus visible',await page.evaluate(()=>document.activeElement.matches(':focus-visible')));
 check('no extra libraries or 3D assets',!requests.some(url=>/three|\.glb|\.hdr|gsap/i.test(url)));
 check('no page errors',errors.length===0);check('desktop no overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/mini-web-desktop.png',fullPage:true});
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.mini-catalog h2').hover();check('reduced motion keeps native pointer',await page.evaluate(()=>!document.body.classList.contains('has-signature')));
 await context.close();
 for(const width of [375,390,430]){
  const mobile=await browser.newContext({viewport:{width,height:844},hasTouch:true,isMobile:true}),p=await mobile.newPage();
  await p.goto(report.url,{waitUntil:'networkidle'});await p.locator('[data-system=D]').tap();await p.mouse.move(50,180);
  check(`touch ${width}: native cursor only`,await p.evaluate(()=>!document.body.classList.contains('has-signature')));
  check(`touch ${width}: no overflow`,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await mobile.close();
 }
 const nojs=await browser.newContext({javaScriptEnabled:false}),p=await nojs.newPage();await p.goto(report.url);check('without JS native links/cards remain',await p.locator('.vehicle-link[href]').count()===3&&await p.locator('.signature').count()===0);await nojs.close();
 await writeFile(out+'/qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
