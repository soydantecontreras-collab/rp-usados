import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire('C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright'),browser=await chromium.launch({channel:'msedge',headless:true,args:['--autoplay-policy=document-user-activation-required']});
const OUT=process.env.RP_HERO_QA_OUT||'artifacts/hero-reload',HOME=process.env.RP_HERO_QA_URL||'http://127.0.0.1:9400/';await mkdir(OUT,{recursive:true});
const repeat=Number(process.env.RP_RELOAD_REPEAT||15);
const report={browser:browser.version(),repeat,reloads:[],failures:[],conditions:'Mobile emulation; real MP4 and compositor. CPU 4x, autoplay restricted, play() rejects if called. No network routing in cache tests.'};
const pose=async(p,value)=>{
 await p.evaluate(value=>{const h=document.querySelector('.hero-track'),s=document.querySelector('.hero-stage'),offset=document.querySelector('header').offsetHeight;scrollTo({top:h.offsetTop-offset+(h.offsetHeight-s.offsetHeight)*value,behavior:'instant'});},value);
 await p.waitForFunction(v=>Math.abs(__RP_V2__.progress-v)<.015,value);
};
const ready=p=>p.waitForFunction(()=>window.__RP_V2__?.state==='ready'&&document.querySelector('.hero-poster').hasAttribute('data-presented')&&!document.querySelector('video').seeking&&Math.abs(__RP_V2__.presentedTime-__RP_V2__.targetTime)<.013,null,{timeout:10000});
function instrumentation(){
 window.__QA_VIDEO__={events:[],frames:[],plays:0,errors:[]};
 const log=type=>{const v=document.querySelector('video');__QA_VIDEO__.events.push({at:performance.now(),type,readyState:v?.readyState,time:v?.currentTime,src:v?.currentSrc,scrollY,visibility:document.visibilityState});};
 for(const e of ['loadstart','loadedmetadata','loadeddata','canplay','seeking','seeked','error'])document.addEventListener(e,ev=>{if(ev.target instanceof HTMLVideoElement)log(e);},true);
 for(const e of ['pageshow','pagehide'])addEventListener(e,ev=>{log(e);__QA_VIDEO__.events.at(-1).persisted=ev.persisted;});
 document.addEventListener('visibilitychange',()=>log('visibilitychange'));
 const frame=HTMLVideoElement.prototype.requestVideoFrameCallback;
 HTMLVideoElement.prototype.requestVideoFrameCallback=function(fn){return frame.call(this,(now,meta)=>{__QA_VIDEO__.frames.push({at:performance.now(),time:meta.mediaTime});fn(now,meta);});};
 HTMLMediaElement.prototype.play=function(){__QA_VIDEO__.plays++;return Promise.reject(new DOMException('Autoplay blocked by QA','NotAllowedError'));};
 addEventListener('unhandledrejection',e=>__QA_VIDEO__.errors.push(String(e.reason)));
}
try{
 for(const width of [375,390,430]){
  const context=await browser.newContext({viewport:{width,height:900},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  await context.addInitScript(instrumentation);const p=await context.newPage(),cdp=await context.newCDPSession(p);
  await cdp.send('Network.enable');await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  let videoResponses=[];cdp.on('Network.responseReceived',e=>{if(e.response.url.includes('.mp4'))videoResponses.push({url:e.response.url,status:e.response.status,fromDiskCache:e.response.fromDiskCache,fromServiceWorker:e.response.fromServiceWorker});});
  await p.goto(HOME);await ready(p);
  for(const cache of ['warm','cold']){
   await cdp.send('Network.setCacheDisabled',{cacheDisabled:cache==='cold'});
   for(const position of [0,.56])for(let i=0;i<repeat;i++){
    await pose(p,position);await ready(p);
    if(cache==='cold')await cdp.send('Network.clearBrowserCache');
    videoResponses=[];const started=performance.now();await p.reload();
    try{
     await ready(p);const preparedMs=performance.now()-started;
     const data=await p.evaluate(()=>({progress:__RP_V2__.progress,presented:__RP_V2__.presentedTime,target:__RP_V2__.targetTime,events:__QA_VIDEO__.events,frames:__QA_VIDEO__.frames,plays:__QA_VIDEO__.plays,errors:__QA_VIDEO__.errors,source:document.querySelector('video').currentSrc,readyState:document.querySelector('video').readyState}));
     assert(Math.abs(data.progress-position)<.015,'restored progress');assert(data.source.includes('hero-mobile-portrait-crf18.mp4'),'mobile source');
     assert(data.plays===0&&data.errors.length===0,'no autoplay or rejected promises');
     const seek=data.events.find(e=>e.type==='seeking');assert(!seek||data.frames[0]?.at<=seek.at,'initial presentation before first seek');
     assert(videoResponses.every(v=>v.url.includes('hero-mobile-portrait-crf18.mp4')),'only mobile downloaded');
     for(const value of [.18,.73,.35,0]){await pose(p,value);await ready(p);assert(Math.abs(await p.evaluate(()=>__RP_V2__.progress)-value)<.015,'forward/reverse progress');}
     // Coalesce a burst into the last target, without queuing obsolete seeks.
     await p.evaluate(()=>{const h=document.querySelector('.hero-track'),s=document.querySelector('.hero-stage'),offset=document.querySelector('header').offsetHeight;for(const v of [.84,.13,.62,.22])scrollTo({top:h.offsetTop-offset+(h.offsetHeight-s.offsetHeight)*v,behavior:'instant'});});
     await p.waitForFunction(()=>Math.abs(__RP_V2__.progress-.22)<.015);await ready(p);
     report.reloads.push({width,cache,position,iteration:i+1,preparedMs,readyState:data.readyState,firstFrameTime:data.frames[0]?.time,firstSeekAfterFrame:!seek||data.frames[0].at<=seek.at,videoResponses});
     console.log(`${report.reloads.length}: ${width} ${cache} p=${position} #${i+1} OK`);
    }catch(e){
     const snapshot=await p.evaluate(()=>({diagnostics:window.__RP_V2__,qa:window.__QA_VIDEO__,scrollY,video:{readyState:document.querySelector('video').readyState,currentTime:document.querySelector('video').currentTime,seeking:document.querySelector('video').seeking}}));
     report.failures.push({width,cache,position,i,error:String(e),snapshot});await p.screenshot({path:OUT+'/matrix-failure.png'});throw e;
    }
    await writeFile(OUT+'/reload-report.json',JSON.stringify(report,null,2));
   }
  }
  await context.close();
 }
}finally{await writeFile(OUT+'/reload-report.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify({reloads:report.reloads.length,failures:report.failures.length}));
