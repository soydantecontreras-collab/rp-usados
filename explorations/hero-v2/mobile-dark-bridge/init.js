// Native route uses the approved before-paint SVH bootstrap in the HTML.
// Explicit measurement route only: desktop resizing has no separate browser bars.
(() => {
  const root=document.documentElement;
  const params=new URLSearchParams(location.search),small=Number(params.get('small'));
  if(params.get('measure')!=='1'||small<=0){root.dataset.viewportMode='native';return;}
  let width=innerWidth;
  function capture(){
    if(matchMedia('(max-width:899px), (hover:none) and (pointer:coarse)').matches){root.style.setProperty('--hero-stable-viewport',small+'px');root.dataset.viewportMode='measurement';}
  }
  capture();addEventListener('resize',()=>{if(width===innerWidth)return;width=innerWidth;capture();},{passive:true});
})();
