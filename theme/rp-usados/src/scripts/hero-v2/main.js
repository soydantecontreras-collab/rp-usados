import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createSeekController } from './seek-controller.js';
import { MOBILE_QUERY, selectMedia } from './responsive-media.js';

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
const mobileView = matchMedia(MOBILE_QUERY);
const headerOffset = () => document.querySelector('header').offsetHeight + (parseFloat(getComputedStyle(document.body).getPropertyValue('--wp-bar')) || 0);
const landscape = matchMedia('(orientation: landscape)');
const diagnostics = window.__RP_V2__ = { encoding: document.body.dataset.encoding, state:'poster', progress:0, seeks:0, seekLatencies:[], presentations:[], errors:[], started:performance.now() };
let media, trigger, observer, disposed = false, attempted = false, blocked = false, restored = document.readyState === 'complete';
let device;
let layoutWidth = innerWidth;
const aperture = document.querySelector('.hero-aperture');
const apertureShape = aperture.querySelector('polygon');
// Source-video coordinates of the free opening, inside the leaves and handles.
// Frame 88 is the approved last contextual pose; the scroll travel stays intact.
const lastContextFrame = 88;
const apertureKeys = [
  [24,[356,635,364,635,364,646,364,902,367,910,353,910,356,902,356,646]],
  [32,[337,633,383,633,383,647,383,895,388,917,332,917,337,895,337,647]],
  [40,[261,622,459,622,407,648,407,900,460,947,261,947,312,900,312,648]],
  [48,[233,600,487,600,437,630,437,938,486,969,234,969,282,938,282,630]],
  [64,[190,557,530,557,491,587,491,996,527,1048,193,1048,229,996,229,587]],
  [76,[147,515,573,515,524,555,524,1065,568,1145,152,1145,196,1065,196,555]],
  [88,[86,448,634,448,559,539,559,1137,631,1237,89,1237,159,1137,159,539]],
];
function fitAperture() {
  if (!mobileView.matches) return;
  const width = visual.clientWidth, height = visual.clientHeight;
  const fit = landscape.matches ? Math.min : Math.max;
  const scale = fit(width / 720, height / 1280);
  Object.assign(aperture.style, {width:`${720 * scale}px`, height:`${1280 * scale}px`, left:`${(width - 720 * scale) / 2}px`, top:'0px'});
}
function presentedAperture(time) {
  if (device !== 'mobile' || !poster.hasAttribute('data-presented') || document.body.dataset.mode !== 'scroll') return;
  const frame = Math.min(lastContextFrame, Math.round(time * 48));
  const upper = Math.max(0, apertureKeys.findIndex(([key]) => key >= frame));
  const b = apertureKeys[upper], a = apertureKeys[Math.max(0, upper - 1)];
  const t = b[0] === a[0] ? 0 : Math.max(0, Math.min(1, (frame-a[0]) / (b[0]-a[0])));
  const points = b[1].map((value, index) => (a[1][index] + (value-a[1][index]) * t).toFixed(2));
  apertureShape.setAttribute('points', points.join(' '));
  aperture.style.opacity = String(.994 * smooth(Math.max(0, Math.min(1, (frame-24)/22))));
}
const apertureObserver = new ResizeObserver(fitAperture);
apertureObserver.observe(visual);
function eligible() { return !reduced.matches && !navigator.connection?.saveData && !blocked; }
const smooth = p => p * p * (3 - 2 * p);
function ensureMedia() {
  if (media || attempted || !eligible() || document.hidden || (device !== 'mobile' && diagnostics.progress >= .995)) return;
  const bounds = stage.getBoundingClientRect();
  if (bounds.bottom <= 0 || bounds.top >= innerHeight) return;
  attempted = true;
  media = createSeekController(video, poster, diagnostics, failure, () => restored, presentedAperture);
  media.setProgress(device === 'mobile' ? Math.min(diagnostics.progress, lastContextFrame / 143) : diagnostics.progress);
}
function progress(value) {
  diagnostics.progress = value;
  ensureMedia();
  media?.setProgress(device === 'mobile' ? Math.min(value, lastContextFrame / 143) : value);
  // Mobile preserves contextual doors and frame; only the free aperture darkens.
  // Desktop retains its approved final fade. Catalog remains in native flow.
  visual.style.opacity = device === 'mobile' ? '1' : String(1 - smooth(Math.max(0, Math.min(1, (value - .85) / .12))));
  const captionExit = smooth(Math.max(0, Math.min(1, (value - .70) / .16)));
  caption.style.opacity = String(1 - captionExit);
  caption.inert = value >= .86;
  cue.style.opacity = String(Math.max(0, 1 - value * 6));
}
function failure(reason) {
  diagnostics.errors.push(reason); blocked = true;
  initialize(); diagnostics.state = 'fallback';
  document.querySelector('.media-status').textContent = 'Vista estática. Podés continuar a Ver vehículos.';
}
function initialize() {
  if (disposed) return;
  trigger?.kill(); observer?.disconnect(); media?.dispose(); media = null;
  trigger = null;
  const nextDevice = mobileView.matches ? 'mobile' : 'desktop';
  if (device && nextDevice !== device) blocked = false;
  device = selectMedia(video, mobileView.matches);
  diagnostics.device = device; diagnostics.encoding = device === 'mobile' ? 'portrait-crf18' : 'fast';
  diagnostics.state = 'poster'; diagnostics.presentations = []; diagnostics.seekLatencies = []; diagnostics.seeks = 0;
  for (const key of ['presentedTime','targetTime','firstPresentedMs','loadedDataMs']) delete diagnostics[key];
  attempted = false;
  aperture.style.opacity = '0';
  fitAperture();
  for (const element of [visual, caption, cue, catalog]) element.style.removeProperty('opacity');
  caption.inert = false; catalog.inert = false; catalog.setAttribute('data-visible','');
  document.body.dataset.mode = eligible() ? 'scroll' : 'static';
  if (!eligible()) { diagnostics.state = 'poster'; return; }
  const update = self => progress(self.progress);
  trigger = ScrollTrigger.create({ trigger: root, start: () => `top ${headerOffset()}px`, end: () => `+=${root.offsetHeight - stage.offsetHeight}`, invalidateOnRefresh:true, onUpdate:update, onRefresh:update });
  // Read restored scroll before preparing media. Source never changes according to URL flags.
  progress(trigger.progress);
  ensureMedia();
  observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) ensureMedia();
    media?.suspend(!entry.isIntersecting || document.hidden);
  });
  observer.observe(stage);
}

