/** Native horizontal scrolling and image links remain usable without JavaScript. */
export function initGallery() {
  const gallery = document.querySelector('.gallery');
  const viewport = gallery?.querySelector('.gallery-viewport');
  if (!viewport) return;

  const slides = [...viewport.querySelectorAll('.gallery-slide')];
  const choices = [...gallery.querySelectorAll('[data-image]')];
  const previous = gallery.querySelector('[data-previous]');
  const next = gallery.querySelector('[data-next]');
  const position = gallery.querySelector('[data-position]');
  const lightbox = gallery.querySelector('.gallery-lightbox');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let frame = 0;
  let warmFrame = 0;
  const count = slides.length;
  const number = value => String(value).padStart(2, '0');

  function warm(n) {
    const image = slides[n]?.querySelector('.gallery-photo');
    if (!image) return;
    image.loading = 'eager';
    if (image.dataset.gallerySrc) {
      if (image.dataset.gallerySrcset) image.srcset = image.dataset.gallerySrcset;
      image.src = image.dataset.gallerySrc;
      delete image.dataset.gallerySrc;
      delete image.dataset.gallerySrcset;
    }
    image.decode?.().catch(() => {});
  }
  function warmNext(n) {
    if (n >= count) return;
    if (warmFrame) {
      if ('cancelIdleCallback' in window) cancelIdleCallback(warmFrame);
      else clearTimeout(warmFrame);
    }
    if ('requestIdleCallback' in window) warmFrame = requestIdleCallback(() => warm(n), { timeout: 1200 });
    else warmFrame = setTimeout(() => warm(n), 300);
  }
  function update() {
    frame = 0;
    index = Math.max(0, Math.min(count - 1, Math.round(viewport.scrollLeft / viewport.clientWidth)));
    position.textContent = `${number(index + 1)} / ${number(count)}`;
    if (previous) previous.disabled = index === 0;
    if (next) next.disabled = index === count - 1;
    choices.forEach((link, n) => n === index ? link.setAttribute('aria-current', 'true') : link.removeAttribute('aria-current'));
    warm(index);
  }
  function go(n) {
    const target = Math.max(0, Math.min(count - 1, n));
    warm(target);
    viewport.scrollTo({ left:target * viewport.clientWidth, behavior:reduce.matches ? 'instant' : 'smooth' });
  }

  if (previous && count > 1) {
    gallery.querySelector('.gallery-navigation').hidden = false;
    previous.addEventListener('click', () => go(index - 1));
    next.addEventListener('click', () => go(index + 1));
    choices.forEach(link => link.addEventListener('click', event => {event.preventDefault();go(Number(link.dataset.image));}));
    viewport.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();go(index + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
    viewport.addEventListener('scroll', () => {if (!frame) frame = requestAnimationFrame(update);}, {passive:true});
  }
  const first = slides[0]?.querySelector('.gallery-photo');
  if (first) first.decode?.().then(() => warmNext(1)).catch(() => {});
  update();
  if ('IntersectionObserver' in window) {
    const near = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        warm(slides.indexOf(entry.target));
        near.unobserve(entry.target);
      }
    }, {root:viewport,rootMargin:'0px 12% 0px 12%',threshold:.01});
    slides.slice(2).forEach(slide => near.observe(slide));
  }

  if (!lightbox || typeof lightbox.showModal !== 'function') return;
  const enlarged = lightbox.querySelector('.lightbox-image');
  const lightboxPosition = lightbox.querySelector('[data-lightbox-position]');
  const lightboxPrevious = lightbox.querySelector('[data-lightbox-previous]');
  const lightboxNext = lightbox.querySelector('[data-lightbox-next]');
  let enlargedIndex = 0;
  function showEnlarged(n) {
    enlargedIndex = (n + count) % count;
    const anchor = slides[enlargedIndex].querySelector('.gallery-open');
    enlarged.src = anchor.href;
    enlarged.alt = slides[enlargedIndex].querySelector('.gallery-photo').alt;
    lightboxPosition.textContent = `${number(enlargedIndex + 1)} / ${number(count)}`;
    lightboxPrevious.hidden = lightboxNext.hidden = count < 2;
  }
  gallery.querySelectorAll('.gallery-open').forEach((anchor, n) => anchor.addEventListener('click', event => {
    event.preventDefault();
    showEnlarged(n);
    lightbox.showModal();
  }));
  lightbox.querySelector('[data-lightbox-close]').addEventListener('click', () => lightbox.close());
  lightboxPrevious.addEventListener('click', () => showEnlarged(enlargedIndex - 1));
  lightboxNext.addEventListener('click', () => showEnlarged(enlargedIndex + 1));
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();showEnlarged(enlargedIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  lightbox.addEventListener('click', event => {if (event.target === lightbox) lightbox.close();});
  lightbox.addEventListener('close', () => enlarged.removeAttribute('src'));
}
