/** Full public regression against an isolated, clearly labelled DEMO inventory. */
import { spawn } from 'node:child_process';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { startGestionFixture, root } from './gestion-fixture-runtime.mjs';
const out = resolve(root, 'tools/.preview', `public-http-${randomUUID()}`); await mkdir(out, { recursive: true });
const code = await new Promise((done, reject) => {
  const child = spawn(process.execPath, [resolve(root, 'tools/create-demo-preview.mjs')], { cwd: root, stdio: 'inherit', windowsHide: true, env: { ...process.env, RP_DEMO_OUT: out } });
  child.once('error', reject); child.once('close', done);
});
if (code !== 0) throw new Error('Could not generate public DEMO blueprint.');
const blueprint = JSON.parse(await readFile(resolve(out, 'blueprint.json'), 'utf8'));
const fixture = await startGestionFixture({ port: Number(process.env.RP_PUBLIC_PORT || 9543), out, blueprint, requiresAccounts: false, readyPath: '/' });
let test;
const stop = () => { test?.kill('SIGTERM'); fixture.stop().catch(error => console.error(error.message)); };
process.once('SIGINT', stop); process.once('SIGTERM', stop);
try {
  console.log(`Isolated public fixture: ${fixture.url}; artifacts ${out}`);
  test = spawn(process.execPath, [resolve(root, 'tools/final-closure-qa.mjs')], { cwd: root, stdio: 'inherit', windowsHide: true, env: { ...process.env, RP_DEMO_URL: fixture.url, RP_QA_OUT: resolve(out, 'qa') } });
  const result = await new Promise((done, reject) => { test.once('error', reject); test.once('close', done); });
  if (result !== 0) throw new Error(`Public QA failed (${result}); see ${out}.`);
} finally { await fixture.stop(); }
