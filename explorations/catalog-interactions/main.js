// Local comparison only; no imports from, or initialization in, the production theme.
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const board = document.querySelector('.comparison');
const metrics = { A: [], B: [], C: [] };
window.__CARD_LAB__ = { metrics, activeLoops: 0, gsap: false, reset: () => Object.values(metrics).forEach(list => list.splice(0)) };

document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
  if (button === board) return;
  board.dataset.view = button.dataset.view;
  document.querySelectorAll('.view-controls button').forEach(control => control.setAttribute('aria-pressed', String(control === button)));
  document.dispatchEvent(new Event('lab:reset'));
}));

for (const variant of ['A', 'C']) {
  const card = document.querySelector('[data-variant="' + variant + '"] .vehicle-link');
  const media = card.querySelector('.vehicle-media');
  let frame = 0, active = false, returning = false, rect = null;
  let x = 0, y = 0, targetX = 0, targetY = 0;
  function schedule() {
    if (!frame) { frame = requestAnimationFrame(paint); window.__CARD_LAB__.activeLoops++; }
  }
  function paint() {
    window.__CARD_LAB__.activeLoops--;
    frame = 0;
    const started = performance.now();
    const factor = returning ? .17 : .3;
    x += (targetX - x) * factor;
    y += (targetY - y) * factor;
    if (variant === 'A') {
      media.style.setProperty('--photo-x', x.toFixed(3) + 'px');
      media.style.setProperty('--photo-y', y.toFixed(3) + 'px');
    } else media.style.setProperty('--beam-x', x.toFixed(3) + 'px');
    metrics[variant].push(performance.now() - started);
    if (metrics[variant].length > 1200) metrics[variant].shift();
    const settled = Math.abs(targetX - x) < .025 && Math.abs(targetY - y) < .025;
    if (!settled) schedule();
    else if (returning) { returning = false; media.style.removeProperty('--photo-x'); media.style.removeProperty('--photo-y'); }
  }
  function leave() {
    active = false;
    card.classList.remove('is-over-photo');
    if (variant === 'A') { returning = true; targetX = targetY = 0; schedule(); }
    else if (frame) { cancelAnimationFrame(frame); frame = 0; window.__CARD_LAB__.activeLoops--; }
  }
  card.addEventListener('pointerenter', event => {
    if (!fine.matches || reduce.matches || event.pointerType === 'touch') return;
    rect = media.getBoundingClientRect();
    active = true; returning = false;
  }, { passive: true });
  card.addEventListener('pointermove', event => {
    if (!active || !fine.matches || reduce.matches) return;
    const nx = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    const ny = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
    if (variant === 'A') { targetX = -nx * 7; targetY = -ny * 5; }
    else {
      const overPhoto = event.clientY >= rect.top && event.clientY <= rect.bottom;
      card.classList.toggle('is-over-photo', overPhoto);
      if (!overPhoto) {
        if (frame) { cancelAnimationFrame(frame); frame = 0; window.__CARD_LAB__.activeLoops--; }
        return;
      }
      targetX = event.clientX - rect.left + rect.width * .06;
    }
    schedule();
  }, { passive: true });
  card.addEventListener('pointerleave', leave);
  card.addEventListener('pointercancel', leave);
  addEventListener('blur', leave);
  addEventListener('scroll', () => { if (active) rect = media.getBoundingClientRect(); }, { passive: true });
  document.addEventListener('lab:reset', () => {
    leave(); rect = null;
    if (frame) { cancelAnimationFrame(frame); frame = 0; window.__CARD_LAB__.activeLoops--; }
    x = y = targetX = targetY = 0;
    media.style.removeProperty('--photo-x'); media.style.removeProperty('--photo-y'); media.style.removeProperty('--beam-x');
  });
  reduce.addEventListener('change', () => { if (reduce.matches) document.dispatchEvent(new Event('lab:reset')); });
}
