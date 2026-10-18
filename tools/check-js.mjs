/** Syntax checks only; browser modules are not executed in Node. */
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = resolve(import.meta.dirname, '..'); let count = 0;
async function walk(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (['node_modules', 'assets', '.preview'].includes(entry.name)) continue;
    const file = resolve(path, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (/\.(?:mjs|js)$/.test(entry.name)) {
      const result = spawnSync(process.execPath, ['--check', file], { cwd: root, encoding: 'utf8', windowsHide: true });
      if (result.status !== 0) throw new Error(`${file}: ${result.stderr || result.error}`);
      count++;
    }
  }
}
for (const path of ['tools', 'theme/rp-usados/src/scripts', 'plugins/rp-usados-security/src']) await walk(resolve(root, path));
console.log(`JavaScript: ${count} source files passed Node syntax checks.`);
