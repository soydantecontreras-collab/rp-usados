import { config, api, feedback, confirmAction } from './api.js';
import { initUploads } from './uploads.js';

export function initForm() {
  const form = document.querySelector('#vehicle-form');
  const status = document.querySelector('#save-feedback');
  let baseline, allowedLeave = false, saving = false;
  function values() {
    const data = {};
    form.querySelectorAll('[name^="rp_vehicle["]').forEach(input => {
      const key = input.name.match(/^rp_vehicle\[(.+)\]$/)[1]; data[key] = input.value;
    });
    data.portada = Number(data.portada);
    data.galeria = data.galeria ? data.galeria.split(',').map(Number) : [];
    return data;
  }
  const fingerprint = () => JSON.stringify(values());
  const dirty = () => fingerprint() !== baseline || uploads.busy() || uploads.failed();
  function changed() {
    form.querySelectorAll('.save-actions button').forEach(button => { button.disabled = saving || uploads.busy(); });
  }
  const uploads = initUploads(form, () => queueMicrotask(changed));
  baseline = fingerprint();
  const recoveryKey = 'rp-gestion-recovery';
  const reload = document.querySelector('#reload-current');
  reload.addEventListener('click', async () => {
    if (await confirmAction('Se cargarán los datos actuales del servidor y se descartarán los cambios sin guardar de este formulario.', 'Recargar versión actual')) {
      sessionStorage.removeItem(recoveryKey); allowedLeave = true; location.reload();
    }
  });
  function remember() {
    try { sessionStorage.setItem(recoveryKey, JSON.stringify({ usuario: config.usuario, path: location.pathname, time: Date.now(), values: values() })); } catch { /* Memory-only still works. */ }
  }
  try {
    const raw = sessionStorage.getItem(recoveryKey);
    const recovered = raw && JSON.parse(raw);
    if (recovered && recovered.usuario === config.usuario && recovered.path === location.pathname && Date.now() - recovered.time < 15 * 60 * 1000) {
      const safe = ['marca', 'modelo', 'version', 'anio', 'precio', 'moneda', 'estado', 'kilometraje', 'descripcion', 'portada', 'galeria', 'revision'];
      for (const key of safe) {
        const input = form.elements[`rp_vehicle[${key}]`];
        if (input && key in recovered.values) input.value = key === 'galeria' ? recovered.values[key].join(',') : recovered.values[key];
      }
      uploads.restore(); feedback(status, 'Se recuperaron los datos escritos. Revisalos antes de guardar.');
      if (recovered.values.revision !== config.vehiculo.revision) { reload.hidden = false; feedback(status, 'Se recuperaron tus datos, pero hay una versión más nueva en el servidor. No se sobrescribirá. Recargá la versión actual para continuar.', true); }
    } else if (recovered) sessionStorage.removeItem(recoveryKey);
  } catch { sessionStorage.removeItem(recoveryKey); }
  window.rpGestionDirty = dirty;
  window.rpGestionRemember = remember;
  window.rpGestionAllowLeave = () => { allowedLeave = true; };
  window.addEventListener('beforeunload', event => { if (!allowedLeave && dirty()) { event.preventDefault(); event.returnValue = ''; } });
  document.addEventListener('click', async event => {
    const link = event.target.closest('a[href]');
    if (!link || link.hash || link.target || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || allowedLeave || !dirty()) return;
    event.preventDefault();
    if (await confirmAction('Hay cambios sin guardar. Si salís ahora se perderán.', 'Salir sin guardar')) { allowedLeave = true; sessionStorage.removeItem(recoveryKey); location.assign(link.href); }
  });
  // Browser back is also guarded, not just reload/closing the tab.
  history.replaceState({ rpGestion: true }, '', location.href);
  history.pushState({ rpGestionGuard: true }, '', location.href);
  window.addEventListener('popstate', async () => {
    if (allowedLeave || !dirty()) { allowedLeave = true; history.back(); return; }
    history.pushState({ rpGestionGuard: true }, '', location.href);
    if (await confirmAction('Hay cambios sin guardar. Si volvés al stock se perderán.', 'Salir sin guardar')) { allowedLeave = true; location.assign(config.home); }
  });
  form.addEventListener('input', changed);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (saving || uploads.busy()) { feedback(status, 'Esperá a que terminen las subidas.'); return; }
    if (uploads.failed()) { feedback(status, 'Reintentá o descartá las fotos que no pudieron subir antes de guardar.', true); return; }
    const payload = values();
    const action = event.submitter?.value || 'changes';
    payload.publicacion = action === 'changes' ? config.vehiculo.publicacion : action;
    if (payload.estado === 'vendido' && config.vehiculo.estado !== 'vendido' && !await confirmAction('Este vehículo dejará de aparecer en el catálogo. No se eliminará.', 'Marcar vendido')) return;
    const sentFingerprint = fingerprint();
    saving = true; changed(); feedback(status, 'Guardando…');
    form.querySelectorAll('.field-error').forEach(node => { node.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach(node => node.removeAttribute('aria-invalid'));
    try {
      const data = await api(config.vehiculo.id ? `vehiculos/${config.vehiculo.id}` : 'vehiculos', config.vehiculo.id ? 'PATCH' : 'POST', payload);
      config.vehiculo = data;
      const unchangedDuringSave = fingerprint() === sentFingerprint;
      form.elements['rp_vehicle[revision]'].value = data.revision;
      if (unchangedDuringSave) baseline = fingerprint();
      else { const sent = JSON.parse(sentFingerprint); sent.revision = data.revision; baseline = JSON.stringify(sent); }
      history.replaceState({ rpGestionGuard: true }, '', data.editar_url);
      form.action = data.editar_url;
      document.querySelector('#publication-status').textContent = data.publicacion === 'publish' ? 'Publicado' : 'Borrador';
      document.querySelector('.publication-label').textContent = data.publicacion === 'publish' ? 'Publicado' : 'Borrador';
      document.querySelector('h1').textContent = 'Editar vehículo';
      const primary = form.querySelector('.save-actions .button-primary');
      primary.value = data.publicacion === 'publish' ? 'changes' : 'publish';
      primary.textContent = data.publicacion === 'publish' ? 'Guardar cambios' : 'Publicar vehículo';
      sessionStorage.removeItem(recoveryKey);
      feedback(status, unchangedDuringSave ? 'Cambios guardados' : 'Cambios guardados. Quedan modificaciones nuevas sin guardar.');
    } catch (error) {
      feedback(status, error.message, true);
      for (const [key, message] of Object.entries(error.fields || {})) {
        const node = document.getElementById(`error-${key}`); if (node) node.textContent = message;
        const input = key === 'portada' ? document.querySelector('#cover-file') : key === 'galeria' ? document.querySelector('#gallery-files') : form.elements[`rp_vehicle[${key}]`];
        input?.setAttribute('aria-invalid', 'true');
        input?.setAttribute('aria-describedby', `error-${key}`);
      }
      if (error.code === 'rp_conflict') { reload.hidden = false; }
      form.querySelector('[aria-invalid]')?.focus();
    } finally { saving = false; changed(); }
  });
}
