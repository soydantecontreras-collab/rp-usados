// Isolated visual exploration: no inventory, contact or WordPress mutations.
const dialog = document.querySelector('#wa-dialog');
let trigger;
document.querySelectorAll('[data-whatsapp]').forEach(button => button.addEventListener('click', () => {
  trigger = button; dialog.showModal();
}));
document.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog.addEventListener('close', () => trigger?.focus());
dialog.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const controls = [...dialog.querySelectorAll('button')];
  if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus(); }
  else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
});
const state = document.querySelector('#unit-state');
if (state) {
  const reserved = new URLSearchParams(location.search).get('estado') === 'reservado';
  state.textContent = reserved ? 'Reservado · muestra' : 'Disponible · muestra';
  state.classList.toggle('reserved', reserved);
  const views = ['Exterior · tres cuartos', 'Vista lateral', 'Interior de la unidad'];
  let current = 0;
  function showView(index) {
    current = (index + views.length) % views.length;
    document.querySelector('#gallery-view').textContent = views[current];
    document.querySelector('#gallery-position').textContent = '0' + (current + 1) + ' / 03';
    document.querySelector('.gallery-field').dataset.view = current;
    document.querySelectorAll('.gallery-choices button').forEach((button, i) => button.setAttribute('aria-pressed', String(i === current)));
  }
  document.querySelector('#next-image').addEventListener('click', () => showView(current + 1));
  document.querySelector('#previous-image').addEventListener('click', () => showView(current - 1));
  document.querySelectorAll('.gallery-choices button').forEach(button => button.addEventListener('click', () => showView(Number(button.dataset.view))));
  document.querySelector('.gallery').addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); showView(current + (event.key === 'ArrowRight' ? 1 : -1)); }
  });
}
