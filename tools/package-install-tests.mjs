/** Install the generated archives into a fresh disposable WordPress instance. */
import { mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { isolatedRuntimeEnv } from './runtime-env.mjs';
const root = resolve(import.meta.dirname, '..'), out = resolve(root, 'tools/.preview/package-install');
for (const file of ['rp-usados.zip', 'rp-usados-security.zip']) await access(resolve(root, 'dist', file));
await mkdir(out, { recursive: true }); await rm(resolve(out, 'install-report.json'), { force: true });
const blueprint = { preferredVersions: { php: '8.3', wp: '6.8' }, steps: [
  { step: 'installPlugin', pluginData: { resource: 'vfs', path: '/release-dist/rp-usados-security.zip' }, options: { activate: true } },
  { step: 'installTheme', themeData: { resource: 'vfs', path: '/release-dist/rp-usados.zip' }, options: { activate: true } },
  { step: 'runPHP', code: "<?php try { require '/wordpress/wp-load.php'; require '/release-tests/package-install.php'; } catch (Throwable $error) { echo 'PACKAGE_INSTALL_FAILURE: ' . $error->getMessage() . ' at ' . $error->getFile() . ':' . $error->getLine(); throw $error; }" },
] };
await writeFile(resolve(out, 'blueprint.json'), JSON.stringify(blueprint));
const args = ['--experimental-wasm-jspi', resolve(root, 'tools/playground.mjs'), 'run-blueprint', '--blueprint', resolve(out, 'blueprint.json')];
for (const [local, remote] of [['dist', '/release-dist'], ['tests/release', '/release-tests'], ['tools/.preview/package-install', '/release-output']]) args.push('--mount-dir', resolve(root, local), remote);
const child = spawn(process.execPath, args, { cwd: root, stdio: 'inherit', windowsHide: true, env: await isolatedRuntimeEnv(out) });
const code = await new Promise((done, reject) => { child.on('error', reject); child.on('close', done); });
assert.equal(code, 0);
const report = JSON.parse(await readFile(resolve(out, 'install-report.json'), 'utf8'));
assert.equal(report.passed, report.checks.length); assert(report.passed > 0);
console.log(`ZIP installation: ${report.passed} checks passed.`);
