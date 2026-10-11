import { api, feedback, confirmAction } from './api.js';
export function initList() {
  const labels = { disponible: 'Disponible', reservado: 'Reservado', vendido: 'Vendido' };
  document.querySelectorAll('.state-form').forEach(form => {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const row = form.closest('.stock-row');
      const selected = form.querySelector('select').value;
      if (selected === row.dataset.state) { form.closest('details').open = false; return; }
      if (selected === 'vendido' && !await confirmAction('Este vehículo dejará de aparecer en el catálogo. No se eliminará.', 'Marcar vendido')) return;
      const button = form.querySelector('[type="submit"]');
      const status = document.querySelector('#list-feedback');
      button.disabled = true; row.setAttribute('aria-busy', 'true'); feedback(status, 'Guardando…');
      try {
        const data = await api(`vehiculos/${row.dataset.id}/estado`, 'PATCH', { estado: selected, revision: row.dataset.revision });
        row.dataset.state = data.estado; row.dataset.revision = data.revision;
        form.querySelector('input[name="rp_vehicle[revision]"]').value = data.revision;
        row.querySelector('.state-label').textContent = labels[data.estado];
        form.closest('details').open = false;
        feedback(status, 'Cambios guardados');
        const filter = new URL(location.href).searchParams.get('filtro') || 'activo';
        const stays = filter === 'borradores' || (filter === 'activo' ? ['disponible', 'reservado'].includes(data.estado) : filter === data.estado);
        if (!stays) location.reload();
      } catch (error) {
        form.querySelector('select').value = row.dataset.state;
        feedback(status, error.message, true);
      } finally { button.disabled = false; row.removeAttribute('aria-busy'); }
    });
  });
}
