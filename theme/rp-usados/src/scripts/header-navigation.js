/** Progressive enhancement of native header anchors and mobile disclosure. */
export function initHeaderNavigation() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const menu = header.querySelector('.header-menu');
  const toggle = header.querySelector('.header-menu-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width:899px), (hover:none) and (pointer:coarse)');
  function setOpen(open, returnFocus = false) {
    menu.open = open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? toggle.dataset.closeLabel : toggle.dataset.openLabel);
    if (returnFocus) toggle.focus({ preventScroll:true });
  }
  toggle.addEventListener('click', () => setOpen(!menu.open));

  header.querySelectorAll('.header-navigation a').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      setOpen(false);
      const destination = new URL(link.href);
      if (destination.origin !== location.origin || destination.pathname !== location.pathname || destination.search !== location.search) return;
      const target = document.getElementById(decodeURIComponent(destination.hash.slice(1)));
      if (!target) return;
      event.preventDefault();
      if (location.hash !== destination.hash) history.pushState(null, '', destination.hash);
      target.scrollIntoView({ block:'start', behavior:reduced.matches ? 'instant' : 'smooth' });
      // Move keyboard navigation to the selected section without another scroll.
      const hadTabindex = target.hasAttribute('tabindex');
      if (!hadTabindex) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll:true });
      if (!hadTabindex) target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once:true });
    });
  });
  header.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !menu.open) return;
    setOpen(false, true);
  });
  document.addEventListener('click', event => {
    if (menu.open && !menu.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
  });
  mobile.addEventListener('change', () => setOpen(false));
  // Native summary remains the baseline until the enhancement is ready.
  menu.querySelector('summary').hidden = true;
  menu.setAttribute('data-enhanced', '');
  toggle.hidden = false;
}
