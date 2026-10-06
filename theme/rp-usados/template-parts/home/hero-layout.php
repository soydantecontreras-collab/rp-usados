<?php defined( 'ABSPATH' ) || exit; ?>
<script>
// Establish scroll geometry before paint, without waiting for the media/GSAP module.
(() => {
    const root = document.documentElement;
    const mobile = matchMedia('(max-width: 899px), (hover: none) and (pointer: coarse)');
    let width = innerWidth;
    function measure() {
        if (!mobile.matches) {
            root.style.removeProperty('--hero-stable-viewport');
            return;
        }
        const probe = document.createElement('div');
        probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;width:0;contain:strict;height:100vh';
        root.appendChild(probe);
        try {
            if (CSS.supports('height', '100svh')) probe.style.height = '100svh';
            const small = probe.getBoundingClientRect().height || innerHeight;
            // The small viewport also fits after a reload with toolbars hidden:
            // restoring the toolbar must not push the CTA outside the envelope.
            root.style.setProperty('--hero-stable-viewport', `${small}px`);
        } finally { probe.remove(); }
    }
    try {
        measure();
        if (!matchMedia('(prefers-reduced-motion: reduce)').matches && !navigator.connection?.saveData) {
            root.dataset.heroLayout = 'scroll';
        }
        // Toolbar/keyboard height changes leave the composition alone. A new
        // width/orientation establishes a fresh composition for that viewport.
        addEventListener('resize', () => {
            if (innerWidth === width) return;
            width = innerWidth;
            measure();
        }, { passive: true });
    } catch { /* Native static layout and poster remain available. */ }
})();
</script>
