import { feedback } from './main.js';

export function initPhotos(form, config, state, hooks) {
  const cover = form.querySelector('[data-cover-preview]');
  const gallery = form.querySelector('[data-gallery]');
  const queueNode = form.querySelector('[data-upload-queue]');
  const coverInput = form.querySelector('[data-upload-cover]');
  const galleryInput = form.querySelector('[data-upload-gallery]');
  const removeCover = form.querySelector('[data-remove-cover]');
  const entries = [];
  const urls = new Set();
  let running = 0;
  let draggedId;
  let coverGeneration = 0;
  const hiddenGallery = document.createElement('input'); hiddenGallery.type = 'hidden'; hiddenGallery.name = 'gallery_json'; form.append(hiddenGallery);
  coverInput.hidden = true; galleryInput.hidden = true;
  for (const input of [coverInput, galleryInput]) {
    const label = form.querySelector(`[for="${input.id}"]`);
    label.tabIndex = 0; label.setAttribute('role', 'button'); label.setAttribute('aria-controls', input.id);
    label.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.click(); } });
  }
  const fileLabel = form.querySelector('[for="cover_file"]');
  function sync() {
    form.elements.featured_media.value = state.featured;
    hiddenGallery.value = JSON.stringify(state.gallery);
    removeCover.hidden = !state.featured;
    fileLabel.textContent = state.featured ? 'Reemplazar foto' : 'Subir foto principal';
  }
  function imageNode(src, alt) { const img = document.createElement('img'); img.src = src; img.alt = alt; img.width = 640; img.height = 480; return img; }
  function renderCover() {
    cover.replaceChildren(); const image = state.images[state.featured];
    if (image) cover.append(imageNode(image.url, 'Foto principal'));
    else { const label = document.createElement('span'); label.textContent = 'Tu foto principal aparecerá acá'; cover.append(label); }
    sync();
  }
  function button(label, action, className = 'gestion-quiet') {
    const node = document.createElement('button'); node.type = 'button'; node.className = className; node.textContent = label; node.addEventListener('click', action); return node;
  }
  function move(id, direction) {
    const index = state.gallery.indexOf(id); const to = index + direction;
    if (to < 0 || to >= state.gallery.length) return;
    [state.gallery[index], state.gallery[to]] = [state.gallery[to], state.gallery[index]];
    hooks.markDirty(); renderGallery(); gallery.querySelector(`[data-image-id="${id}"] button`)?.focus();
  }
  function renderGallery() {
    gallery.replaceChildren();
    state.gallery.forEach((id, index) => {
      const image = state.images[id]; if (!image) return;
      const tile = document.createElement('div'); tile.className = 'gestion-photo'; tile.dataset.imageId = id;
      const imageElement = imageNode(image.thumb || image.url, image.alt || `Imagen ${index + 1} de galería`); imageElement.draggable = false; tile.append(imageElement);
      const tools = document.createElement('div'); tools.className = 'gestion-photo-tools';
      const order = document.createElement('div'); order.className = 'gestion-photo-order';
      const handle = button('⋮⋮', () => {}, 'gestion-drag-handle'); handle.setAttribute('aria-label', `Arrastrar imagen ${index + 1} para ordenar`); handle.draggable = true;
      handle.addEventListener('dragstart', event => { draggedId = id; tile.classList.add('dragging'); event.dataTransfer.setData('text/plain', String(id)); event.dataTransfer.effectAllowed = 'move'; });
      handle.addEventListener('dragend', () => { draggedId = undefined; tile.classList.remove('dragging'); });
      tile.addEventListener('dragover', event => { if (draggedId !== undefined) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } });
      tile.addEventListener('drop', event => { if (draggedId === undefined) return; event.preventDefault(); const from = state.gallery.indexOf(draggedId); const to = state.gallery.indexOf(id); if (from !== -1 && to !== -1) { state.gallery.splice(from, 1); state.gallery.splice(to, 0, draggedId); hooks.markDirty(); renderGallery(); } });
      const previous = button('←', () => move(id, -1)); previous.setAttribute('aria-label', `Mover imagen ${index + 1} antes`); previous.disabled = index === 0;
      const next = button('→', () => move(id, 1)); next.setAttribute('aria-label', `Mover imagen ${index + 1} después`); next.disabled = index === state.gallery.length - 1;
      order.append(handle, previous, next); tools.append(order);
      tools.append(button('Usar como principal', () => {
        coverGeneration++;
        const old = state.featured; state.featured = id; state.gallery = state.gallery.filter(value => value !== id);
        if (old && old !== id && !state.gallery.includes(old)) state.gallery.unshift(old);
        hooks.markDirty(); renderCover(); renderGallery();
      }));
      tools.append(button('Quitar de la galería', () => { state.gallery = state.gallery.filter(value => value !== id); hooks.markDirty(); renderGallery(); }));
      tile.append(tools); gallery.append(tile);
    });
    sync();
  }
  removeCover.addEventListener('click', () => { coverGeneration++; state.featured = 0; hooks.markDirty(); renderCover(); });
  function invalid(file) {
    if (/\.(heic|heif)$/i.test(file.name) || /image\/hei[cf]/i.test(file.type)) return 'Esta foto está en formato HEIC. Por ahora, subila como JPG, PNG o WebP.';
    if (!/\.(jpe?g|png|webp)$/i.test(file.name)) return 'Subí una foto en formato JPG, PNG o WebP.';
    if (file.size > 12 * 1024 * 1024) return 'Esta foto supera los 12 MiB. Elegí una versión más liviana.';
    return '';
  }
  function renderEntry(entry) {
    entry.node.replaceChildren();
    entry.node.className = `gestion-upload-row${entry.status === 'failed' ? ' failed' : ''}`;
    entry.node.append(imageNode(entry.preview, 'Preview de foto seleccionada'));
    const name = document.createElement('strong'); name.textContent = entry.file.name; entry.node.append(name);
    const status = document.createElement('span'); status.textContent = entry.message || (entry.status === 'pending' ? 'En cola' : entry.status === 'done' ? 'Foto subida. Guardá para confirmar los cambios.' : 'Subiendo…'); entry.node.append(status);
    if (entry.status === 'uploading') {
      const progress = document.createElement('progress'); progress.max = 100; progress.value = entry.progress; progress.setAttribute('aria-label', `Progreso de ${entry.file.name}`); entry.node.append(progress);
    }
    if (entry.status === 'failed') entry.node.append(button('Reintentar', () => { entry.status = 'pending'; entry.message = ''; renderEntry(entry); pump(); }));
    if (entry.status === 'pending' || entry.status === 'failed') entry.node.append(button('Quitar de la cola', () => { entry.status = 'removed'; entry.node.remove(); URL.revokeObjectURL(entry.preview); urls.delete(entry.preview); state.uploads--; hooks.markDirty(); }));
  }
  function send(entry, id) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const mediaRoot = new URL(config.restRoot); mediaRoot.pathname = mediaRoot.pathname.replace(/rp-usados\/v1\/gestion\/?$/, 'wp/v2/media');
      // Plain permalinks use ?rest_route= rather than pathname routing.
      if (mediaRoot.searchParams.has('rest_route')) mediaRoot.searchParams.set('rest_route', '/wp/v2/media');
      xhr.open('POST', mediaRoot.toString()); xhr.withCredentials = true; xhr.setRequestHeader('X-WP-Nonce', config.nonce);
      xhr.upload.addEventListener('progress', event => { if (event.lengthComputable) { entry.progress = Math.round(event.loaded / event.total * 100); const meter = entry.node.querySelector('progress'); if (meter) meter.value = entry.progress; } });
      xhr.addEventListener('load', () => {
        let data; try { data = JSON.parse(xhr.responseText); } catch { data = {}; }
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else { const error = new Error(data.message || 'No se pudo subir esta foto.'); error.code = data.code; error.status = xhr.status; reject(error); }
      });
      xhr.addEventListener('error', () => reject(new Error('La conexión falló. Podés reintentar esta foto.')));
      const body = new FormData(); body.append('file', entry.file); body.append('post', String(id)); xhr.send(body);
    });
  }
  async function upload(entry) {
    running++; entry.status = 'uploading'; renderEntry(entry);
    try {
      const id = await hooks.ensureDraft(); const data = await send(entry, id);
      const sizes = data.media_details?.sizes || {};
      state.images[data.id] = { id: data.id, url: data.source_url, thumb: sizes.medium?.source_url || sizes.thumbnail?.source_url || data.source_url, alt: data.alt_text || '' };
      if (entry.kind === 'cover') {
        // Replacements only become the current preview after successful upload.
        if (entry.generation === coverGeneration) { state.featured = data.id; renderCover(); }
      } else if (!state.gallery.includes(data.id)) {
        // Keep selection order even when the second upload finishes first.
        const following = entries.slice(entries.indexOf(entry) + 1).find(other => other.kind === 'gallery' && other.imageId && state.gallery.includes(other.imageId));
        if (following) state.gallery.splice(state.gallery.indexOf(following.imageId), 0, data.id);
        else state.gallery.push(data.id);
        entry.imageId = data.id; renderGallery();
      }
      entry.status = 'done'; state.uploads--; hooks.markDirty();
    } catch (error) {
      entry.status = 'failed'; entry.message = error.message;
      if (error.code === 'rest_cookie_invalid_nonce' || error.status === 401) hooks.expired();
    } finally { running--; renderEntry(entry); pump(); }
  }
  function pump() {
    for (const entry of entries) { if (running >= 2) break; if (entry.status === 'pending') upload(entry); }
  }
  function addFiles(files, kind) {
    for (const file of files) {
      const error = invalid(file); if (error) { feedback(error); continue; }
      const unique = new Set([...state.gallery, ...(state.featured ? [state.featured] : [])]).size;
      if (unique + state.uploads >= 20 && !(kind === 'cover' && state.featured)) { feedback('Podés usar hasta 20 imágenes distintas por vehículo.'); break; }
      const preview = URL.createObjectURL(file); urls.add(preview);
      const entry = { file, kind, status: 'pending', progress: 0, preview, node: document.createElement('div'), generation: kind === 'cover' ? ++coverGeneration : 0 };
      entries.push(entry); queueNode.append(entry.node); state.uploads++; hooks.markDirty(); renderEntry(entry);
    }
    pump();
  }
  coverInput.addEventListener('change', () => { addFiles([...coverInput.files].slice(0, 1), 'cover'); coverInput.value = ''; });
  galleryInput.addEventListener('change', () => { addFiles([...galleryInput.files], 'gallery'); galleryInput.value = ''; });
  cover.addEventListener('dragover', event => { event.preventDefault(); cover.classList.add('dragover'); });
  cover.addEventListener('dragleave', () => cover.classList.remove('dragover'));
  cover.addEventListener('drop', event => { event.preventDefault(); cover.classList.remove('dragover'); addFiles([...event.dataTransfer.files].slice(0, 1), 'cover'); });
  window.addEventListener('pagehide', () => { for (const url of urls) URL.revokeObjectURL(url); urls.clear(); });
  renderCover(); renderGallery();
  return { hasFailures: () => entries.some(entry => entry.status === 'failed'), clearCompleted: () => {
    for (const entry of entries) if (entry.status === 'done') { entry.node.remove(); URL.revokeObjectURL(entry.preview); urls.delete(entry.preview); }
  } };
}
