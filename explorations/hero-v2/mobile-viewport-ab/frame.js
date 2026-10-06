const root=document.documentElement, video=document.querySelector('.hero-video');
const box=selector=>{
  const r=document.querySelector(selector).getBoundingClientRect();
  return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height};
};
function measurements() {
  const wrapper=box('.hero-stage'),stage=box('.hero-scene'),plane=box('.hero-visual'),imageBox=box('.hero-video');
  const isB=getComputedStyle(video).objectFit==='cover',w=video.videoWidth||720,h=video.videoHeight||1280;
  const scale=(isB?Math.max:Math.min)(imageBox.width/w,imageBox.height/h);
  const image={left:imageBox.left+(imageBox.width-w*scale)/2,top:imageBox.top+(isB?0:(imageBox.height-h*scale)/2),width:w*scale,height:h*scale};
  image.right=image.left+image.width;image.bottom=image.top+image.height;
  const vv=visualViewport,viewport={width:innerWidth,height:vv?.height||innerHeight,top:vv?.offsetTop||0};
  const clip={left:Math.max(0,wrapper.left),right:Math.min(innerWidth,wrapper.right),top:Math.max(viewport.top,wrapper.top),bottom:Math.min(viewport.top+viewport.height,wrapper.bottom)};
  const visibleImage={left:Math.max(image.left,clip.left),right:Math.min(image.right,clip.right),top:Math.max(image.top,clip.top),bottom:Math.min(image.bottom,clip.bottom)};
  const source={left:(visibleImage.left-image.left)/scale,right:(visibleImage.right-image.left)/scale,top:(visibleImage.top-image.top)/scale,bottom:(visibleImage.bottom-image.top)/scale};
  const diagnostics=window.__RP_V2__||{},time=diagnostics.presentedTime||0;
  return {variant:root.dataset.abVariant,effectiveFit:isB?'cover':'contain',mode:root.dataset.abMode,state:diagnostics.state||'poster',maximumViewport:parseFloat(root.style.getPropertyValue('--ab-maximum-viewport')),viewport,scrollY,progress:diagnostics.progress||0,frame:Math.round(time*48)+1,time,duration:video.duration,sourceUrl:video.currentSrc,wrapper,stage,plane,image,imageBox,visibleImage,cta:box('.hero-caption .action'),title:box('.hero-caption h1'),copy:box('.hero-caption p'),scale,source,
    crop:{horizontal:(w-(source.right-source.left))/w,top:source.top/h,bottom:(h-source.bottom)/h},
    blackBelowPlane:Math.max(0,clip.bottom-Math.max(clip.top,plane.bottom)),blackBelowImage:Math.max(0,clip.bottom-Math.max(clip.top,image.bottom))};
}
let pending=0;
function report() {
  if(pending)return;
  pending=requestAnimationFrame(()=>{
    pending=0;const metrics=measurements();window.__HERO_AB__=metrics;
    if(parent!==window)parent.postMessage({type:'hero-ab/metrics',metrics},location.origin);
  });
}
addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='hero-ab/variant')return;
  root.dataset.abVariant=event.data.variant==='B'?'B':'A';report();
});
for(const name of ['resize','scroll','pageshow'])addEventListener(name,report,{passive:true});
for(const name of ['loadeddata','seeked','error'])video.addEventListener(name,report);
// The controller may reveal after this observer's compositor callback. Read again
// when its poster gate actually changes, without altering the controller or timing.
new MutationObserver(report).observe(document.querySelector('.hero-poster'),{attributes:true,attributeFilter:['data-presented']});
document.fonts.ready.then(report);
if(video.requestVideoFrameCallback){
  const presented=()=>{report();video.requestVideoFrameCallback(presented);};
  video.requestVideoFrameCallback(presented);
}
report();
