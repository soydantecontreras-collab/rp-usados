import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { startGestionFixture, root } from './gestion-fixture-runtime.mjs';
const fixture = await startGestionFixture({ port: Number(process.env.RP_GESTION_PORT || 9542) });
let test;
const stop = () => { test?.kill('SIGTERM'); fixture.stop().catch(error => console.error(error.message)); };
process.once('SIGINT', stop); process.once('SIGTERM', stop);
try {
  console.log(`Isolated HTTP fixture: ${fixture.url}; artifacts ${fixture.out}`);
  test = spawn(process.execPath, [resolve(root, 'tools/gestion-http-qa.mjs')], { cwd: root, stdio: 'inherit', windowsHide: true, env: { ...process.env, RP_GESTION_PORT: String(fixture.port), RP_GESTION_OUT: fixture.out } });
  const code = await new Promise((done, reject) => { test.once('error', reject); test.once('close', done); });
  if (code !== 0) throw new Error(`HTTP QA failed (${code}); see ${fixture.out}.`);
} finally { await fixture.stop(); }
