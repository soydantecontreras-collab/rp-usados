import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const require=createRequire('C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const url='http://127.0.0.1:9412/blender/stage-2a/iteration-2/review/';
const findings=[];
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:1000});
    const state=await page.evaluate(async()=>{
      for(const img of document.images)img.loading='eager';
      await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));
      return {overflow:document.documentElement.scrollWidth>innerWidth,
        brokenImages:[...document.images].filter(img=>!img.naturalWidth).map(img=>img.src)};
    });
    findings.push({width,...state});
    if(state.overflow||state.brokenImages.length)throw Error(JSON.stringify(state));
  }
  const media=await page.locator('video').evaluateAll(async vids=>{
    await Promise.all(vids.map(v=>new Promise((resolve,reject)=>{
      v.preload='auto';v.load();
      if(v.readyState>=1)return resolve();
      v.addEventListener('loadedmetadata',resolve,{once:true});
      v.addEventListener('error',()=>reject(Error('Video failed to load')),{once:true});
    })));
    return vids.map(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight,error:v.error?.message}));
  });
  if(!(media[0].duration>4.7&&media[0].duration<5&&media[1].duration>12))throw Error(JSON.stringify(media));
  await page.locator('video').first().evaluate(async v=>{v.muted=true;v.currentTime=0;await v.play();});
  await page.waitForFunction(()=>document.querySelector('video').ended,null,{timeout:10000});
  for(const t of [0.05,1.5,3.2,4.6]){
    await page.locator('video').first().evaluate(async(v,time)=>{
      v.currentTime=time;
      await new Promise(resolve=>v.addEventListener('seeked',resolve,{once:true}));
      v.controls=false;
    },t);
    await page.waitForFunction(time=>Math.abs(document.querySelector('video').currentTime-time)<.1,t);
    await page.locator('video').first().screenshot({path:new URL(`video-${t}.png`,import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')});
  }
  if(errors.length)throw Error(errors.join('\n'));
  const report={findings,media,newVideoPlayedToEnd:true,errors};
  await writeFile(new URL('review-check.json',import.meta.url),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
}finally{await browser.close();}
