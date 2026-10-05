import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire('C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright'),sharp=require('sharp');
const base=process.env.RP_DEMO_URL || 'http://127.0.0.1:9470',out=process.env.RP_QA_OUT || 'artifacts/brand-cursors',source='theme/rp-usados/src/assets/cursors';
await mkdir(out,{recursive:true});
const report={url:base,checks:[],browsers:[],screenshots:'Actual page captures with the real cursor PNG composed at the tested hotspot. OS cursors are not captured by Playwright.'};
const check=(name,value)=>{assert(value,name);report.checks.push(name);};
const mediaRequest=url=>/\/(default|pointer)-[^/]+\.(cur|png)(?:\?|$)/.test(url);
const values=async locator=>locator.evaluate(el=>getComputedStyle(el).cursor);
for(const [name,hotspot] of [['default',[1,1]],['pointer',[6,2]]]){
 const buffer=await readFile(`${source}/${name}.cur`),png=await sharp(`${source}/${name}.png`).metadata();
 check(`${name}: 32x32 PNG and DIB CUR`,png.width===32&&png.height===32&&buffer.readUInt16LE(2)===2&&buffer[6]===32&&buffer[7]===32&&buffer.readInt32LE(26)===32&&buffer.readInt32LE(30)===64);
 check(`${name}: embedded hotspot matches CSS`,buffer.readUInt16LE(10)===hotspot[0]&&buffer.readUInt16LE(12)===hotspot[1]);
 const rgba=await sharp(`${source}/${name}.png`).ensureAlpha().raw().toBuffer();
 let x0=32,y0=32,x1=-1,y1=-1;
 for(let y=0;y<32;y++)for(let x=0;x<32;x++)if(rgba[(y*32+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 const visible=name==='default'?[12,19]:[18,24];
 check(`${name}: visible bounds equal measured Windows standard cursor`,x1-x0+1===visible[0]&&y1-y0+1===visible[1]);
}

async function capture(page,name,points){
 await page.screenshot({path:`${out}/${name}-page.png`});
 const overlays=[];
 for(const point of points)overlays.push({input:await readFile(`${source}/${point.type}.png`),left:Math.round(point.x-(point.type==='default'?1:6)),top:Math.round(point.y-(point.type==='default'?1:2))});
 await sharp(`${out}/${name}-page.png`).composite(overlays).png().toFile(`${out}/${name}-cursor-review.png`);
}
for(const channel of ['chrome','msedge']){
 const browser=await chromium.launch({channel,headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),requests=[],responses=[],errors=[];
  page.on('request',request=>{if(mediaRequest(request.url()))requests.push(request.url());});
  page.on('response',response=>{if(mediaRequest(response.url()))responses.push({url:response.url(),status:response.status()});});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);
  await page.mouse.move(40,220);await page.waitForTimeout(300);
  const body=await values(page.locator('body'));
  check(`${channel}: default CUR / PNG / auto with hotspot`,body.includes('.cur") 1 1')&&body.includes('.png") 1 1')&&body.endsWith('auto'));
  const hero=page.locator('.hero-track');check(`${channel}: hero inherits arrow`,await values(hero)===body);
  const cta=page.locator('.hero-track a').filter({hasText:'Ver vehículos'}).first();
  const hand=await values(cta);check(`${channel}: hero CTA hand hotspot and terminal pointer`,hand.includes('.cur") 6 2')&&hand.includes('.png") 6 2')&&hand.endsWith('pointer'));
  const buttonBox=await cta.boundingBox();
  if(channel==='msedge'){
   await cta.hover();await page.waitForTimeout(300);
   await capture(page,'hero-oscuro',[{type:'default',x:940,y:450},{type:'pointer',x:buttonBox.x+buttonBox.width*.5,y:buttonBox.y+buttonBox.height*.5}]);
  }
  await page.goto(base+'/vehiculos/',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);
  const card=page.locator('.vehicle-link').first();await card.hover();await page.waitForTimeout(320);
  check(`${channel}: complete card and its photo use hand`,(await values(card)).endsWith('pointer')&&(await values(card.locator('img'))).endsWith('pointer'));
  const transforms=await card.evaluate(el=>({photo:getComputedStyle(el.querySelector('.vehicle-photo')).transform,info:getComputedStyle(el.querySelector('.vehicle-info')).transform}));
  check(`${channel}: card B remains intact`,transforms.info.includes('-8')&&transforms.photo!=='none');
  check(`${channel}: no tracking cursor layers`,await page.locator('.card-cursor,.signature,.dock').count()===0);
  if(channel==='msedge'){
   const box=await card.boundingBox();
   await capture(page,'catalogo-claro',[{type:'default',x:1100,y:210},{type:'pointer',x:box.x+box.width*.6,y:box.y+90}]);
  }
  await page.goto(base+'/vehiculos/demo-vento/',{waitUntil:'domcontentloaded'});
  check(`${channel}: gallery controls use hand`,(await values(page.locator('.gallery-open').first())).endsWith('pointer'));
  // Browser-native special states on ephemeral controls; no fixture is persisted.
  await page.evaluate(()=>{const group=document.createElement('div');group.id='cursor-qa-native-controls';group.innerHTML='<input aria-label="QA text"><button disabled>QA disabled</button>';document.body.append(group);});
  check(`${channel}: text entry native`,await values(page.locator('#cursor-qa-native-controls input'))==='text');
  check(`${channel}: disabled native`,await values(page.locator('#cursor-qa-native-controls button'))==='not-allowed');
  await page.locator('#cursor-qa-native-controls').evaluate(el=>el.remove());
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('.contact').scrollIntoViewIfNeeded();
  const redButton=page.locator('.contact .action').first();await redButton.hover();await page.waitForTimeout(50);
  check(`${channel}: footer remains arrow`,(await values(page.locator('footer'))).endsWith('auto'));
  check(`${channel}: contact action remains hand`,(await values(redButton)).endsWith('pointer'));
  if(channel==='msedge'){
   const box=await redButton.boundingBox();await capture(page,'footer-rojo',[{type:'default',x:200,y:800},{type:'pointer',x:box.x+box.width*.5,y:box.y+box.height*.5}]);
  }
  await page.keyboard.press('Tab');check(`${channel}: keyboard focus remains visible`,await page.evaluate(()=>document.activeElement.matches(':focus-visible')));
  check(`${channel}: cursor files load successfully`,responses.length>0&&responses.every(response=>response.status===200));
  check(`${channel}: no script errors`,errors.length===0);
  report.browsers.push({channel,version:browser.version(),cursorResources:[...new Set(requests)],errors});await context.close();

  const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:1440,height:900}}),nojs=await noJS.newPage();
  await nojs.goto(base+'/vehiculos/');check(`${channel}: cursors and links work without JS`,(await values(nojs.locator('.vehicle-link').first())).endsWith('pointer')&&(await values(nojs.locator('body'))).endsWith('auto'));
  await noJS.close();
  const failed=await browser.newContext(),f=await failed.newPage();await f.route(/\.(cur|png)$/,route=>mediaRequest(route.request().url())?route.abort():route.continue());
  await f.goto(base+'/vehiculos/');await f.locator('.vehicle-link').first().hover();
  check(`${channel}: missing assets preserve terminal auto/pointer, never none`,(await values(f.locator('body'))).endsWith('auto')&&(await values(f.locator('.vehicle-link').first())).endsWith('pointer')&&await f.locator('.card-cursor,.signature').count()===0);await failed.close();

  const pngFallback=await browser.newContext(),p=await pngFallback.newPage(),loaded=[];
  await p.route(/\.cur$/,route=>route.abort());p.on('response',response=>{if(mediaRequest(response.url()))loaded.push(response);});
  await p.goto(base+'/vehiculos/');await p.locator('.vehicle-link').first().hover();
  check(`${channel}: PNG alternative loads when CUR fails`,loaded.some(response=>response.url().endsWith('.png')&&response.status()===200));await pngFallback.close();
  for(const width of [375,390,430]){
   const mobile=await browser.newContext({viewport:{width,height:844},hasTouch:true,isMobile:true}),m=await mobile.newPage(),cursorRequests=[];
   m.on('request',request=>{if(mediaRequest(request.url()))cursorRequests.push(request.url());});
   await m.goto(base+'/vehiculos/',{waitUntil:'load'});await m.locator('.vehicle-link').first().tap({trial:true});
   check(`${channel} touch ${width}: no cursor requests`,cursorRequests.length===0);
   check(`${channel} touch ${width}: no cursor URLs applied`,!(await values(m.locator('body'))).includes('url(')&&!(await values(m.locator('.vehicle-link').first())).includes('url('));await mobile.close();
  }
 }finally{await browser.close();}
}
await writeFile(`${out}/qa.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.checks.length,browsers:report.browsers},null,2));
