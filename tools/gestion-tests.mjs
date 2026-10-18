/** Service/REST contract checks in disposable WordPress, no client inventory. */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const root = resolve(import.meta.dirname, '..'), out = resolve(root, 'tools/.preview/gestion');
await mkdir(out, { recursive: true }); await rm(resolve(out, 'report.json'), { force: true });
const blueprint = { preferredVersions: { php: '8.3', wp: '6.8' }, steps: [
  { step: 'activatePlugin', pluginPath: 'rp-usados-security/rp-usados-security.php' },
  { step: 'activateTheme', themeFolderName: 'rp-usados' },
  { step: 'runPHP', code: "<?php require '/wordpress/wp-load.php'; try { require '/gestion-tests/gestion.php'; } catch (Throwable $e) { echo 'RP_GESTION_FAILURE=' . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine(); throw $e; }" },
] };
await writeFile(resolve(out, 'blueprint.json'), JSON.stringify(blueprint));
const args = [resolve(root, 'tools/playground.mjs'), 'run-blueprint', '--wp', '6.8', '--php', '8.3', '--blueprint', resolve(out, 'blueprint.json')];
for (const [local, remote] of [['theme/rp-usados','/wordpress/wp-content/themes/rp-usados'], ['plugins/rp-usados-security','/wordpress/wp-content/plugins/rp-usados-security'], ['tests/gestion','/gestion-tests'], ['tools/demo-fixtures','/gestion-fixtures']]) args.push('--mount-dir', resolve(root, local), remote);
args.push('--mount-dir', out, '/gestion-output');
const child = spawn(process.execPath, args, { cwd: root, stdio: ['ignore','pipe','pipe'] });
child.stdout.on('data', x => process.stdout.write(x)); child.stderr.on('data', x => process.stderr.write(x));
const code = await new Promise((done, reject) => { child.on('error', reject); child.on('close', done); });
assert.equal(code, 0, 'WordPress gestion service fixture failed');
const report = JSON.parse(await readFile(resolve(out, 'report.json'), 'utf8'));
assert(report.passed > 0 && report.passed === report.checks.length);
console.log(`Gestión: ${report.passed} checks passed on WordPress ${report.wp} / PHP ${report.php}.`);
