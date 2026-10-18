import './styles.css';
import { initVehicleEditor } from './vehicle-editor.js';

const config = JSON.parse(document.querySelector('#gestion-config')?.textContent || '{}');
const notice = document.querySelector('#gestion-notice');
export function feedback(message, type = 'error', errors = {}) {
  notice.replaceChildren(document.createTextNode(message));
  notice.className = `gestion-notice ${type}`;
  notice.hidden = false;
  document.querySelectorAll('[data-error-for]').forEach(node => { node.textContent = ''; });
  document.querySelectorAll('[aria-invalid="true"]').forEach(node => node.removeAttribute('aria-invalid'));
  const entries = Object.entries(errors);
  if (entries.length) {
    const list = document.createElement('ul');
    for (const [key, message] of entries) {
      const li = document.createElement('li'); li.textContent = message; list.append(li);
      const target = document.querySelector(`[data-error-for="${CSS.escape(key)}"]`);
      if (target) target.textContent = message;
      document.getElementById(key)?.setAttribute('aria-invalid', 'true');
    }
    notice.append(list);
  }
}
export async function api(path, method = 'GET', payload) {
  const response = await fetch(endpoint(config.restRoot, path), {
    method, credentials: 'same-origin', cache: 'no-store',
    headers: { 'X-WP-Nonce': config.nonce, ...(payload ? { 'Content-Type': 'application/json' } : {}) },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'No pudimos completar la operación. Volvé a intentarlo.');
    error.status = response.status; error.code = data.code; error.fields = data.data?.errors || data.data?.params || {}; throw error;
  }
  return data;
}
export function endpoint(root, path) {
  const url = new URL(root, location.href);
  if (url.searchParams.has('rest_route')) url.searchParams.set('rest_route', `${url.searchParams.get('rest_route').replace(/\/$/, '')}/${path}`);
  else url.pathname = `${url.pathname.replace(/\/$/, '')}/${path}`;
  return url.toString();
}

const passwordButton = document.querySelector('[data-password-toggle]');
if (passwordButton) {
  passwordButton.hidden = false;
  passwordButton.addEventListener('click', () => {
    const input = document.getElementById('password'); const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password'; passwordButton.textContent = visible ? 'Ocultar' : 'Mostrar';
    passwordButton.setAttribute('aria-pressed', String(visible));
  });
}
const stateDialog = document.getElementById('state-dialog');
if (stateDialog && typeof stateDialog.showModal === 'function') {
  let row;
  const select = stateDialog.querySelector('select');
  const warning = stateDialog.querySelector('[data-state-warning]');
  select.addEventListener('change', () => { warning.hidden = select.value !== 'vendido'; });
  document.querySelectorAll('[data-change-state]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      row = button.closest('[data-vehicle-id]'); select.value = row.dataset.state || 'disponible';
      warning.hidden = select.value !== 'vendido'; stateDialog.showModal();
    });
  });
  stateDialog.querySelector('form').addEventListener('submit', async event => {
    if (event.submitter?.value !== 'confirm') return;
    event.preventDefault(); const button = event.submitter; const label = button.textContent;
    button.disabled = true; button.textContent = 'Guardando…';
    try {
      const data = await api(`vehiculos/${row.dataset.vehicleId}/estado`, 'PATCH', { state: select.value, revision: row.dataset.revision });
      row.dataset.revision = data.revision; row.dataset.state = data.fields.rp_estado_stock;
      const badge = row.querySelector('.gestion-state'); badge.textContent = select.options[select.selectedIndex].textContent;
      badge.className = `gestion-state state-${select.value}`;
      stateDialog.close(); feedback('Estado actualizado', 'success');
      // Reload reflects the active filter, only after the server has committed the state.
      location.reload();
    } catch (error) { feedback(error.message, 'error', error.fields); stateDialog.close(); }
    finally { button.disabled = false; button.textContent = label; }
  });
}
if (document.getElementById('vehicle-form')) initVehicleEditor(config);
