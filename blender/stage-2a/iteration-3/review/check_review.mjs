import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const require=createRequire('C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const url='http://127.0.0.1:9412/blender/stage-2a/iteration-3/review/';
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  const widths=[];
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:900});
    const state=await page.evaluate(async()=>{
      for(const img of document.images)img.loading='eager';
      await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));
      return {overflow:document.documentElement.scrollWidth>innerWidth,
        broken:[...document.images].filter(img=>!img.naturalWidth).map(img=>img.src)};
    });
    if(state.overflow||state.broken.length)throw Error(JSON.stringify({width,state}));
    widths.push({width,...state});
  }
  const video=await page.locator('video').first().evaluate(async v=>{
    v.preload='auto';v.load();
    await new Promise((resolve,reject)=>{
      if(v.readyState>=1)return resolve();
      v.addEventListener('loadedmetadata',resolve,{once:true});
      v.addEventListener('error',()=>reject(Error('video failed to load')),{once:true});
    });
    return {duration:v.duration,width:v.videoWidth,height:v.videoHeight};
  });
  if(Math.abs(video.duration-85/24)>.05)throw Error(JSON.stringify(video));
  await page.locator('video').first().evaluate(async v=>{v.muted=true;await v.play();});
  await page.waitForFunction(()=>document.querySelector('video').ended,null,{timeout:8000});
  const comparison=await page.locator('video').nth(1).evaluate(async v=>{
    v.preload='metadata';v.load();
    await new Promise(resolve=>v.readyState>=1?resolve():v.addEventListener('loadedmetadata',resolve,{once:true}));
    return v.duration;
  });
  if(comparison<4.75)throw Error(`Comparison video too short: ${comparison}`);
  if(errors.length)throw Error(errors.join('\n'));
  const result={widths,video,comparisonDuration:comparison,playedToEnd:true,errors};
  await writeFile(new URL('review-check.json',import.meta.url),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
}finally{await browser.close();}
