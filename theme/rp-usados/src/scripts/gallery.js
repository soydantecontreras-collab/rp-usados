/** Native horizontal scrolling works before enhancement and without JS. */
export function initGallery() {
  const gallery = document.querySelector('.gallery');
  const viewport = gallery?.querySelector('.gallery-viewport');
  if (!viewport) return;
  const slides = [...viewport.querySelectorAll('.gallery-slide')];
  const choices = [...gallery.querySelectorAll('[data-image]')];
  const previous = gallery.querySelector('[data-previous]');
  const next = gallery.querySelector('[data-next]');
  const position = gallery.querySelector('[data-position]');
  if (!previous || slides.length < 2) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, frame = 0;
  gallery.querySelector('.gallery-navigation').hidden = false;
  function update() {
    frame = 0;
    index = Math.max(0, Math.min(slides.length - 1, Math.round(viewport.scrollLeft / viewport.clientWidth)));
    position.textContent = (index + 1) + ' / ' + slides.length;
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    choices.forEach((link, n) => n === index ? link.setAttribute('aria-current', 'true') : link.removeAttribute('aria-current'));
  }
  function go(n) {
    viewport.scrollTo({left: Math.max(0, Math.min(slides.length - 1, n)) * viewport.clientWidth, behavior: reduce.matches ? 'instant' : 'smooth'});
  }
  previous.addEventListener('click', () => go(index - 1));
  next.addEventListener('click', () => go(index + 1));
  choices.forEach(link => link.addEventListener('click', event => { event.preventDefault(); go(Number(link.dataset.image)); }));
  viewport.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); go(index + (event.key === 'ArrowRight' ? 1 : -1)); }
  });
  viewport.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
  update();
}
