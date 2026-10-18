/** Explicit cleanup of one stopped, repository-owned preview; never sweeps system temp. */
import { readFile, realpath, rm } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
export async function cleanPreview(input, { remove = false } = {}) {
  const base = await realpath(resolve(import.meta.dirname, '.preview'));
  const target = await realpath(resolve(input || ''));
  const local = relative(base, target);
  if (!local || local.startsWith('..') || isAbsolute(local)) throw new Error('Only a single child of tools/.preview may be cleaned.');
  let runtime;
  try { runtime = JSON.parse(await readFile(resolve(target, 'runtime.json'), 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (runtime) {
    if (runtime.kind !== 'rp-usados-owned-preview' || !Number.isInteger(runtime.pid)) throw new Error('Unrecognized preview ownership record.');
    let alive = false;
    try { process.kill(runtime.pid, 0); alive = true; } catch (error) { if (error.code !== 'ESRCH') throw error; }
    if (alive) throw new Error(`Preview PID ${runtime.pid} is alive. Stop it before cleaning.`);
  }
  if (remove) await rm(target, { recursive: true, force: false });
  return target;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = process.argv.find(arg => arg.startsWith('--path='))?.slice(7);
  if (!target) throw new Error('Use pnpm clean:preview --path=tools/.preview/<stopped-preview> [--remove]. Dry-run by default.');
  console.log(`${process.argv.includes('--remove') ? 'Removed' : 'Would remove'}: ${await cleanPreview(target, { remove: process.argv.includes('--remove') })}`);
}
