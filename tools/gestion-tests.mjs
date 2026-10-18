import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { isolatedRuntimeEnv } from './runtime-env.mjs';
const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'tools/.preview/gestion-tests');
await mkdir(out, { recursive: true }); await rm(resolve(out, 'service-report.json'), { force: true });
const blueprint = { preferredVersions: { php: '8.3', wp: '6.8' }, steps: [
  { step: 'activatePlugin', pluginPath: 'rp-usados-security/rp-usados-security.php' },
  { step: 'activateTheme', themeFolderName: 'rp-usados' },
  { step: 'runPHP', code: "<?php require '/wordpress/wp-load.php'; try { require '/gestion-tests/service.php'; } catch (Throwable $e) { echo 'GESTION_FAILURE=' . $e->getMessage() . ' ' . $e->getFile() . ':' . $e->getLine(); throw $e; }" },
] };
await writeFile(resolve(out, 'blueprint.json'), JSON.stringify(blueprint));
const args = ['--experimental-wasm-jspi', resolve(root, 'tools/playground.mjs'), 'run-blueprint', '--wp', '6.8', '--php', '8.3', '--blueprint', resolve(out, 'blueprint.json')];
for (const [local, remote] of [['theme/rp-usados', '/wordpress/wp-content/themes/rp-usados'], ['plugins/rp-usados-security', '/wordpress/wp-content/plugins/rp-usados-security'], ['tests/gestion', '/gestion-tests'], ['tools/demo-fixtures', '/gestion-fixtures']]) args.push('--mount-dir', resolve(root, local), remote);
args.push('--mount-dir', out, '/gestion-output');
const child = spawn(process.execPath, args, { cwd: root, stdio: 'inherit', windowsHide: true, env: await isolatedRuntimeEnv(out) });
const code = await new Promise((done, reject) => { child.on('error', reject); child.on('close', done); });
assert.equal(code, 0);
const report = JSON.parse(await readFile(resolve(out, 'service-report.json'), 'utf8'));
assert.equal(report.passed, report.checks.length); console.log(`Gestión service/REST: ${report.passed} checks.`);
await rm(resolve(out, 'accounts.json'), { force: true });
