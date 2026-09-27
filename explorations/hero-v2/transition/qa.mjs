import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire('C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const OUT=new URL('../qa/transition/',import.meta.url); await mkdir(OUT,{recursive:true});
const BASE='http://127.0.0.1:9420/hero-v2/transition/';
const report={browser:await browser.version(),checks:[],profiles:[],limitations:['Safari/iPhone not available; mobile checks use Chromium emulation.']};
function check(name,value){assert(value,name);report.checks.push({name,passed:true});}
async function pose(page,p){
  await page.evaluate(p=>scrollTo(0,(document.querySelector('.hero-track').offsetHeight-document.querySelector('.hero-stage').offsetHeight)*p),p);
  await page.waitForFunction(p=>Math.abs(__RP_V2__.progress-p)<.003 && !document.querySelector('video').seeking && Math.abs(__RP_V2__.presentedTime-__RP_V2__.targetTime)<.013,p);
}
async function shot(page,name){await page.screenshot({path:fileURLToPath(new URL(name+'.png',OUT))});}
try {
  for(const [variant,path] of [['subtle',''],['pronounced','pronounced/']]){
    const ctx=await browser.newContext({viewport:{width:1440,height:900}}); const page=await ctx.newPage();
    const requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
    await page.goto(BASE+path);await page.waitForFunction(()=>__RP_V2__?.state==='ready');
    await shot(page,variant+'-initial');
    check(variant+': dark 64px header',await page.locator('header').evaluate(x=>x.offsetHeight===64&&getComputedStyle(x).backgroundColor==='rgb(8, 8, 9)'));
    check(variant+': correct A derivative, paused 3s',await page.locator('video').evaluate(v=>v.currentSrc.endsWith('hero-fast-dark-doors.mp4')&&v.paused&&v.duration===3));
    const poster=await page.evaluate(async()=>{
      const v=document.querySelector('video'),im=document.querySelector('.hero-poster');await im.decode();
      const c=document.createElement('canvas');c.width=1600;c.height=900;const x=c.getContext('2d',{willReadFrequently:true});
      x.drawImage(v,0,0);const a=x.getImageData(0,0,1600,900).data;x.drawImage(im,0,0);const b=x.getImageData(0,0,1600,900).data;
      let total=0,n=0;for(let i=0;i<a.length;i+=64)for(let k=0;k<3;k++){total+=Math.abs(a[i+k]-b[i+k]);n++;}return total/n;
    });check(variant+': matched poster pipeline',poster<3);
    for(const p of [.2,.3,.4,.56,.7,.86,.98]){await pose(page,p);await shot(page,variant+'-p'+p);}
    await pose(page,.7);
    const aperture=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1600;c.height=900;const x=c.getContext('2d');x.drawImage(document.querySelector('video'),0,0);return Array.from(x.getImageData(780,470,1,1).data).slice(0,3);});
    check(variant+': interior black in encoded media',Math.max(...aperture)<=12);
    await pose(page,.23);check(variant+': reverse seeks resolve',true);
    await pose(page,.98);await page.reload();
    await page.waitForFunction(()=>__RP_V2__?.progress>.97);
    check(variant+': restored end remains dark',await page.locator('.hero-visual').evaluate(x=>Number(getComputedStyle(x).opacity)<.01));
    await shot(page,variant+'-refresh-end');
    await page.evaluate(()=>{const r=document.querySelector('.hero-track'),s=document.querySelector('.hero-stage');scrollTo(0,r.offsetHeight-s.offsetHeight+600);});
    await page.waitForFunction(()=>document.querySelector('#catalogo').getBoundingClientRect().top<450);
    await shot(page,variant+'-curve');
    check(variant+': catalog follows dark bridge in flow',await page.evaluate(()=>document.querySelector('#catalogo').offsetTop>document.querySelector('.hero-track').offsetTop+document.querySelector('.hero-track').offsetHeight));
    await page.getByRole('navigation',{name:'Navegación principal'}).getByRole('link',{name:'Ver vehículos'}).click();
    check(variant+': skip focuses visible catalog',await page.evaluate(()=>document.activeElement.id==='catalogo'&&document.querySelector('.catalog-content').getBoundingClientRect().top>=62&&document.querySelector('.catalog-content').getBoundingClientRect().top<=66));
    await shot(page,variant+'-catalog');
    check(variant+': full clickable cards unchanged',await page.locator('.vehicle-link').count()===6);
    check(variant+': no V1 assets',!requests.some(x=>/\.glb|\.hdr|three[./-]/i.test(x)));
    check(variant+': no page errors / overflow',errors.length===0&&await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
    report.profiles.push({variant,posterMeanChannelDifference:poster,apertureRGB:aperture,preparedMs:await page.evaluate(()=>__RP_V2__.firstPresentedMs)});
    await ctx.close();
  }
  // Animated mobile is covered by qa-mobile.mjs; this suite checks static fallbacks.
  for(const [name,options] of [['mobile-reduced',{viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}],['reduced',{viewport:{width:1440,height:900},reducedMotion:'reduce'}],['no-js',{viewport:{width:1440,height:900},javaScriptEnabled:false}]]){
    const ctx=await browser.newContext(options),page=await ctx.newPage(),requests=[];page.on('request',r=>requests.push(r.url()));
    await page.goto(BASE);await shot(page,name);
    await page.getByRole('navigation',{name:'Navegación principal'}).getByRole('link',{name:'Ver vehículos'}).click();
    check(name+': no video download',!requests.some(x=>/\.mp4/.test(x)));
    check(name+': catalog reachable',await page.locator('.section-heading').isVisible());
    check(name+': no overflow',await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
    await shot(page,name+'-catalog');await ctx.close();
  }
} finally {await writeFile(new URL('report.json',OUT),JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report,null,2));
