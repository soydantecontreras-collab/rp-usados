import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const root = resolve(import.meta.dirname, '..'), out = resolve(root, 'tools/.preview/release-cache');
await mkdir(out, { recursive: true }); await rm(resolve(out, 'cache-report.json'), { force: true });
const blueprint = { preferredVersions: { php: '8.3', wp: '6.8' }, steps: [
  { step: 'activatePlugin', pluginPath: 'rp-usados-security/rp-usados-security.php' },
  { step: 'activateTheme', themeFolderName: 'rp-usados' },
  { step: 'setSiteOptions', options: { permalink_structure: '/%postname%/' } },
  { step: 'runPHP', code: "<?php require '/wordpress/wp-load.php'; require '/release-tests/cache.php';" },
] };
await writeFile(resolve(out, 'blueprint.json'), JSON.stringify(blueprint));
const args = ['--experimental-wasm-jspi', resolve(root, 'tools/playground.mjs'), 'run-blueprint', '--wp', '6.8', '--php', '8.3', '--blueprint', resolve(out, 'blueprint.json')];
for (const [local, remote] of [['theme/rp-usados', '/wordpress/wp-content/themes/rp-usados'], ['plugins/rp-usados-security', '/wordpress/wp-content/plugins/rp-usados-security'], ['tests/release', '/release-tests'], ['tools/.preview/release-cache', '/release-output']]) args.push('--mount-dir', resolve(root, local), remote);
const temporary = resolve(out, 'tmp'); await mkdir(temporary, { recursive: true });
const child = spawn(process.execPath, args, { cwd: root, stdio: 'inherit', env: { ...process.env, TMP: temporary, TEMP: temporary, TMPDIR: temporary } });
const code = await new Promise((done, reject) => { child.on('error', reject); child.on('close', done); });
assert.equal(code, 0);
const report = JSON.parse(await readFile(resolve(out, 'cache-report.json'), 'utf8'));
assert.equal(report.passed, report.checks.length); assert(report.passed > 0);
console.log(`Cache: ${report.passed} checks passed.`);
