/** Eligibility and lazy import: this module has no Three.js/GSAP dependency. */
export function bootHero() {
  const root = document.querySelector('[data-hero-3d]');
  if (!root || root.dataset.heroBooted === 'true') return;
  root.dataset.heroBooted = 'true';
  const desktop = matchMedia('(min-width: 900px) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const debug = new URLSearchParams(location.search).has('hero_debug');
  const diagnostics = { state: 'static', frames: 0, progress: 0, events: [] };
  if (debug) window.__RP_HERO_DIAGNOSTICS__ = diagnostics;
  let controller, pending, observer, generation = 0, destroyed = false, attempted = false;
  const eligible = () => desktop.matches && !reduced.matches && !navigator.connection?.saveData;
  const status = (state, reason = '') => {
    root.dataset.state = state;
    Object.assign(diagnostics, { state, reason });
  };
  async function start() {
    if (controller || pending || attempted || !eligible() || destroyed) return;
    attempted = true;
    const token = ++generation;
    pending = new AbortController();
    const signal = pending.signal;
    status('loading');
    const timeout = setTimeout(() => pending?.abort('timeout'), 30000);
    try {
      const { createHero } = await import('./controller.js');
      signal.throwIfAborted();
      const instance = await createHero(root, { signal, diagnostics, status });
      if (destroyed || token !== generation || !eligible()) instance.dispose();
      else controller = instance;
    } catch (error) {
      if (token === generation && !destroyed) {
        status('fallback', String(signal.reason || error.message));
        pending?.abort('failed');
        root.querySelector('[data-hero-status]').textContent = 'Vista estática. Podés continuar a Ver vehículos.';
      }
    } finally {
      clearTimeout(timeout);
      if (token === generation) pending = null;
    }
  }
  function reset() {
    generation++;
    pending?.abort('eligibility changed'); pending = null;
    controller?.dispose(); controller = null;
    attempted = false;
    status('static');
  }
  function adapt() {
    if (!eligible()) reset();
    else if (root.getBoundingClientRect().bottom > 0 && root.getBoundingClientRect().top < innerHeight) start();
  }
  observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) start(); }, { rootMargin: '100px' });
  observer.observe(root);
  desktop.addEventListener('change', adapt);
  reduced.addEventListener('change', adapt);
  function leave(event) {
    if (event.persisted) { controller?.pause(); return; }
    destroyed = true; reset(); observer.disconnect();
    desktop.removeEventListener('change', adapt);
    reduced.removeEventListener('change', adapt);
    window.removeEventListener('pagehide', leave);
    window.removeEventListener('pageshow', returnPage);
  }
  function returnPage() { controller?.resume(); }
  window.addEventListener('pagehide', leave);
  window.addEventListener('pageshow', returnPage);
  if (debug) diagnostics.dispose = () => { reset(); observer.disconnect(); };
}
