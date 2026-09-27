import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createSeekController } from './seek-controller.js';

gsap.registerPlugin(ScrollTrigger);
const root = document.querySelector('.hero-track');
const stage = document.querySelector('.hero-stage');
const visual = document.querySelector('.hero-visual');
const caption = document.querySelector('.hero-caption');
const cue = document.querySelector('.scroll-cue');
const catalog = document.querySelector('#catalogo');
const video = document.querySelector('video');
const poster = document.querySelector('.hero-poster');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width:900px)');
const mobileTrial = document.body.dataset.encoding === 'mobile';
const diagnostics = window.__RP_V2__ = { encoding: document.body.dataset.encoding, state:'poster', progress:0, seeks:0, seekLatencies:[], presentations:[], errors:[], started:performance.now() };
let media, trigger, observer, disposed = false, attempted = false, restored = document.readyState === 'complete';
function eligible() { return !reduced.matches && (desktop.matches || mobileTrial) && !navigator.connection?.saveData; }
const smooth = p => p * p * (3 - 2 * p);
function ensureMedia() {
  if (media || attempted || !eligible() || document.hidden || diagnostics.progress >= .995) return;
  const bounds = stage.getBoundingClientRect();
  if (bounds.bottom <= 0 || bounds.top >= innerHeight) return;
  attempted = true;
  media = createSeekController(video, poster, diagnostics, failure, () => restored);
  media.setProgress(diagnostics.progress);
}
function progress(value) {
  diagnostics.progress = value;
  ensureMedia();
  media?.setProgress(value);
  const blend = reduced.matches ? 1 : smooth(Math.max(0, Math.min(1, (value - .84) / .16)));
  const sceneExit = smooth(Math.max(0, Math.min(1, (value - .82) / .12)));
  const captionExit = smooth(Math.max(0, Math.min(1, (value - .76) / .08)));
  visual.style.opacity = String(1 - sceneExit);
  caption.style.opacity = String(1 - captionExit);
  caption.inert = value >= .84;
  cue.style.opacity = String(Math.max(0, 1 - value * 6));
  catalog.style.opacity = String(blend);
  catalog.toggleAttribute('data-visible', blend > .1);
  // Keyboard may always jump to the catalog, but invisible cards cannot steal focus.
  catalog.inert = blend < .1;
}
function failure(reason) {
  diagnostics.state = 'fallback'; diagnostics.errors.push(reason);
  poster.removeAttribute('data-presented');
  media?.dispose(); media = null;
  document.querySelector('.media-status').textContent = 'Vista estática. Podés continuar a Ver vehículos.';
}
function initialize() {
  if (disposed) return;
  trigger?.kill(); observer?.disconnect(); media?.dispose(); media = null;
  attempted = false;
  for (const element of [visual, caption, cue, catalog]) element.style.removeProperty('opacity');
  caption.inert = false; catalog.inert = false; catalog.setAttribute('data-visible','');
  document.body.dataset.mode = eligible() ? 'scroll' : 'static';
  if (!eligible()) { diagnostics.state = 'poster'; return; }
  const update = self => progress(self.progress);
  trigger = ScrollTrigger.create({ trigger: root, start: () => `top ${document.querySelector('header').offsetHeight}px`, end: () => `+=${root.offsetHeight - stage.offsetHeight}`, invalidateOnRefresh:true, onUpdate:update, onRefresh:update });
  // Read restored scroll before preparing media. Source never changes according to URL flags.
  progress(trigger.progress);
  ensureMedia();
  observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) ensureMedia();
    media?.suspend(!entry.isIntersecting || document.hidden);
  });
  observer.observe(stage);
}
document.querySelectorAll('a[href="#catalogo"]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  catalog.inert = false;
  const top = catalog.getBoundingClientRect().top + scrollY - document.querySelector('header').offsetHeight;
  scrollTo({top, behavior:'instant'});
  ScrollTrigger.update();
  catalog.focus({preventScroll:true});
}));
function visibility() { media?.suspend(document.hidden || stage.getBoundingClientRect().bottom <= 0); }
function returned() {
  requestAnimationFrame(() => {
    if (disposed) return;
    restored = true;
    ScrollTrigger.refresh(); media?.suspend(false);
    if (trigger) progress(trigger.progress);
    media?.reveal();
  });
}
function leave(event) {
  if (event.persisted) { media?.suspend(true); return; }
  disposed = true; media?.dispose(); observer?.disconnect(); trigger?.kill();
  reduced.removeEventListener('change',initialize); desktop.removeEventListener('change',initialize);
  document.removeEventListener('visibilitychange',visibility);
  window.removeEventListener('pageshow',returned);
}
document.addEventListener('visibilitychange',visibility);
window.addEventListener('pageshow',returned);
window.addEventListener('pagehide',leave);
reduced.addEventListener('change',initialize); desktop.addEventListener('change',initialize);
initialize();
document.fonts.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });

// Same pending-contact behavior as approved exploration; no invented recipient.
const dialog = document.querySelector('#wa-dialog');
let contactTrigger;
document.querySelectorAll('[data-whatsapp]').forEach(button => button.addEventListener('click', () => { contactTrigger = button; dialog.showModal(); }));
dialog.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog.addEventListener('close', () => contactTrigger?.focus());
