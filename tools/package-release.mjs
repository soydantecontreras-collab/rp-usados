import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { packages } from './package-config.mjs';
import { writePackage, verifyPackage } from './package-utils.mjs';
import { root, checkManifests } from './check-manifests.mjs';
await checkManifests();
const results = [];
for (const pkg of packages) {
  const target = resolve(root, 'dist', `${pkg.name}.zip`), result = await writePackage(pkg, target);
  const count = await verifyPackage(pkg, target);
  const first = await readFile(target); await writePackage(pkg, target);
  if (!first.equals(await readFile(target))) throw new Error(`${pkg.name}: ZIP is not reproducible.`);
  results.push(result); console.log(`${pkg.name}: ${count} files; ${result.bytes} bytes; SHA-256 ${result.sha256}`);
}
await writeFile(resolve(root, 'dist/release-manifest.json'), JSON.stringify({ sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), sourceDirty: !!execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim(), packages: results }, null, 2) + '\n');
