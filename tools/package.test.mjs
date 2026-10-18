import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from './check-manifests.mjs';
import { packages } from './package-config.mjs';
import { shippingFiles, zipEntries } from './package-utils.mjs';
test('shipping allowlists contain only runtime files and the two approved hero resources', async () => {
  for (const pkg of packages) {
    const files = await shippingFiles(pkg);
    assert(files.length > 0);
    assert(!files.some(file => /(?:^|\/)(?:node_modules|src|tests|tools|explorations|blender|references)(?:\/|$)|\.blend$|\.glb$|\.hdr$|(?:^|\/)\.env|(?:^|\/)(?:accounts|credentials|secrets)[^/]*\.json$/.test(file)));
    assert(!files.some(file => file.startsWith('assets/gestion/') || /hero-mobile-(?:portrait|v3)|hero-fast-dark|v6-1/.test(file)));
    if (pkg.name === 'rp-usados') assert.equal(files.filter(file => file.endsWith('.mp4')).length, 2);
  }
});
test('ZIP reader refuses non-archives and truncated headers', () => {
  assert.throws(() => zipEntries(Buffer.from('not a ZIP')), /Invalid ZIP/);
});
test('private/public manifests reference only present build files', async () => {
  for (const pkg of packages) assert(JSON.parse(await readFile(new URL(`../${pkg.build}/.vite/manifest.json`, import.meta.url), 'utf8')));
});
test('every literal public template-part dependency is shipped', async () => {
  const pkg = packages.find(item => item.name === 'rp-usados'), files = await shippingFiles(pkg);
  for (const file of files.filter(path => path.endsWith('.php'))) {
    const source = await readFile(resolve(root, pkg.directory, file), 'utf8');
    for (const match of source.matchAll(/get_template_part\s*\(\s*(['"])([^'"]+)\1/g)) assert(files.includes(`${match[2]}.php`), `${file} needs ${match[2]}.php`);
  }
});
