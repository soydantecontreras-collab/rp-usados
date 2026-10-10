import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'tools/.preview/security');
await mkdir(out, { recursive: true });
await rm(resolve(out, 'report.json'), { force: true });
const blueprint = { preferredVersions: { php: '8.3', wp: '6.8' }, steps: [
  { step: 'activatePlugin', pluginPath: 'rp-usados-security/rp-usados-security.php' },
  { step: 'activateTheme', themeFolderName: 'rp-usados' },
  { step: 'runPHP', code: "<?php require '/wordpress/wp-load.php'; try { require '/security-tests/security.php'; } catch (Throwable $e) { echo 'RP_SECURITY_FAILURE=' . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine(); throw $e; }" },
] };
await writeFile(resolve(out, 'blueprint.json'), JSON.stringify(blueprint));
const args = [resolve(root, 'tools/playground.mjs'), 'run-blueprint', '--wp', '6.8', '--php', '8.3', '--blueprint', resolve(out, 'blueprint.json')];
for (const [local, remote] of [['theme/rp-usados','/wordpress/wp-content/themes/rp-usados'], ['plugins/rp-usados-security','/wordpress/wp-content/plugins/rp-usados-security'], ['tests/security','/security-tests'], ['tools/demo-fixtures','/security-fixtures']]) args.push('--mount-dir', resolve(root, local), remote);
args.push('--mount-dir', out, '/security-output');
const child = spawn(process.execPath, args, { cwd: root, stdio: ['ignore','pipe','pipe'] });
let output = ''; child.stdout.on('data', x => { output += x; process.stdout.write(x); }); child.stderr.on('data', x => { output += x; process.stderr.write(x); });
const code = await new Promise((done, reject) => { child.on('error', reject); child.on('close', done); });
assert.equal(code, 0, 'WordPress security fixture failed');
const report = JSON.parse(await readFile(resolve(out, 'report.json'), 'utf8'));
assert(report.passed > 0 && report.passed === report.checks.length, 'Missing successful test result');
console.log(`Security: ${report.passed} checks passed on WordPress ${report.wp} / PHP ${report.php}.`);
