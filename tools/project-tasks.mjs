/** Portable root commands; package-manager path is supplied by pnpm itself. */
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const projects = ['theme/rp-usados', 'plugins/rp-usados-security', 'tools'];
async function run(command, args, options = {}) {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit', windowsHide: true, ...options });
  const code = await new Promise((done, reject) => { child.on('error', reject); child.on('close', done); });
  if (code !== 0) throw new Error(`${command} ${args.join(' ')} failed (${code}).`);
}
async function pnpm(args) {
  if (!process.env.npm_execpath) throw new Error('Run this task through the root pnpm scripts (for example, pnpm build).');
  await run(process.execPath, [process.env.npm_execpath, ...args]);
}
const node = file => run(process.execPath, [resolve(root, 'tools', file)]);
async function build() {
  try {
    for (const path of projects.slice(0, 2)) await pnpm(['--dir', path, 'build']);
    await node('check-manifests.mjs');
  } finally { await writeFile(resolve(root, 'theme/rp-usados/assets/dist/.gitkeep'), ''); }
}
async function check() {
  await node('check-js.mjs'); await node('check-php.mjs'); await pnpm(['test']); await node('check-manifests.mjs');
}
async function audit() { for (const path of projects) await pnpm(['--dir', path, 'audit', '--audit-level', 'low']); }
switch (process.argv[2]) {
  case 'setup': for (const path of projects) await pnpm(['--dir', path, 'install', '--frozen-lockfile']); break;
  case 'build': await build(); break;
  case 'check': await check(); break;
  case 'audit': await audit(); break;
  case 'verify':
    await build(); await check(); await node('security-tests.mjs'); await node('gestion-tests.mjs'); await node('cache-tests.mjs');
    await node('security-http-qa.mjs'); await node('gestion-http-runner.mjs'); await node('public-http-runner.mjs'); await audit(); await node('package-release.mjs'); await node('package-install-tests.mjs'); break;
  default: throw new Error('Expected setup, build, check, audit or verify.');
}
