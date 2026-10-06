(() => {
  const root = document.documentElement, params = new URLSearchParams(location.search);
  const simulation = params.get('mode') === 'simulation';
  root.dataset.abVariant = params.get('variant') === 'B' ? 'B' : 'A';
  root.dataset.abMode = simulation ? 'simulation' : 'native';
  let width = innerWidth;
  const bounded = (value, fallback) => Math.max(400,Math.min(1400,Number(value) || fallback));
  function capture() {
    const small = parseFloat(root.style.getPropertyValue('--hero-stable-viewport')) || innerHeight;
    let maximum;
    if(simulation) {
      const requestedSmall = bounded(params.get('small'),small);
      root.style.setProperty('--hero-stable-viewport',`${requestedSmall}px`);
      maximum = Math.max(requestedSmall,bounded(params.get('maximum'),requestedSmall+72));
    } else {
      const probe=document.createElement('div');
      probe.style.cssText='position:fixed;visibility:hidden;pointer-events:none;width:0;contain:strict;height:100vh';
      root.appendChild(probe);
      try {
        if(CSS.supports('height','100lvh')) probe.style.height='100lvh';
        maximum=Math.max(small,probe.getBoundingClientRect().height || innerHeight);
      } finally { probe.remove(); }
    }
    root.style.setProperty('--ab-maximum-viewport',`${maximum}px`);
  }
  capture();
  addEventListener('resize',()=>{
    if(width===innerWidth)return;
    width=innerWidth;capture();
  },{passive:true});
})();
