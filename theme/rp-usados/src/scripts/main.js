import '../styles/main.scss';

/**
 * Future motion contract: [data-motion="hero"], "hero-title", "hero-actions",
 * "contour" and "trajectory". All content is visible in the static HTML.
 *
 * When motion is approved, use a conditional dynamic import of gsap and
 * gsap/ScrollTrigger, gsap.matchMedia(), and context.revert() on cleanup.
 * Respect live changes to prefers-reduced-motion. Never hide content in CSS
 * in anticipation of a JS animation.
 *
 * No runtime interaction is needed yet. Navigation, media controls and all
 * links work natively, including without JavaScript.
 */
