import '../styles/main.scss';

if (document.querySelector('[data-hero-3d]')) {
  import('./hero/bootstrap.js').then(({ bootHero }) => bootHero()).catch(() => {
    // The server-rendered poster and catalog link remain the complete fallback.
  });
}

// The remaining templates keep their native HTML behavior without motion imports.
