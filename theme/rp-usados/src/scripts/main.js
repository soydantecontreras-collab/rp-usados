import '../styles/main.scss';
import { initGallery } from './gallery.js';

initGallery();
document.querySelectorAll('[data-contact-pending]').forEach(link => {
  link.addEventListener('click', () => requestAnimationFrame(() => document.querySelector('#contacto-pendiente')?.focus({ preventScroll: true })));
});
if (document.querySelector('.hero-track')) {
  import('./hero-v2/main.js').catch(() => {
    document.body.dataset.mode = 'static';
    document.querySelector('.media-status').textContent = 'Vista estática. Podés continuar a Ver vehículos.';
  });
}
