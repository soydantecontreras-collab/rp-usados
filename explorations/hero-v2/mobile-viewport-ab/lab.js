const frame = document.querySelector('#hero-frame');
let variant = 'A', delta = 0, small = 760, width = 393;
const baselines = new Map();
function pressed(selector, value, key) {
  document.querySelectorAll(selector).forEach(button => button.setAttribute('aria-pressed', String(button.dataset[key] === String(value))));
}
document.querySelectorAll('[data-variant]').forEach(button => button.addEventListener('click', () => {
  variant = button.dataset.variant;
  pressed('[data-variant]', variant, 'variant');
  frame.contentWindow.postMessage({type:'hero-ab/variant',variant}, location.origin);
}));
document.querySelectorAll('[data-delta]').forEach(button => button.addEventListener('click', () => {
  delta = Number(button.dataset.delta);
  pressed('[data-delta]',delta,'delta');
  frame.height = small + delta;
}));
const params = new URLSearchParams(location.search);
if(params.has('width') || params.has('small')) {
  width = Math.max(320,Math.min(600,Number(params.get('width')) || 393));
  small = Math.max(400,Math.min(1200,Number(params.get('small')) || 760));
  document.querySelector('[name=width]').value = width;
  document.querySelector('[name=small]').value = small;
  frame.width = width; frame.height = small;
  frame.src = `hero.html?variant=A&mode=simulation&small=${small}&maximum=${small+72}`;
}
const number = value => `${Number(value).toFixed(2)} px`;
window.addEventListener('message', event => {
  if(event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.type !== 'hero-ab/metrics') return;
  const m = event.data.metrics;
  window.__HERO_AB_METRICS__ = m;
  if(delta===0) baselines.set(m.variant,m);
  const baseline = baselines.get(m.variant);
  const rows = [
    ['Variante / video',`${m.variant} · ${m.state}`],
    ['Ajuste efectivo',m.effectiveFit==='cover'?'B · lienzo máximo':'A · imagen completa'],
    ['Viewport / máximo',`${m.viewport.height} / ${m.maximumViewport} px`],
    ['Frame / progreso',`${m.frame} / 144 · ${(m.progress*100).toFixed(1)}%`],
    ['Movimiento imagen',baseline?number(m.image.top-baseline.image.top):'Volvé a Inicial'],
    ['Movimiento CTA',baseline?number(m.cta.top-baseline.cta.top):'Volvé a Inicial'],
    ['Borde del lienzo',number(m.plane.bottom)],
    ['Borde visible de imagen',number(m.visibleImage.bottom)],
    ['Negro bajo lienzo',number(m.blackBelowPlane)],
    ['Negro bajo imagen real',number(m.blackBelowImage)],
    ['Escala de imagen',`${(m.scale*100).toFixed(2)}% del original`],
    ['Recorte lateral total',`${(m.crop.horizontal*100).toFixed(2)}%`],
    ['Recorte inferior',`${(m.crop.bottom*100).toFixed(2)}%`],
  ];
  document.querySelector('#metrics').replaceChildren(...rows.map(([label,value]) => {
    const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');
    dt.textContent=label;dd.textContent=value;row.append(dt,dd);return row;
  }));
});
