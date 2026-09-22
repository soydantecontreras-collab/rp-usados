const select = document.querySelector('#rp-select-gallery');
const input = document.querySelector('#rp_galeria_ids');
const preview = document.querySelector('#rp-gallery-preview');

if (select && input && window.wp?.media) {
  select.addEventListener('click', () => {
    const frame = window.wp.media({ title: 'Galería de la unidad', button: { text: 'Usar estas imágenes' }, library: { type: 'image' }, multiple: true });
    frame.on('open', () => {
      const selection = frame.state().get('selection');
      input.value.split(',').filter(Boolean).forEach((id) => selection.add(window.wp.media.attachment(Number(id))));
    });
    frame.on('select', () => {
      const images = frame.state().get('selection').toJSON();
      input.value = images.map(({ id }) => id).join(',');
      preview.replaceChildren(...images.map((item) => {
        const image = new Image(80, 80);
        image.src = item.sizes?.thumbnail?.url || item.url;
        image.alt = item.alt || '';
        image.style.objectFit = 'cover';
        return image;
      }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    frame.open();
  });
}
