/** Shipping allowlist. Source renders, V1, fixtures and tools are never traversed. */
export const packages = [
  { name: 'rp-usados', directory: 'theme/rp-usados', build: 'theme/rp-usados/assets/dist',
    files: ['archive-vehiculo.php', 'footer.php', 'front-page.php', 'functions.php', 'header.php', 'index.php', 'single-vehiculo.php', 'style.css',
      'assets/brand/silhouette.svg', 'assets/brand/whatsapp.svg',
      'assets/hero/v2/hero-desktop-1080-crf18.mp4', 'assets/hero/v2/hero-desktop-1080-crf18-poster.png',
      'assets/hero/v2/hero-mobile-v4-1080-crf18.mp4', 'assets/hero/v2/hero-mobile-v4-1080-crf18-poster.png',
      'assets/institutional/local-institucional-480.jpg', 'assets/institutional/local-institucional-960.jpg',
      'assets/institutional/local-institucional-480.webp', 'assets/institutional/local-institucional-720.webp', 'assets/institutional/local-institucional-960.webp',
      ...['catalog', 'contact', 'hero', 'hero-layout', 'location', 'services', 'trajectory'].map(name => `template-parts/home/${name}.php`),
      ...['card', 'empty', 'whatsapp'].map(name => `template-parts/vehicle/${name}.php`)],
    directories: [{ name: 'inc', extensions: ['.php'] }, { name: 'licenses', extensions: ['.txt', '.md'] }],
  },
  { name: 'rp-usados-security', directory: 'plugins/rp-usados-security', build: 'plugins/rp-usados-security/assets/dist',
    files: ['rp-usados-security.php', 'README.md'],
    directories: [{ name: 'inc', extensions: ['.php'] }, { name: 'templates/gestion', extensions: ['.php'] }, { name: 'licenses', extensions: ['.txt', '.md'] }],
  },
];
