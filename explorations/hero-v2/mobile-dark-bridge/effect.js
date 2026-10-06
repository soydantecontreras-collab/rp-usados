// Experiment only. No source media changes, no second timeline or render loop.
// Coordinates describe the FREE aperture, inside the leaves and their handles.
// They are source-video pixels; the SVG follows the actual contain-fit image.
const aperture = [
  [24,[356,635,364,635,364,646,364,902,367,910,353,910,356,902,356,646]],
  [32,[337,633,383,633,383,647,383,895,388,917,332,917,337,895,337,647]],
  [40,[261,622,459,622,407,648,407,900,460,947,261,947,312,900,312,648]],
  [48,[233,600,487,600,437,630,437,938,486,969,234,969,282,938,282,630]],
  [64,[190,557,530,557,491,587,491,996,527,1048,193,1048,229,996,229,587]],
  [76,[147,515,573,515,524,555,524,1065,568,1145,152,1145,196,1065,196,555]],
  [88,[86,448,634,448,559,539,559,1137,631,1237,89,1237,159,1137,159,539]],
  [96,[32,366,688,366,593,498,593,1221,683,1320,37,1320,127,1221,127,498]],
  [104,[-27,248,747,248,644,460,644,1380,750,1450,-30,1450,76,1380,76,460]],
  [108,[-40,163,760,163,676,445,676,1430,775,1500,-55,1500,44,1430,44,445]],
  [112,[-65,63,785,63,709,437,709,1480,800,1560,-80,1560,11,1480,11,437]],
  [116,[-90,-75,810,-75,753,424,753,1520,830,1600,-110,1600,-33,1520,-33,424]],
  [120,[-160,-240,880,-240,820,380,820,1580,900,1640,-180,1640,-100,1580,-100,380]],
  [143,[-160,-240,880,-240,820,380,820,1580,900,1640,-180,1640,-100,1580,-100,380]],
];
const clamp = n => Math.max(0,Math.min(1,n));
const smooth = n => {const p=clamp(n);return p*p*(3-2*p);};
let refs, observer, enabled=false;
function elements() {
  if(refs)return refs;
  const visual=document.querySelector('.hero-visual');
  refs={visual,svg:document.querySelector('.interior-matte'),polygon:document.querySelector('.interior-matte polygon'),fade:document.querySelector('.lower-blend')};
  const fit=()=>{
    const width=visual.clientWidth,height=visual.clientHeight;
    const scale=Math.min(width/720,height/1280);
    Object.assign(refs.svg.style,{width:`${720*scale}px`,height:`${1280*scale}px`,left:`${(width-720*scale)/2}px`,top:`${(height-1280*scale)/2}px`});
  };
  observer=new ResizeObserver(fit);observer.observe(visual);fit();
  return refs;
}
function pointsAt(frame) {
  const upper=aperture.findIndex(([f])=>f>=frame);
  const b=aperture[upper<0?aperture.length-1:upper];
  const a=aperture[Math.max(0,upper-1)];
  const t=b[0]===a[0]?0:clamp((frame-a[0])/(b[0]-a[0]));
  return b[1].map((value,i)=>(a[1][i]+(value-a[1][i])*t).toFixed(2)).reduce((s,n,i)=>s+(i%2?',':' ')+n,'').trim();
}
export const darkBridge={
  reset(){
    enabled=false;
    if(!refs)return;
    refs.fade.style.opacity='0';refs.svg.style.opacity='0';
    refs.fade.dataset.progress='0';refs.svg.dataset.frame='0';
  },
  setProgress(progress,device){
    if(device!=='mobile'||document.body.dataset.mode!=='scroll'){this.reset();return;}
    enabled=true;
    const r=elements(),p=clamp(progress);
    // Initial frame unchanged. Broad gradual fade; lower edge joins #000.
    // Grow the fade's DEPTH instead of fading its whole opacity. This keeps
    // its very bottom black from the first gesture, matching the black wrapper,
    // while the first frame has zero coverage and no added strip.
    r.fade.style.opacity=p>0?'1':'0';
    r.fade.style.setProperty('--blend-start',`${100-20*smooth(p/.075)-36*smooth(p)}%`);
    r.fade.dataset.progress=p.toFixed(5);
  },
  presentedFrame(time){
    if(!enabled)return;
    const r=elements(),frame=Math.max(0,Math.min(143,Math.round(time*48)));
    r.polygon.setAttribute('points',pointsAt(frame));
    r.svg.style.opacity=String(.994*smooth((frame-24)/22));
    r.svg.dataset.frame=String(frame);
  },
  dispose(){observer?.disconnect();this.reset();},
};
