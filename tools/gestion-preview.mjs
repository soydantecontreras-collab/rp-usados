/** Run from root. Local-only runtime; randomized accounts live outside webroot and Git. */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'tools/.preview/gestion');
await mkdir(out, { recursive: true });
const blueprint = { steps: [
  { step: 'activatePlugin', pluginPath: 'rp-usados-security/rp-usados-security.php' },
  { step: 'activateTheme', themeFolderName: 'rp-usados' },
  { step: 'setSiteOptions', options: { blogname: 'RP Usados — DEMO LOCAL', permalink_structure: '/%postname%/', timezone_string: 'America/Argentina/Buenos_Aires' } },
  { step: 'runPHP', code: "<?php require '/wordpress/wp-load.php'; require '/gestion-tests/demo-fixture.php';" },
] };
await writeFile(resolve(out, 'blueprint.json'), JSON.stringify(blueprint));
const port = process.env.RP_GESTION_PORT || '9540';
const args = ['--experimental-wasm-jspi', resolve(root, 'tools/playground.mjs'), 'server', '--no-login', '--port', port, '--workers', '6', '--wp', '6.8', '--php', '8.3', '--define-bool', 'DISABLE_WP_CRON', 'true', '--define-bool', 'AUTOMATIC_UPDATER_DISABLED', 'true', '--define-bool', 'WP_AUTO_UPDATE_CORE', 'false', '--blueprint', resolve(out, 'blueprint.json')];
for (const [local, remote] of [['theme/rp-usados', '/wordpress/wp-content/themes/rp-usados'], ['plugins/rp-usados-security', '/wordpress/wp-content/plugins/rp-usados-security'], ['tests/gestion', '/gestion-tests'], ['tools/demo-fixtures', '/gestion-fixtures'], ['tools/.preview/gestion', '/gestion-output']]) args.push('--mount-dir', resolve(root, local), remote);
const child = spawn(process.execPath, args, { cwd: root, stdio: 'inherit' });
process.on('SIGINT', () => child.kill()); process.on('SIGTERM', () => child.kill());
child.on('close', code => { process.exitCode = code; });
