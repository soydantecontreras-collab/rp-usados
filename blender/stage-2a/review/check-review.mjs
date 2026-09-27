// Validate the local review artifact, not the production website.
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const require=createRequire('C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const base='http://127.0.0.1:9412/blender/stage-2a/review/';
const results=[];
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});
  for(const option of ['A','B','C']){
    await page.locator(`[data-view=${option}]`).click();
    await page.locator('#view').evaluate(img=>img.decode());
    results.push({option,src:await page.locator('#view').getAttribute('src'),pressed:await page.locator(`[data-view=${option}]`).getAttribute('aria-pressed')});
  }
  await page.locator('[data-view=A]').click();
  const media=await page.locator('video').evaluate(async v=>{
    v.preload='auto';
    await new Promise((resolve,reject)=>{if(v.readyState>=1)return resolve();v.addEventListener('loadedmetadata',resolve,{once:true});v.addEventListener('error',()=>reject(Error('Video failed to load')),{once:true});});
    return {duration:v.duration,width:v.videoWidth,height:v.videoHeight,error:v.error?.message};
  });
  if(media.duration<12||media.width!==960)throw Error(JSON.stringify(media));
  await page.locator('video').evaluate(async v=>{v.muted=true;v.currentTime=0;await v.play();});
  await page.waitForFunction(()=>document.querySelector('video').ended,null,{timeout:20000});
  media.completedPlayback=true;
  for(const seconds of [0.05,6,8.5,11.95]){
    await page.locator('video').evaluate(async(v,time)=>{
      v.currentTime=time;
      await new Promise(resolve=>v.addEventListener('seeked',resolve,{once:true}));
    },seconds);
    await page.waitForFunction(t=>Math.abs(document.querySelector('video').currentTime-t)<.1,seconds,{timeout:10000});
    await page.locator('video').evaluate(v=>v.controls=false);
    await page.locator('video').screenshot({path:new URL(`video-check-${seconds}.png`,import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
  }
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:1000});
    const state=await page.evaluate(async()=>{
      for(const i of document.images)i.loading='eager';
      await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));
      return {overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src)};
    });
    if(state.overflow||state.broken.length)throw Error(JSON.stringify(state));
    results.push({width,...state});
  }
  if(errors.length)throw Error(errors.join('\n'));
  await writeFile(new URL('review-check.json',import.meta.url),JSON.stringify({results,media,errors},null,2));
  console.log(JSON.stringify({results,media,errors}));
}finally{await browser.close();}
