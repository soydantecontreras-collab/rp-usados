export function updateTransition(root, progress) {
  // Provisional handoff during the final threshold crossing; no flash or extra hold.
  const mix = Math.max(0, Math.min(1, (progress - .87) / .13));
  const blend = mix * mix * (3 - 2 * mix);
  root.querySelector('.hero-webgl__visual').style.opacity = String(1 - blend);
  root.parentElement.style.setProperty('--hero-ui-opacity', String(blend));
  root.parentElement.style.setProperty('--hero-ui-events', blend > .1 ? 'auto' : 'none');
  root.querySelector('.hero-webgl__actions').inert = blend > .5;
  root.querySelector('.hero-webgl__hint').style.opacity = String(Math.max(0, 1 - progress * 5));
}
export function resetTransition(root) {
  root.querySelector('.hero-webgl__visual').style.removeProperty('opacity');
  root.querySelector('.hero-webgl__hint').hidden = true;
  root.parentElement.style.removeProperty('--hero-ui-opacity');
  root.parentElement.style.removeProperty('--hero-ui-events');
  root.querySelector('.hero-webgl__actions').inert = false;
}
