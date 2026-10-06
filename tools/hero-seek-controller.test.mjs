import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const file=process.argv[2]||'theme/rp-usados/src/scripts/hero-v2/seek-controller.js';
const {createSeekController}=await import(pathToFileURL(file));
let checks=0;
function fixture(){
 class Video extends EventTarget{
  readyState=0;duration=NaN;seeking=false;dataset={src:'qa.mp4'};time=0;callbacks=new Map();next=0;assignments=[];
  get currentTime(){return this.time;}
  set currentTime(t){this.assignments.push({time:t,observing:this.callbacks.size>0});this.time=t;this.seeking=true;this.readyState=1;}
  requestVideoFrameCallback(fn){this.callbacks.set(++this.next,fn);return this.next;}
  cancelVideoFrameCallback(id){this.callbacks.delete(id);}
  load(){} pause(){} removeAttribute(){}
  data(){this.readyState=4;this.duration=3;this.dispatchEvent(new Event('loadeddata'));}
  frame(time){const callbacks=[...this.callbacks.values()];this.callbacks.clear();for(const fn of callbacks)fn(performance.now(),{mediaTime:time,presentedFrames:1,processingDuration:0});}
  finish(){this.seeking=false;this.readyState=4;this.dispatchEvent(new Event('seeked'));}
 }
 const v=new Video(),attrs=new Set(),poster={setAttribute:k=>attrs.add(k),removeAttribute:k=>attrs.delete(k)};
 const d={seeks:0,presentations:[],seekLatencies:[],state:'poster'};let allow=true;
 const ctl=createSeekController(v,poster,d,e=>{throw Error(e);},()=>allow);
 return{v,d,ctl,attrs,block:()=>allow=false,unblock:()=>allow=true};
}
for(const ordering of ['seeked-first','frame-first']){
 const f=fixture();f.ctl.setProgress(.56);f.v.data();
 assert.equal(f.v.assignments.length,0,'Restored seek must wait for initial compositor frame, not just loadeddata');checks++;
 f.v.frame(0);assert.equal(f.v.assignments.length,1);assert(f.v.assignments[0].observing,'Next callback registered before sending seek');checks+=2;
 f.ctl.setProgress(.73);f.ctl.setProgress(.35);assert.equal(f.v.assignments.length,1,'Only one outstanding seek');checks++;
 const oldFrame=80/48;
 if(ordering==='seeked-first'){f.v.finish();f.v.frame(oldFrame);}else{f.v.frame(oldFrame);f.v.finish();}
 assert.equal(f.v.assignments.length,2,'Latest target sent after seek + presentation in either order');checks++;
 assert(!f.attrs.has('data-presented'),'Stale frame never removes poster');checks++;
 f.v.finish();f.v.frame(50/48);assert(f.attrs.has('data-presented'));checks++;
 f.ctl.dispose();assert.equal(f.v.callbacks.size,0);checks++;
}
{
 const f=fixture();f.ctl.setProgress(0);f.ctl.suspend(true);f.v.data();f.v.frame(0);
 assert(!f.attrs.has('data-presented'));f.ctl.suspend(false);assert(f.attrs.has('data-presented'),'Visible resume reuses confirmed frame without requiring playback');checks+=2;f.ctl.dispose();
}
{
 const f=fixture();f.block();f.v.data();f.v.frame(0);assert(!f.attrs.has('data-presented'));f.unblock();f.ctl.reveal();assert(f.attrs.has('data-presented'));checks+=2;f.ctl.dispose();
}
{
 const f=fixture();f.ctl.setProgress(1);f.v.data();f.v.frame(0);
 assert.equal(f.d.targetTime,143/48,'Full progress requests the last source frame, with no contextual hold');checks++;
 f.v.finish();f.v.frame(143/48);assert(f.attrs.has('data-presented'),'Last frame can replace the poster after restoration');checks++;
 f.ctl.setProgress(0);f.v.finish();f.v.frame(0);
 assert.equal(f.d.presentedTime,0,'Full reverse scroll returns to the first frame');checks++;
 f.ctl.dispose();
}
console.log(`${checks} controller ordering assertions passed`);
