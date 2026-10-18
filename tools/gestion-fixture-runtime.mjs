/** Own the disposable Playground process and credentials; never attach to an existing listener. */
import { mkdir, writeFile, readFile, rm, realpath } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve, relative, isAbsolute } from 'node:path';
import { randomUUID } from 'node:crypto';
import net from 'node:net';
export const root = resolve(import.meta.dirname, '..');
const previews = resolve(root, 'tools/.preview');
export async function startGestionFixture({ port = 9542, out = resolve(previews, `gestion-http-${randomUUID()}`), blueprint: suppliedBlueprint, requiresAccounts = true, readyPath = '/gestion/' } = {}) {
  out = resolve(out);
  if (!Number.isInteger(Number(port)) || Number(port) < 1024 || Number(port) > 65535) throw new Error('Expected a non-privileged TCP port.');
  if (!relative(previews, out) || relative(previews, out).startsWith('..') || isAbsolute(relative(previews, out))) throw new Error('Fixture output must be a subdirectory of tools/.preview.');
  // Refuse to overwrite credentials or accidentally run against somebody else's local instance.
  let previous;
  try { previous = JSON.parse(await readFile(resolve(out, 'runtime.json'), 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (previous) {
    if (previous.kind !== 'rp-usados-owned-preview' || !Number.isInteger(previous.pid)) throw new Error('Unrecognized preview ownership record.');
    let alive = false; try { process.kill(previous.pid, 0); alive = true; } catch (error) { if (error.code !== 'ESRCH') throw error; }
    if (alive) throw new Error(`Fixture output already belongs to active PID ${previous.pid}.`);
  }
  const probe = net.createServer();
  await new Promise((done, reject) => { probe.once('error', reject); probe.listen(Number(port), '127.0.0.1', done); });
  await new Promise(done => probe.close(done));
  await mkdir(out, { recursive: true });
  const physicalBase = await realpath(previews), physicalOut = await realpath(out);
  if (!relative(physicalBase, physicalOut) || relative(physicalBase, physicalOut).startsWith('..') || isAbsolute(relative(physicalBase, physicalOut))) throw new Error('Preview symlink escapes tools/.preview.');
  await rm(resolve(out, 'accounts.json'), { force: true });
  const blueprint = suppliedBlueprint || { preferredVersions: { php: '8.3', wp: '6.8' }, steps: [
    { step: 'activatePlugin', pluginPath: 'rp-usados-security/rp-usados-security.php' },
    { step: 'activateTheme', themeFolderName: 'rp-usados' },
    { step: 'setSiteOptions', options: { blogname: 'RP Usados — DEMO LOCAL', permalink_structure: '/%postname%/', timezone_string: 'America/Argentina/Buenos_Aires' } },
    { step: 'runPHP', code: "<?php require '/wordpress/wp-load.php'; require '/gestion-tests/demo-fixture.php';" },
  ] };
  await writeFile(resolve(out, 'blueprint.json'), JSON.stringify(blueprint));
  const temp = resolve(out, 'tmp'); await mkdir(temp, { recursive: true });
  const args = ['--experimental-wasm-jspi', resolve(root, 'tools/playground.mjs'), 'server', '--no-login', '--port', String(port), '--workers', '2', '--wp', '6.8', '--php', '8.3', '--define-bool', 'DISABLE_WP_CRON', 'true', '--define-bool', 'AUTOMATIC_UPDATER_DISABLED', 'true', '--define-bool', 'WP_AUTO_UPDATE_CORE', 'false', '--blueprint', resolve(out, 'blueprint.json')];
  for (const [local, remote] of [['theme/rp-usados', '/wordpress/wp-content/themes/rp-usados'], ['plugins/rp-usados-security', '/wordpress/wp-content/plugins/rp-usados-security'], ['tests/gestion', '/gestion-tests'], ['tools/demo-fixtures', '/gestion-fixtures']]) args.push('--mount-dir', resolve(root, local), remote);
  args.push('--mount-dir', out, '/gestion-output');
  const child = spawn(process.execPath, args, { cwd: root, stdio: ['ignore','pipe','pipe'], windowsHide: true, env: { ...process.env, RP_USADOS_ALLOW_LAN: '0', TMP: temp, TEMP: temp, TMPDIR: temp } });
  let output = '', stopped = false;
  const closed = new Promise(done => child.once('close', done));
  const ready = new Promise((done, reject) => {
    const capture = value => { output += value; if (output.includes('WordPress is running on')) done(); };
    child.stdout.on('data', capture); child.stderr.on('data', capture);
    child.once('error', reject); child.once('exit', code => reject(new Error(`Fixture exited ${code}: ${output.slice(-5000)}`)));
  });
  await writeFile(resolve(out, 'runtime.json'), JSON.stringify({ pid: child.pid, port: Number(port), created: new Date().toISOString(), kind: 'rp-usados-owned-preview' }));
  const stop = async () => {
    if (stopped) return; stopped = true;
    if (child.exitCode === null) child.kill('SIGTERM');
    const graceful = await Promise.race([closed.then(() => true), new Promise(done => { const timer = setTimeout(() => done(false), 10000); timer.unref(); })]);
    if (!graceful) { child.kill('SIGKILL'); await closed; }
    await rm(resolve(out, 'accounts.json'), { force: true }); await rm(resolve(out, 'runtime.json'), { force: true });
  };
  try {
    await Promise.race([ready, new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error('Playground startup exceeded 180 seconds.')), 180000); timer.unref(); })]);
    // Complete Playground's one-time boot redirect before any test sends a POST.
    const response = await fetch(`http://127.0.0.1:${port}${readyPath}`);
    if (!response.ok) throw new Error(`Fixture login page returned ${response.status}.`);
    if (requiresAccounts) await readFile(resolve(out, 'accounts.json'), 'utf8');
    return { child, closed, out, port: Number(port), url: `http://127.0.0.1:${port}`, stop };
  } catch (error) { await stop(); throw error; }
}
