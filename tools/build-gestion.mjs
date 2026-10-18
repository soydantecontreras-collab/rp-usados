import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(resolve(root, 'theme/rp-usados/package.json'));
const { build } = await import(pathToFileURL(require.resolve('vite')).href);
const output = resolve(root, 'plugins/rp-usados-security/assets/gestion');
await build({ configFile: false, root, base: './', publicDir: resolve(root, 'theme/rp-usados/src/fonts'), build: {
  outDir: output, emptyOutDir: true, manifest: true, target: 'es2020',
  rollupOptions: { input: resolve(root, 'plugins/rp-usados-security/src/gestion/main.js'),
    output: { entryFileNames: 'gestion-[hash].js', assetFileNames: '[name]-[hash][extname]' } },
} });
await mkdir(output, { recursive: true });
for (const family of ['manrope', 'archivo']) {
  await copyFile(resolve(root, `theme/rp-usados/src/fonts/${family}.woff2`), resolve(output, `${family}.woff2`));
}
const manifest = JSON.parse(await readFile(resolve(output, '.vite/manifest.json'), 'utf8'));
const entry = Object.values(manifest).find(item => item.isEntry);
await writeFile(resolve(output, 'manifest.json'), JSON.stringify({ 'main.js': entry.file, 'main.css': entry.css[0], 'manrope.woff2': 'manrope.woff2', 'archivo.woff2': 'archivo.woff2' }, null, 2));
