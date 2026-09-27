import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const directory = dirname(fileURLToPath(import.meta.url));
const repo = resolve(directory, '../..');
export default {
  root: resolve(directory, '..'),
  publicDir: resolve(directory, 'public'),
  resolve: { alias: { gsap: resolve(repo, 'theme/rp-usados/node_modules/gsap') } },
  server: { host: '127.0.0.1', port: 9420, strictPort: true, fs: { allow: [repo] } },
  build: {
    outDir: resolve(directory, 'dist'), emptyOutDir: true,
    rollupOptions: { input: {
      main: resolve(directory, 'index.html'),
      compact: resolve(directory, 'compact/index.html'),
      mobile: resolve(directory, 'mobile-study/index.html'),
      transition: resolve(directory, 'transition/index.html'),
      transitionPronounced: resolve(directory, 'transition/pronounced/index.html'),
    } },
  },
};
