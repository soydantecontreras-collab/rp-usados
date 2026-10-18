import { resolve } from 'node:path';
import { packages } from '../../../tools/package-config.mjs';
import { writePackage, verifyPackage } from '../../../tools/package-utils.mjs';
import { root } from '../../../tools/check-manifests.mjs';
const pkg = packages.find(item => item.name === 'rp-usados'), target = resolve(root, 'dist', `${pkg.name}.zip`);
const result = await writePackage(pkg, target); await verifyPackage(pkg, target);
console.log(`Tema: ${target} (${result.bytes} bytes; ${result.sha256})`);
