(() => {
  const root=document.documentElement;
  const mobile=matchMedia('(max-width:899px), (hover:none) and (pointer:coarse)');
  const params=new URLSearchParams(location.search);
  // Explicit QA mode only: emulate the difference between SVH and LVH in a
  // desktop browser, where viewport resizing otherwise changes both units.
  const simulation=params.get('measure')==='1';
  let width=innerWidth;
  function capture() {
    if(!mobile.matches) { root.style.removeProperty('--hero-maximum-viewport'); return; }
    const probe=document.createElement('div');
    probe.style.cssText='position:fixed;visibility:hidden;pointer-events:none;width:0;contain:strict;height:100vh';
    root.appendChild(probe);
    try {
      if(CSS.supports('height','100lvh'))probe.style.height='100lvh';
      let small=parseFloat(root.style.getPropertyValue('--hero-stable-viewport'))||innerHeight;
      let maximum=Math.max(small,probe.getBoundingClientRect().height||innerHeight);
      if(simulation) {
        const requestedSmall=Number(params.get('small'));
        const requestedMaximum=Number(params.get('maximum'));
        if(requestedSmall>0 && requestedMaximum>=requestedSmall) {
          small=requestedSmall; maximum=requestedMaximum;
          root.style.setProperty('--hero-stable-viewport',small+'px');
        }
      }
      root.style.setProperty('--hero-maximum-viewport',maximum+'px');
      root.dataset.viewportMode=simulation?'measurement':'native';
    } finally { probe.remove(); }
  }
  capture();
  addEventListener('resize',()=>{
    if(innerWidth===width)return;
    width=innerWidth;capture();
  },{passive:true});
})();
