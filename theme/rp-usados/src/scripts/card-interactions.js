/** One contextual cursor and one animation frame, only for fine hover pointers. */
export function initCardInteractions() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const grids = [...document.querySelectorAll('.vehicle-grid')];
  if (!grids.length) return;

  const cursor = document.createElement('div');
  cursor.className = 'card-cursor';
  cursor.textContent = 'VER';
  cursor.setAttribute('aria-hidden', 'true');
  document.body.append(cursor);
  let active = null, frame = 0;
  let targetX = -100, targetY = -100, x = -100, y = -100;
  let shiftX = 0, shiftY = 0;

  function paint() {
    frame = 0;
    x += (targetX - x) * .38;
    y += (targetY - y) * .38;
    cursor.style.transform = `translate3d(${x - 29}px,${y - 29}px,0)`;
    if (active) {
      active.style.setProperty('--card-shift-x', `${shiftX * 3}px`);
      active.style.setProperty('--card-shift-y', `${shiftY * 2}px`);
      active.style.setProperty('--card-text-x', `${shiftX * 2}px`);
    }
    if (active && (Math.abs(targetX - x) > .4 || Math.abs(targetY - y) > .4)) frame = requestAnimationFrame(paint);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(paint); }
  function leave() {
    if (active) {
      active.style.removeProperty('--card-shift-x');
      active.style.removeProperty('--card-shift-y');
      active.style.removeProperty('--card-text-x');
    }
    active = null;
    document.body.classList.remove('has-card-cursor');
    cursor.classList.remove('is-visible', 'is-pressed');
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }
  for (const grid of grids) {
    grid.addEventListener('pointermove', event => {
      const card = event.target.closest('.vehicle-link');
      if (!card) { leave(); return; }
      if (card !== active) {
        leave();active = card;x = event.clientX;y = event.clientY;
        document.body.classList.add('has-card-cursor');
        cursor.classList.add('is-visible');
      }
      targetX = event.clientX;targetY = event.clientY;
      const rect = card.getBoundingClientRect();
      shiftX = (event.clientX - rect.left) / rect.width * 2 - 1;
      shiftY = (event.clientY - rect.top) / rect.height * 2 - 1;
      schedule();
    }, {passive:true});
    grid.addEventListener('pointerleave', leave);
    grid.addEventListener('pointerdown', event => {if (event.target.closest('.vehicle-link')) cursor.classList.add('is-pressed');});
    grid.addEventListener('pointerup', () => cursor.classList.remove('is-pressed'));
    grid.addEventListener('pointercancel', leave);
  }
  addEventListener('scroll', leave, {passive:true});
  addEventListener('blur', leave);
}
