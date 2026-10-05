// Cursor-only study. Common card effect B is CSS; not imported by the theme.
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const enabled = document.querySelector('#cursor-enabled');
const board = document.querySelector('.comparison');
const stats = { A:[], B:[], C:[] };
const state = { active:null, loops:0, length:0, speed:0 };
window.__CURSOR_LAB__ = { stats, state };
const markup = {
  A:'<span class="speed-direction"><i class="speed-main"></i><i class="speed-accent"></i></span><i class="speed-tip"></i>',
  B:'<svg class="frame-corner frame-first" viewBox="0 0 8 8"><path class="outline" d="M7 1H1V7"/><path class="ink" d="M7 1H1V7"/></svg><svg class="frame-corner frame-second" viewBox="0 0 8 8"><path class="outline" d="M1 7H7V1"/><path class="ink" d="M1 7H7V1"/></svg>',
  C:'<svg class="facet" viewBox="0 0 12 14"><polygon class="facet-left" points="6,1 6,13 1,7"/><polygon class="facet-right" points="6,1 11,7 6,13"/></svg>',
};
const cursors = {};
for(const [variant,html] of Object.entries(markup)){
  const node=document.createElement('div');
  node.className='lab-cursor cursor-'+({A:'speed',B:'frame',C:'facet'}[variant]);
  node.setAttribute('aria-hidden','true');node.innerHTML=html;document.body.append(node);cursors[variant]=node;
}
let active=null, variant=null, frame=0;
let px=0,py=0,lastX=0,lastY=0,lastMove=0,lastFrame=0;
let vx=0,vy=0,length=0,angle=0,followX=0,followY=0,lean=0,open=0;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const permitted=()=>fine.matches&&!reduced.matches&&enabled.checked;
function schedule(){if(!frame){state.loops=1;frame=requestAnimationFrame(paint);}}
function stop(){
  if(frame)cancelAnimationFrame(frame);frame=0;state.loops=0;
  active?.classList.remove('is-cursor-active');
  for(const cursor of Object.values(cursors))cursor.classList.remove('is-visible','is-pressed');
  active=null;variant=null;state.active=null;state.length=state.speed=0;
}
function paint(now){
  frame=0;state.loops=0;
  if(!active||!permitted()){stop();return;}
  const started=performance.now();
  const dt=clamp(now-lastFrame||16,1,40);lastFrame=now;
  const approach=1-Math.exp(-dt/45);
  const stale=now-lastMove>35;
  if(stale){vx*=Math.exp(-dt/45);vy*=Math.exp(-dt/45);}
  const speed=Math.hypot(vx,vy);
  const node=cursors[variant];
  node.style.transform='translate3d('+px+'px,'+py+'px,0)';
  let settled=true;
  if(variant==='A'){
    const target=clamp(speed*11-1.4,0,22);
    length+=(target-length)*approach;
    if(speed>.06){
      const wanted=Math.atan2(vy,vx);
      const difference=Math.atan2(Math.sin(wanted-angle),Math.cos(wanted-angle));
      angle+=difference*approach;
    }
    node.querySelector('.speed-direction').style.transform='rotate('+angle+'rad)';
    node.querySelector('.speed-main').style.transform='scaleX('+Math.max(0,length/22)+')';
    node.querySelector('.speed-accent').style.transform='scaleX('+Math.max(0,(length*.58-.6)/13)+')';
    state.length=length;state.speed=speed;
    settled=stale&&length<.06;
  }else if(variant==='B'){
    followX+=(px-followX)*approach;followY+=(py-followY)*approach;
    const offsetX=clamp((followX-px)*.14,-2,2),offsetY=clamp((followY-py)*.14,-2,2);
    node.querySelector('.frame-second').style.transform='translate3d('+offsetX+'px,'+offsetY+'px,0)';
    settled=Math.abs(px-followX)<.06&&Math.abs(py-followY)<.06;
  }else{
    const wantedLean=clamp(vx*4,-8,8),wantedOpen=clamp(speed*.5,0,.9);
    lean+=(wantedLean-lean)*approach;open+=(wantedOpen-open)*approach;
    node.querySelector('.facet').style.transform='rotate('+lean+'deg)';
    node.querySelector('.facet-left').style.transform='translateX('+(-open)+'px)';
    node.querySelector('.facet-right').style.transform='translateX('+open+'px)';
    settled=stale&&Math.abs(lean)<.05&&open<.015;
  }
  stats[variant].push(performance.now()-started);
  if(stats[variant].length>1200)stats[variant].shift();
  if(!settled)schedule();
}
for(const card of document.querySelectorAll('.cursor-card')){
  const link=card.querySelector('.vehicle-link');
  function activate(event){
    if(!permitted()||event.pointerType==='touch')return;
    stop();active=card;variant=card.dataset.cursor;state.active=variant;
    px=lastX=followX=event.clientX;py=lastY=followY=event.clientY;
    vx=vy=length=lean=open=0;lastMove=lastFrame=performance.now();
    const node=cursors[variant];
    node.style.transform='translate3d('+px+'px,'+py+'px,0)';
    node.classList.add('is-visible');
    card.classList.add('is-cursor-active');schedule();
  }
  link.addEventListener('pointerenter',activate,{passive:true});
  link.addEventListener('pointermove',event=>{
    if(!permitted()||event.pointerType==='touch')return;
    if(active!==card){activate(event);return;}
    const now=performance.now(),elapsed=clamp(now-lastMove,4,65);
    px=event.clientX;py=event.clientY;
    vx=vx*.35+(px-lastX)/elapsed*.65;vy=vy*.35+(py-lastY)/elapsed*.65;
    lastX=px;lastY=py;lastMove=now;schedule();
  },{passive:true});
  link.addEventListener('pointerleave',stop);
  link.addEventListener('pointercancel',stop);
  link.addEventListener('pointerdown',()=>{if(active===card)cursors[variant].classList.add('is-pressed');});
}
addEventListener('pointerup',()=>Object.values(cursors).forEach(cursor=>cursor.classList.remove('is-pressed')));
addEventListener('blur',stop);addEventListener('scroll',stop,{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
fine.addEventListener('change',stop);reduced.addEventListener('change',stop);enabled.addEventListener('change',stop);
document.querySelectorAll('.view-controls button').forEach(button=>button.addEventListener('click',()=>{
  stop();board.dataset.view=button.dataset.view;
  document.querySelectorAll('.view-controls button').forEach(control=>control.setAttribute('aria-pressed',String(control===button)));
}));
