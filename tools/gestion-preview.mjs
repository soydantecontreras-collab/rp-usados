/** Persistent local-only review instance. Ctrl+C stops it and removes generated credentials. */
import { resolve } from 'node:path';
import { startGestionFixture, root } from './gestion-fixture-runtime.mjs';
const fixture = await startGestionFixture({ port: Number(process.env.RP_GESTION_PORT || 9540), out: resolve(process.env.RP_GESTION_OUT || resolve(root, 'tools/.preview/gestion')) });
const stop = () => fixture.stop().catch(error => { console.error(error.message); process.exitCode = 1; });
process.once('SIGINT', stop); process.once('SIGTERM', stop);
console.log(`Local-only management preview: ${fixture.url}/gestion/`);
console.log(`Random access credentials: ${resolve(fixture.out, 'accounts.json')} (outside web root and Git).`);
await fixture.closed;
await fixture.stop();
