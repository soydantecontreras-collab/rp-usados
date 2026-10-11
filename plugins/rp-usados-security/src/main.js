import './panel.css';
import { config, confirmAction } from './modules/api.js';
import { initForm } from './modules/form.js';
import { initList } from './modules/list.js';

document.body.classList.add('js-ready');
document.querySelectorAll('[data-password]').forEach(button => {
  button.addEventListener('click', () => {
    const input = button.closest('form').querySelector('input[name="password"]');
    input.type = input.type === 'password' ? 'text' : 'password';
    button.textContent = input.type === 'password' ? 'Mostrar contraseña' : 'Ocultar contraseña';
    button.setAttribute('aria-pressed', String(input.type === 'text'));
  });
});
if (document.body.dataset.view === 'form') initForm();
if (document.body.dataset.view === 'list') initList();
document.querySelector('.logout')?.addEventListener('submit', async event => {
  if (event.target.dataset.confirmed) return;
  if (window.rpGestionDirty?.()) {
    event.preventDefault();
    if (!await confirmAction('Hay cambios sin guardar. Si cerrás sesión se perderán.', 'Cerrar sesión')) return;
    event.target.dataset.confirmed = 'yes';
    window.rpGestionAllowLeave?.();
    sessionStorage.removeItem('rp-gestion-recovery');
    event.target.requestSubmit();
  } else sessionStorage.removeItem('rp-gestion-recovery');
});
// Expose no credentials or secrets; config holds only a short-lived WordPress CSRF nonce.
void config;
