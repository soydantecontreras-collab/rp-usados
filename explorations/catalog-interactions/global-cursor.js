// Four systems share pointer/context detection, contrast, one RAF and cleanup.
export function createSignature(){
  const fine=matchMedia('(hover:hover) and (pointer:fine)'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
  const body=document.body,controller=new AbortController();
  const listen=(node,event,callback,options={})=>node.addEventListener(event,callback,{...options,signal:controller.signal});
  const root=document.createElement('div');root.className='signature';root.dataset.mode='A';root.setAttribute('aria-hidden','true');
  root.innerHTML='<svg viewBox="-60 -60 120 120"><g data-shape="A"><g id="precision-envelope"><circle class="cursor-outline" r="7"/><circle class="cursor-ink" r="7"/></g><circle class="cursor-fill" r="1.5"/></g><g data-shape="B"><g id="wheel-scale"><g id="wheel-roll"><circle class="cursor-outline" r="10"/><circle class="cursor-ink" r="10"/><path class="cursor-outline" d="M0 0L0 -9M0 0L7.8 4.5M0 0L-7.8 4.5"/><path class="cursor-ink" d="M0 0L0 -9M0 0L7.8 4.5M0 0L-7.8 4.5"/></g><circle class="cursor-fill" r="2"/><path id="wheel-accent" class="cursor-red" d="M-11 -4A12 12 0 0 1 7 -10"/><line id="wheel-needle" class="cursor-red" x1="0" y1="0" x2="0" y2="-7"/></g></g><g data-shape="C"><path id="ribbon-outline" class="cursor-outline" stroke-linecap="round"/><path id="ribbon-ink" class="cursor-ink" stroke-linecap="round" style="stroke-width:1.6"/><path id="ribbon-accent" class="cursor-red" stroke-linecap="round" style="stroke-width:.7"/><circle class="cursor-fill" r="1.6"/></g><g data-shape="D"><path class="cursor-fill" d="M0 -2.5L2.5 0L0 2.5L-2.5 0Z"/></g></svg>';
  const dock=document.createElement('div');dock.className='dock';dock.setAttribute('aria-hidden','true');
  dock.innerHTML='<svg viewBox="-18 -12 36 24"><path id="dock-outline" class="cursor-outline"/><path id="dock-ink" class="cursor-ink"/><path class="cursor-red" d="M-2 0H2"/></svg>';
  body.append(root,dock);
  const query=id=>root.querySelector('#'+id);
  const envelope=query('precision-envelope'),wheel=query('wheel-scale'),roll=query('wheel-roll'),accent=query('wheel-accent'),needle=query('wheel-needle');
  const ribbonOutline=query('ribbon-outline'),ribbonInk=query('ribbon-ink'),ribbonAccent=query('ribbon-accent');
  const dockOutline=dock.querySelector('#dock-outline'),dockInk=dock.querySelector('#dock-ink');
  const stats={A:[],B:[],C:[],D:[]},state={mode:'A',context:'normal',tone:'light',running:0,active:false};
  window.__GLOBAL_CURSOR__={stats,state};
  let mode='A',enabled=true,active=false,frame=0,px=0,py=0,lastX=0,lastY=0,lastMove=0,lastFrame=0,vx=0,vy=0;
  let context='normal',target=null,box=null,mediaBox=null,tone='light';
  let radius=7,stretchX=1,stretchY=1,spin=0,spinTarget=0,wheelSize=1,needleAngle=0;
  let fx=0,fy=0,tailX=-10,tailY=7,controlX=-6,controlY=3,dockX=0,dockY=0,dockWidth=8,dockHeight=3,dockRotation=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const allowed=()=>enabled&&fine.matches&&!reduce.matches;
  const path=(x,y,w,h)=>'M'+(-w/2)+' '+(-h)+'V0H'+(w/2)+'V'+(-h);
  function schedule(){if(!frame){state.running=1;frame=requestAnimationFrame(paint);}}
  function hide(){
    if(frame)cancelAnimationFrame(frame);frame=0;state.running=0;active=false;state.active=false;
    root.classList.remove('visible','pressed');dock.classList.remove('visible');body.classList.remove('has-signature');
  }
  function contrast(value){
    tone=value;state.tone=value;
    const ink=value==='light'?'#151b18':'#f5f4ef',outline=value==='light'?'#f0f0e9':'#101413';
    for(const node of [root,dock]){node.style.setProperty('--cursor-ink',ink);node.style.setProperty('--cursor-outline',outline);}
  }
  function inspect(element){
    if(!element||element.closest('input,textarea,select,[data-native-cursor]')){hide();return false;}
    const control=element.closest('a,button');
    let nextTarget=null,nextContext='normal';
    if(control?.matches('.vehicle-link')){nextTarget=control;nextContext='card';}
    else if(control?.matches('[data-cursor=gallery]')){nextTarget=control;nextContext='gallery';}
    else if(control?.matches('button,.mini-button')){nextTarget=control;nextContext='button';}
    else if(control){nextTarget=control;nextContext='link';}
    else if(element.closest('[data-cursor=hero]')){nextTarget=element.closest('[data-cursor=hero]');nextContext='hero';}
    if(nextTarget!==target||nextContext!==context){
      target=nextTarget;context=nextContext;state.context=context;
      box=target?.getBoundingClientRect()||null;
      mediaBox=context==='card'?target.querySelector('.vehicle-media')?.getBoundingClientRect():null;
    }
    contrast(element.closest('img,.vehicle-media')?'photo':element.closest('[data-tone]')?.dataset.tone||'light');
    return true;
  }
  function activate(){
    if(active)return;
    active=true;state.active=true;body.classList.add('has-signature');root.classList.add('visible');
    fx=dockX=px;fy=dockY=py;
  }
  function dockTarget(){
    let x=px-10,y=py+8,w=8,h=3,rotation=0;
    if(box){
      if(context==='button'){x=clamp(px,box.left+14,box.right-14);y=box.bottom+3;w=24;h=5;}
      else if(context==='card'&&mediaBox){x=clamp(px,mediaBox.left+18,mediaBox.right-18);y=mediaBox.bottom-1;w=28;h=5;}
      else if(context==='gallery'){
        const edges=[{d:Math.abs(px-box.left),x:box.left+5,y:clamp(py,box.top+20,box.bottom-20),r:90},{d:Math.abs(px-box.right),x:box.right-5,y:clamp(py,box.top+20,box.bottom-20),r:-90},{d:Math.abs(py-box.top),x:clamp(px,box.left+20,box.right-20),y:box.top+5,r:180},{d:Math.abs(py-box.bottom),x:clamp(px,box.left+20,box.right-20),y:box.bottom-5,r:0}];
        const edge=edges.sort((a,b)=>a.d-b.d)[0];x=edge.x;y=edge.y;rotation=edge.r;w=26;h=7;
      }else if(context==='link'){x=clamp(px,box.left+6,box.right-6);y=box.bottom+2;w=12;h=3;}
    }
    return{x,y,w,h,rotation};
  }
  function paint(now){
    frame=0;state.running=0;
    if(!active||!allowed()){hide();return;}
    const started=performance.now(),dt=clamp(now-lastFrame||16,1,40),a=1-Math.exp(-dt/55);lastFrame=now;
    const stale=now-lastMove>35;if(stale){vx*=Math.exp(-dt/65);vy*=Math.exp(-dt/65);}
    const speed=Math.hypot(vx,vy);
    root.style.transform='translate3d('+px+'px,'+py+'px,0)';
    let error=0;
    if(mode==='A'){
      const dimensions={normal:[6,1,1],hero:[8,1,1],button:[9,1.6,.72],card:[11,1,1],gallery:[13,1.15,.9],link:[5,1.15,.85]}[context];
      radius+=(dimensions[0]-radius)*a;stretchX+=(dimensions[1]-stretchX)*a;stretchY+=(dimensions[2]-stretchY)*a;
      envelope.setAttribute('transform','scale('+stretchX+' '+stretchY+')');
      envelope.querySelectorAll('circle').forEach(circle=>{circle.setAttribute('r',radius);circle.setAttribute('stroke-dasharray',context==='gallery'||context==='card'?'3 7':'none');});
      error=Math.abs(dimensions[0]-radius)+Math.abs(dimensions[1]-stretchX)+Math.abs(dimensions[2]-stretchY);
    }else if(mode==='B'){
      const targetSize={normal:.78,hero:1,button:.95,card:1.16,gallery:1.22,link:.65}[context];
      wheelSize+=(targetSize-wheelSize)*a;spin+=(spinTarget-spin)*a;
      needleAngle+=(clamp(speed*25,0,100)-needleAngle)*a;
      wheel.setAttribute('transform','scale('+wheelSize+' '+(wheelSize*(context==='button'?.82:1))+')');
      roll.setAttribute('transform','rotate('+spin+')');
      needle.setAttribute('transform','rotate('+(-40+needleAngle)+')');
      accent.style.opacity=context==='card'||context==='gallery'?'1':'.6';
      error=Math.abs(targetSize-wheelSize)+Math.abs(spinTarget-spin)+Math.abs(needleAngle);
      if(!stale)error+=1;
    }else if(mode==='C'){
      fx+=(px-fx)*a;fy+=(py-fy)*a;
      let wantedX=clamp(fx-px-10,-45,45),wantedY=clamp(fy-py+7,-40,40),wantedCX=wantedX*.5,wantedCY=wantedY*.25;
      if(context==='button'){wantedX=-13;wantedY=-12;wantedCX=-25;wantedCY=13;}
      if(context==='card'){wantedX-=5;wantedCY+=9;}
      if(context==='gallery'){wantedX*=1.12;wantedCY-=8;}
      if(context==='link'){wantedX=-8;wantedY=5;wantedCX=-3;wantedCY=9;}
      tailX+=(wantedX-tailX)*a;tailY+=(wantedY-tailY)*a;controlX+=(wantedCX-controlX)*a;controlY+=(wantedCY-controlY)*a;
      const d='M0 0Q'+controlX.toFixed(2)+' '+controlY.toFixed(2)+' '+tailX.toFixed(2)+' '+tailY.toFixed(2);
      ribbonOutline.setAttribute('d',d);ribbonInk.setAttribute('d',d);
      ribbonAccent.setAttribute('d','M0 2Q'+(controlX+2).toFixed(2)+' '+(controlY+3).toFixed(2)+' '+(tailX+2).toFixed(2)+' '+(tailY+2).toFixed(2));
      error=Math.abs(wantedX-tailX)+Math.abs(wantedY-tailY)+Math.abs(wantedCX-controlX)+Math.abs(wantedCY-controlY)+Math.abs(px-fx)+Math.abs(py-fy);
    }else{
      const t=dockTarget();dockX+=(t.x-dockX)*a;dockY+=(t.y-dockY)*a;dockWidth+=(t.w-dockWidth)*a;dockHeight+=(t.h-dockHeight)*a;dockRotation+=(t.rotation-dockRotation)*a;
      dock.classList.add('visible');dock.style.transform='translate3d('+dockX+'px,'+dockY+'px,0) rotate('+dockRotation+'deg)';
      const d=path(0,0,dockWidth,dockHeight);dockOutline.setAttribute('d',d);dockInk.setAttribute('d',d);
      error=Math.abs(t.x-dockX)+Math.abs(t.y-dockY)+Math.abs(t.w-dockWidth)+Math.abs(t.h-dockHeight)+Math.abs(t.rotation-dockRotation);
    }
    stats[mode].push(performance.now()-started);if(stats[mode].length>1800)stats[mode].shift();
    if(error>.035||!stale)schedule();
  }
  listen(document,'pointermove',event=>{
    if(!allowed()||event.pointerType==='touch'){hide();return;}
    const now=performance.now(),elapsed=clamp(now-lastMove,4,65);
    const dx=event.clientX-lastX,dy=event.clientY-lastY;
    if(active){vx=vx*.4+dx/elapsed*.6;vy=vy*.4+dy/elapsed*.6;spinTarget+=Math.hypot(dx,dy)*1.5*(dx+dy<0?-1:1);}
    px=lastX=event.clientX;py=lastY=event.clientY;lastMove=now;
    if(!inspect(event.target))return;
    activate();schedule();
  },{passive:true});
  listen(document,'pointerdown',event=>{if(event.pointerType!=='touch'&&active){root.classList.add('pressed');dock.style.scale='.82';}});
  listen(window,'pointerup',()=>{root.classList.remove('pressed');dock.style.scale='1';});
  listen(window,'pointercancel',hide);listen(window,'blur',hide);
  listen(document,'pointerout',event=>{if(!event.relatedTarget)hide();});
  listen(document,'visibilitychange',()=>{if(document.hidden)hide();});
  function refresh(){
    if(!active)return;
    const element=document.elementFromPoint(px,py);target=null;
    if(inspect(element))schedule();
  }
  listen(window,'scroll',refresh,{passive:true});listen(window,'resize',refresh);
  listen(fine,'change',hide);listen(reduce,'change',hide);
  return{
    setMode(value){mode=value;state.mode=value;root.dataset.mode=value;dock.classList.remove('visible');if(active)schedule();},
    setEnabled(value){enabled=value;if(!enabled)hide();},
    destroy(){hide();controller.abort();root.remove();dock.remove();},
  };
}
