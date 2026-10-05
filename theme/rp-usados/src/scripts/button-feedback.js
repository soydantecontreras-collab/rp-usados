/** Tactile state only: WhatsApp remains a normal, immediate link. */
export function initButtonFeedback() {
  document.addEventListener('pointerdown', event => {
    event.target.closest('.action-whatsapp')?.classList.add('is-pressed');
  });
  const clear = () => document.querySelectorAll('.action-whatsapp.is-pressed').forEach(button => button.classList.remove('is-pressed'));
  document.addEventListener('pointerup', clear);
  document.addEventListener('pointercancel', clear);
  addEventListener('blur', clear);
}
