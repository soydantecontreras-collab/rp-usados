import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const require=createRequire('C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:9412/blender/visual-production-v001/review/');
await page.waitForFunction(()=>document.querySelector('video').readyState>=1,{timeout:30000});
const meta=await page.locator('video').evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight}));
if(Math.abs(meta.duration-85/24)>.05)throw new Error('Duration changed: '+meta.duration);
for(let i=0;i<6;i++){
 await page.locator(`[data-view="${i}"]`).click();
 await page.waitForFunction(()=>{const im=document.querySelector('#frame');return im.complete&&im.naturalWidth>0});
}
await page.locator('[data-view="0"]').click();
await page.locator('video').evaluate(v=>{v.currentTime=2.5});
await page.waitForFunction(()=>!document.querySelector('video').seeking);
await page.screenshot({path:new URL('review-desktop.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1'),fullPage:true});
await page.setViewportSize({width:390,height:844});
const mobile=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
if(mobile.scrollWidth>mobile.width)throw new Error('Horizontal overflow');
await page.screenshot({path:new URL('review-mobile.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1'),fullPage:true});
writeFileSync(new URL('review-check.json',import.meta.url),JSON.stringify({meta,mobile,errors,allFramesLoaded:true,videoSeek:true},null,2));
await browser.close();
console.log(JSON.stringify({meta,mobile,errors,allFramesLoaded:true,videoSeek:true}));
