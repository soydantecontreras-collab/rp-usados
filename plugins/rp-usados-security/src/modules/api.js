export const config = JSON.parse(document.body.dataset.config);
export function feedback(node, message, error = false) {
  node.textContent = message;
  node.classList.toggle('is-error', error);
}
export function confirmAction(message, action = 'Continuar') {
  const dialog = document.querySelector('#confirm-dialog');
  document.querySelector('#confirm-text').textContent = message;
  const yes = dialog.querySelector('[data-confirm]');
  yes.textContent = action;
  return new Promise(resolve => {
    const finish = value => { dialog.close(); cleanup(); resolve(value); };
    const cancel = event => { event?.preventDefault(); finish(false); };
    const accept = () => finish(true);
    const cleanup = () => { yes.removeEventListener('click', accept); dialog.querySelector('[data-cancel]').removeEventListener('click', cancel); dialog.removeEventListener('cancel', cancel); };
    yes.addEventListener('click', accept);
    dialog.querySelector('[data-cancel]').addEventListener('click', cancel);
    dialog.addEventListener('cancel', cancel);
    dialog.showModal();
    dialog.querySelector('[data-cancel]').focus();
  });
}
let renewal;
export async function renewSession() {
  if (renewal) return renewal;
  window.rpGestionRemember?.();
  renewal = new Promise((resolve, reject) => {
    const dialog = document.querySelector('#session-dialog');
    const form = document.querySelector('#session-form');
    const status = document.querySelector('#session-feedback');
    const cancel = event => {
      event?.preventDefault(); dialog.close(); cleanup();
      reject(new Error('La sesión venció. Los datos siguen en el formulario. Volvé a guardar para iniciar sesión.'));
    };
    const submit = async event => {
      event.preventDefault();
      const button = form.querySelector('[type="submit"]');
      button.disabled = true;
      feedback(status, 'Iniciando sesión…');
      try {
        const challengeResponse = await fetch(config.session, { credentials: 'same-origin', cache: 'no-store' });
        const challenge = await challengeResponse.json();
        const body = new FormData(form); body.set('csrf', challenge.csrf);
        const response = await fetch(config.session, { method: 'POST', body, credentials: 'same-origin', cache: 'no-store' });
        const data = await response.json();
        form.elements.password.value = '';
        if (!response.ok) throw new Error(data.message || 'No se pudo iniciar sesión.');
        if (data.usuario !== config.usuario) {
          config.nonce = '';
          throw new Error('Ingresá con el mismo usuario para recuperar esta edición.');
        }
        config.nonce = data.nonce;
        dialog.close(); cleanup(); resolve();
      } catch (error) { feedback(status, error.message, true); }
      finally { button.disabled = false; }
    };
    const cleanup = () => { form.removeEventListener('submit', submit); dialog.removeEventListener('cancel', cancel); dialog.querySelector('[data-close-dialog]').removeEventListener('click', cancel); form.elements.password.value = ''; };
    form.addEventListener('submit', submit);
    dialog.addEventListener('cancel', cancel);
    dialog.querySelector('[data-close-dialog]').addEventListener('click', cancel);
    feedback(status, ''); dialog.showModal(); form.elements.usuario.focus();
  }).finally(() => { renewal = null; });
  return renewal;
}
export async function api(path, method = 'GET', payload, retried = false) {
  const response = await fetch(new URL(path, config.api), {
    method, credentials: 'same-origin', cache: 'no-store',
    headers: { 'X-WP-Nonce': config.nonce, ...(payload ? { 'Content-Type': 'application/json' } : {}) },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
  const data = await response.json();
  if (!response.ok) {
    if (!retried && (response.status === 401 || data.code === 'rest_cookie_invalid_nonce' || data.code === 'rp_nonce')) {
      await renewSession(); return api(path, method, payload, true);
    }
    const error = new Error(data.message || 'No se pudo completar la solicitud.');
    error.fields = data.data?.fields || {}; error.code = data.code; throw error;
  }
  return data;
}