// Height-only toolbar changes reveal media; width changes recapture composition.
let resizeFrame = 0;
function layoutChanged() {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    if (disposed) return;
    if (device !== (mobileView.matches ? 'mobile' : 'desktop')) initialize();
    if (!mobileView.matches || innerWidth !== layoutWidth) ScrollTrigger.refresh();
    fitAperture();
    layoutWidth = innerWidth;
    ScrollTrigger.update();
  });
}
document.querySelectorAll('a[href="#catalogo"]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  catalog.inert = false;
  const top = catalog.querySelector('.catalog-content').getBoundingClientRect().top + scrollY - headerOffset();
  scrollTo({top, behavior:'instant'});
  ScrollTrigger.update();
  catalog.focus({preventScroll:true});
}));
function visibility() {
  // A page initialized in the background deliberately has no media controller yet.
  if (!document.hidden) ensureMedia();
  const bounds = stage.getBoundingClientRect();
  media?.suspend(document.hidden || bounds.bottom <= 0 || bounds.top >= innerHeight);
}
function returned() {
  requestAnimationFrame(() => {
    if (disposed) return;
    restored = true;
    ScrollTrigger.refresh(); visibility();
    if (trigger) progress(trigger.progress);
    media?.reveal();
  });
}
function leave(event) {
  if (event.persisted) { media?.suspend(true); return; }
  disposed = true; media?.dispose(); observer?.disconnect(); trigger?.kill();
  apertureObserver.disconnect();
  cancelAnimationFrame(resizeFrame);
  reduced.removeEventListener('change',initialize); mobileView.removeEventListener('change',layoutChanged); landscape.removeEventListener('change',layoutChanged);
  document.removeEventListener('visibilitychange',visibility);
  window.removeEventListener('pageshow',returned);
  window.removeEventListener('resize',layoutChanged);
}
document.addEventListener('visibilitychange',visibility);
window.addEventListener('pageshow',returned);
window.addEventListener('pagehide',leave);
window.addEventListener('resize',layoutChanged);
reduced.addEventListener('change',initialize); mobileView.addEventListener('change',layoutChanged); landscape.addEventListener('change',layoutChanged);
initialize();
if (document.readyState === 'complete') returned();
document.fonts.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });

