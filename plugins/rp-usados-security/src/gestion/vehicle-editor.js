import { api, feedback } from './main.js';
import { initPhotos } from './photos.js';

export function initVehicleEditor(config) {
  const form = document.getElementById('vehicle-form');
  const initial = JSON.parse(document.getElementById('vehicle-data').textContent);
  const state = { id: Number(initial.id || 0), revision: initial.revision || '', featured: Number(initial.featured_media || 0),
    gallery: initial.gallery || [], images: initial.images || {}, savedCommercialState: initial.fields?.rp_estado_stock || '', dirty: false, saving: false, uploads: 0 };
  const saveStatus = form.querySelector('[data-save-status]');
  function markDirty() { state.dirty = true; saveStatus.textContent = 'Cambios sin guardar'; }
  function payload(publication) {
    const fields = {};
    for (const name of ['rp_marca','rp_modelo','rp_version','rp_anio','rp_precio_monto','rp_precio_moneda','rp_estado_stock','rp_kilometraje']) fields[name] = form.elements[name].value;
    return { fields, description: form.elements.description.value, featured_media: state.featured,
      gallery: [...state.gallery], publication: publication || form.elements.publication.value, revision: state.revision };
  }
  function updateData(data, { snapshot = true } = {}) {
    state.id = Number(data.id); state.revision = data.revision;
    state.savedCommercialState = data.fields?.rp_estado_stock || '';
    form.elements.vehicle_id.value = state.id; form.elements.revision.value = state.revision;
    form.elements.publication.value = data.publication;
    // Creating the upload draft must not replace fields the owner is still typing.
    if (snapshot) {
      state.dirty = false; saveStatus.textContent = 'Cambios guardados';
      const link = form.querySelector('[data-public-link]'); link.href = data.url || ''; link.hidden = data.publication !== 'publish' || !data.url;
      const badge = document.querySelector('.publication-label'); badge.textContent = data.publication === 'publish' ? 'Publicado' : 'Borrador';
      if (data.publication === 'publish') {
        const primary = form.querySelector('.gestion-save-actions .primary'); primary.value = 'save'; primary.textContent = 'Guardar cambios';
        form.querySelector('button[value="draft"]')?.remove();
      }
    }
    history.replaceState(null, '', `${config.managementUrl}vehiculos/${state.id}/`);
  }
  let draftPromise;
  async function ensureDraft() {
    if (state.id) return state.id;
    if (!draftPromise) {
      // A malformed typed field must not prevent a user selecting photographs.
      // The empty draft is private; final input is validated on explicit save.
      draftPromise = api('vehiculos', 'POST', { fields: {}, description: '', featured_media: 0, gallery: [], publication: 'draft' })
        .then(data => { updateData(data, { snapshot: false }); return state.id; })
        .finally(() => { draftPromise = null; });
    }
    return draftPromise;
  }
  const sessionDialog = document.getElementById('session-dialog');
  function expired() {
    feedback('La sesión venció. Tus cambios siguen en este formulario. Volvé a ingresar para guardarlos.');
    if (sessionDialog?.showModal && !sessionDialog.open) sessionDialog.showModal();
  }
  async function renewSession() {
    try {
      const bridge = new URL(config.managementUrl, location.href); bridge.searchParams.set('access', 'session');
      const response = await fetch(bridge, { credentials: 'same-origin', cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.nonce) throw new Error('Todavía no hay una sesión válida. Ingresá de nuevo.');
      config.nonce = data.nonce;
      if (data.csrf) { config.csrf = data.csrf; document.querySelectorAll('input[name="csrf"]').forEach(input => { input.value = data.csrf; }); }
      sessionDialog.close(); feedback('Sesión recuperada. Podés guardar tus cambios.', 'success');
    } catch (error) { feedback(error.message); }
  }
  sessionDialog?.querySelector('[data-session-retry]')?.addEventListener('click', renewSession);
  sessionDialog?.querySelector('[data-dialog-close]')?.addEventListener('click', () => sessionDialog.close());
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.data?.type !== 'rp-usados-gestion-authenticated') return;
    if (typeof event.data.nonce === 'string' && event.data.nonce) config.nonce = event.data.nonce;
    renewSession();
  });
  const photos = initPhotos(form, config, state, { ensureDraft, markDirty, expired });
  form.addEventListener('input', () => {
    markDirty();
    const title = ['rp_marca','rp_modelo','rp_version','rp_anio'].map(name => form.elements[name].value.trim()).filter(Boolean).join(' ');
    form.querySelector('[data-title-preview]').textContent = title || 'Completá marca y modelo';
  });
  form.addEventListener('change', markDirty);
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (state.saving) return;
    if (photos.hasFailures()) { feedback('Hay fotos que no pudieron subirse. Reintentá o quitalas de la cola antes de guardar.'); return; }
    if (state.uploads) { feedback('Esperá a que terminen las fotos antes de guardar.'); return; }
    const intent = event.submitter?.value || 'save';
    if (form.elements.rp_estado_stock.value === 'vendido' && state.savedCommercialState !== 'vendido' && !confirm('Este vehículo dejará de aparecer en el catálogo. No se eliminará.')) return;
    const publication = intent === 'publish' ? 'publish' : intent === 'draft' ? 'draft' : form.elements.publication.value;
    const button = event.submitter; const previous = button?.textContent;
    state.saving = true; if (button) { button.disabled = true; button.textContent = 'Guardando…'; } saveStatus.textContent = 'Guardando…';
    const sent = payload(publication);
    try {
      const data = await api(state.id ? `vehiculos/${state.id}` : 'vehiculos', state.id ? 'PATCH' : 'POST', sent);
      // Input remains interactive while a save is in flight. Preserve edits made meanwhile.
      const changedWhileSaving = JSON.stringify(payload(publication)) !== JSON.stringify(sent);
      updateData(data); photos.clearCompleted();
      if (changedWhileSaving) markDirty();
      feedback(changedWhileSaving ? 'Cambios guardados. Tenés nuevas modificaciones pendientes.' : 'Cambios guardados', 'success');
    } catch (error) {
      if (error.code === 'rest_cookie_invalid_nonce' || error.status === 401) expired();
      else feedback(error.message, 'error', error.fields);
      if (error.status === 409 && state.id) {
        const current = document.createElement('a'); current.href = `${config.managementUrl}vehiculos/${state.id}/`;
        current.target = '_blank'; current.rel = 'noopener'; current.className = 'gestion-text-link';
        current.textContent = 'Abrir la versión actual en otra pestaña'; document.getElementById('gestion-notice').append(current);
      }
      saveStatus.textContent = error.status === 409 ? 'Hay una versión más nueva. Revisá antes de volver a guardar.' : 'No se guardaron los cambios';
      document.querySelector('[aria-invalid="true"]')?.focus();
    } finally { state.saving = false; if (button) { button.disabled = false; button.textContent = previous === 'Publicar vehículo' && form.elements.publication.value === 'publish' ? 'Guardar cambios' : previous; } }
  });
  window.addEventListener('beforeunload', event => {
    if (!state.dirty && !state.uploads) return; event.preventDefault(); event.returnValue = '';
  });
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href]');
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download') || !state.dirty) return;
    if (!confirm('Tenés cambios sin guardar. ¿Querés salir sin guardarlos?')) event.preventDefault();
  });
  document.querySelector('.gestion-account form')?.addEventListener('submit', event => {
    if (state.dirty && !confirm('Tenés cambios sin guardar. ¿Querés cerrar sesión igualmente?')) event.preventDefault();
  });
}
