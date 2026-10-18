import { resolve } from 'node:path';
import { packages } from './package-config.mjs';
import { writePackage, verifyPackage } from './package-utils.mjs';
import { root } from './check-manifests.mjs';
const pkg = packages.find(item => item.name === 'rp-usados-security'), target = resolve(root, 'dist', `${pkg.name}.zip`);
const result = await writePackage(pkg, target); await verifyPackage(pkg, target);
console.log(`Plugin: ${target} (${result.bytes} bytes; ${result.sha256})`);
