import { loadHeroAssets } from './loader.js';
import { createScene } from './scene.js';
import { createProgress } from './progress.js';
import { updateTransition, resetTransition } from './transition.js';

export async function createHero(root, { signal, diagnostics, status }) {
  const started = performance.now();
  const assets = await loadHeroAssets(root.dataset.assets, signal, diagnostics);
  const stage = root.querySelector('.hero-webgl__stage');
  const scene = createScene(root.querySelector('.hero-webgl__canvas'), assets, diagnostics);
  let progress, intersection, resizeObserver, raf = 0, disposed = false, visible = true, suspended = false, value = 0;
  function requestRender() {
    if (disposed || !visible || suspended || document.hidden || raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (disposed || document.hidden || !visible || suspended) return;
      try { scene.render(value); } catch (error) { fail(error.message); }
    });
  }
  function setProgress(next) {
    value = next; diagnostics.progress = next;
    updateTransition(root, next); requestRender();
  }
  function pause() { suspended = true; cancelAnimationFrame(raf); raf = 0; }
  function resume() { suspended = false; requestRender(); }
  function visibility() { if (document.hidden) pause(); else resume(); }
  function lost(event) { event.preventDefault(); fail('WebGL context lost'); }
  function dispose() {
    if (disposed) return;
    disposed = true; pause();
    intersection?.disconnect(); resizeObserver?.disconnect(); progress?.dispose();
    document.removeEventListener('visibilitychange', visibility);
    scene.renderer.domElement.removeEventListener('webglcontextlost', lost);
    scene.dispose(); resetTransition(root);
    diagnostics.disposed = true;
    root.dataset.state = 'static';
  }
  function fail(reason) {
    dispose(); status('fallback', reason);
    root.querySelector('[data-hero-status]').textContent = 'Vista estática. Podés continuar a Ver vehículos.';
  }
  scene.renderer.domElement.addEventListener('webglcontextlost', lost);
  try {
    await scene.prepare();
    if (disposed) throw new Error('WebGL context lost while preparing');
    signal.throwIfAborted();
    // If the visitor has already left, never insert scroll space behind them.
    if (root.getBoundingClientRect().bottom <= 0) throw new Error('Visitor skipped hero during loading');
    scene.render(0);
    progress = createProgress(root, setProgress);
    root.querySelector('.hero-webgl__hint').hidden = false;
    intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting; diagnostics.inViewport = visible;
      if (visible) requestRender(); else { cancelAnimationFrame(raf); raf = 0; }
    });
    intersection.observe(stage);
    resizeObserver = new ResizeObserver(() => { scene.resize(); progress.refresh(); requestRender(); });
    resizeObserver.observe(stage);
    document.addEventListener('visibilitychange', visibility);
    diagnostics.readyMs = performance.now() - started;
    status('ready');
    progress.refresh();
    return { dispose, pause, resume };
  } catch (error) { dispose(); throw error; }
}
