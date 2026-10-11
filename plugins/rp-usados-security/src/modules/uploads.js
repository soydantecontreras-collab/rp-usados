import { config, renewSession, api } from './api.js';

export function initUploads(form, changed) {
  const images = new Map(config.vehiculo.imagenes.map(image => [image.id, image]));
  const cover = form.elements['rp_vehicle[portada]'];
  const gallery = form.elements['rp_vehicle[galeria]'];
  const ids = () => gallery.value ? gallery.value.split(',').map(Number) : [];
  const queue = document.querySelector('#upload-queue');
  let pending = 0;
  let failures = 0;
  let chain = Promise.resolve();
  function coverPreview(url) {
    const node = document.querySelector('#cover-preview'); node.replaceChildren();
    if (url) { const image = new Image(); image.src = url; image.alt = 'Foto principal'; node.append(image); }
    else { const p = document.createElement('p'); p.textContent = 'Sin foto principal'; node.append(p); }
  }
  function render() {
    coverPreview(images.get(Number(cover.value))?.url);
    const node = document.querySelector('#gallery-preview'); node.replaceChildren();
    ids().forEach((id, index, list) => {
      const figure = document.createElement('figure'); figure.draggable = true;
      figure.dataset.image = id;
      const image = new Image(); image.src = images.get(id)?.url || ''; image.alt = `Foto de galería ${index + 1}`;
      figure.append(image);
      const actions = document.createElement('div'); actions.className = 'photo-actions';
      function button(label, callback, disabled = false) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'button'; b.textContent = label; b.disabled = disabled;
        b.addEventListener('click', callback); actions.append(b);
      }
      button('Usar como principal', () => {
        const old = Number(cover.value); cover.value = id;
        gallery.value = list.filter(v => v !== id).concat(old && old !== id && !list.includes(old) ? [old] : []).join(','); render(); changed();
      });
      const move = offset => { const result = [...list]; [result[index], result[index + offset]] = [result[index + offset], result[index]]; gallery.value = result.join(','); render(); changed(); node.querySelectorAll('figure')[index + offset]?.querySelector('button').focus(); };
      button('Anterior', () => move(-1), index === 0);
      button('Siguiente', () => move(1), index === list.length - 1);
      button('Quitar', () => { gallery.value = list.filter(v => v !== id).join(','); render(); changed(); });
      figure.append(actions); node.append(figure);
      figure.addEventListener('dragstart', event => event.dataTransfer.setData('text/rp-photo', String(id)));
      figure.addEventListener('dragover', event => event.preventDefault());
      figure.addEventListener('drop', event => {
        event.preventDefault(); const source = Number(event.dataTransfer.getData('text/rp-photo')); const from = list.indexOf(source);
        if (from < 0 || from === index) return;
        const result = [...list]; result.splice(from, 1); result.splice(index, 0, source); gallery.value = result.join(','); render(); changed();
      });
    });
  }
  function xhrUpload(file, progress, retry = false) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest(); xhr.open('POST', new URL('fotos', config.api)); xhr.setRequestHeader('X-WP-Nonce', config.nonce);
      xhr.timeout = 180000;
      xhr.upload.onprogress = event => { if (event.lengthComputable) progress(Math.round(event.loaded / event.total * 100)); };
      xhr.onerror = () => reject(new Error('No se pudo conectar. Reintentá esta foto.'));
      xhr.ontimeout = () => reject(new Error('La subida tardó demasiado. Reintentá esta foto.'));
      xhr.onload = async () => {
        let data;
        try { data = JSON.parse(xhr.responseText); } catch { reject(new Error('El servidor no pudo procesar la foto.')); return; }
        if (!retry && (xhr.status === 401 || ['rest_cookie_invalid_nonce', 'rp_nonce'].includes(data.code))) {
          try { await renewSession(); resolve(await xhrUpload(file, progress, true)); } catch (error) { reject(error); } return;
        }
        if (xhr.status < 200 || xhr.status >= 300) reject(new Error(data.message || 'No se pudo subir la foto.'));
        else resolve(data);
      };
      const body = new FormData(); body.set('foto', file); body.set('vehiculo', String(config.vehiculo.id)); xhr.send(body);
    });
  }
  async function validateFile(file) {
    const head = new Uint8Array(await file.slice(0, 32).arrayBuffer());
    const signature = new TextDecoder().decode(head);
    if (/\.hei[cf]$/i.test(file.name) || /image\/hei[cf]/i.test(file.type) || /ftyp(?:heic|heix|hevc|hevx|mif1|msf1)/.test(signature)) throw new Error('Esta foto está en formato HEIC. Por ahora, subila como JPG, PNG o WebP.');
    if (!/\.(jpe?g|png|webp)$/i.test(file.name) || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Usá una foto JPG, PNG o WebP.');
    if (!file.size || file.size > 12 * 1024 * 1024) throw new Error('La foto debe pesar como máximo 12 MiB.');
    // Actual dimensions are always checked again on the server.
    const bitmap = await createImageBitmap(file);
    const invalid = bitmap.width > 6000 || bitmap.height > 6000 || bitmap.width * bitmap.height > 24000000;
    bitmap.close();
    if (invalid) throw new Error('La foto supera 6000 px por lado o 24 MP.');
  }
  function enqueue(file, isCover) {
    const item = document.createElement('section'); item.className = 'upload-item';
    const name = document.createElement('strong'); name.textContent = file.name;
    const preview = new Image(); const url = URL.createObjectURL(file); preview.src = url; preview.alt = 'Vista previa de la foto seleccionada';
    const progress = document.createElement('progress'); progress.max = 100; progress.value = 0; progress.setAttribute('aria-label', `Subida de ${file.name}`);
    const status = document.createElement('p'); status.textContent = 'En espera';
    const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'button'; retry.textContent = 'Reintentar'; retry.hidden = true;
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'button'; remove.textContent = 'Descartar intento'; remove.hidden = true;
    item.append(preview, name, progress, status, retry, remove); queue.append(item);
    let failed = false;
    const run = async () => {
      retry.hidden = true; remove.hidden = true; item.classList.remove('is-error'); changed();
      if (failed) { failures--; failed = false; }
      try {
        await validateFile(file);
        const all = new Set([...ids(), Number(cover.value)].filter(Boolean));
        if (!isCover && all.size >= 20) throw new Error('Máximo 20 imágenes distintas, incluida la portada.');
        if (isCover) coverPreview(url);
        status.textContent = 'Subiendo…';
        const image = await xhrUpload(file, value => { progress.value = value; status.textContent = value === 100 ? 'Archivo enviado. Procesando foto…' : `Subiendo: ${value} %`; });
        images.set(image.id, image);
        if (isCover) cover.value = image.id;
        else gallery.value = [...ids(), image.id].join(',');
        render(); progress.value = 100; status.textContent = 'Foto subida. Guardá el vehículo para asociarla.';
        item.classList.add('uploaded');
        URL.revokeObjectURL(url); preview.src = image.url;
      } catch (error) {
        failures++; failed = true; status.textContent = error.message; item.classList.add('is-error');
        retry.hidden = false; remove.hidden = false;
        if (isCover) coverPreview(images.get(Number(cover.value))?.url);
      } finally { pending--; changed(); }
    };
    const schedule = () => { pending++; retry.hidden = true; remove.hidden = true; changed(); chain = chain.then(run); };
    retry.addEventListener('click', schedule);
    remove.addEventListener('click', () => { if (failed) failures--; item.remove(); URL.revokeObjectURL(url); changed(); });
    schedule();
  }
  for (const [inputId, zoneId, isCover] of [['cover-file', 'cover-drop', true], ['gallery-files', 'gallery-drop', false]]) {
    const input = document.getElementById(inputId); const zone = document.getElementById(zoneId);
    const select = files => {
      if (isCover && files.length > 1) { document.querySelector('#error-portada').textContent = 'Seleccioná una sola foto principal.'; return; }
      [...files].forEach(file => enqueue(file, isCover)); input.value = '';
    };
    input.addEventListener('change', () => select(input.files));
    zone.addEventListener('dragover', event => { event.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', event => { event.preventDefault(); zone.classList.remove('drag-over'); select(event.dataTransfer.files); });
  }
  document.querySelector('#remove-cover').addEventListener('click', () => { cover.value = 0; render(); changed(); });
  render();
  async function restore() {
    const missing = [...new Set([...ids(), Number(cover.value)].filter(Boolean))].filter(id => !images.has(id));
    try {
      for (const id of missing) images.set(id, await api(`fotos/${id}?vehiculo=${config.vehiculo.id}`));
      render();
    } catch { document.querySelector('#error-galeria').textContent = 'No se pudieron recuperar algunas vistas previas. No se descartaron las asociaciones; revisá la sesión y las fotos antes de guardar.'; }
  }
  return { busy: () => pending > 0, failed: () => failures > 0, restore };
}
