import { test } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { installPlaygroundNetworkPolicy } from './playground-network.mjs';

for (const allowLan of [false, true]) {
  test(`Playground actual TCP bind ${allowLan ? 'explicit LAN' : 'loopback default'}`, async () => {
    const restore = installPlaygroundNetworkPolicy({ allowLan });
    const server = net.createServer();
    try {
      await new Promise(resolve => server.listen(0, resolve));
      assert.equal(server.address().address, allowLan ? '0.0.0.0' : '127.0.0.1');
    } finally { await new Promise(resolve => server.close(resolve)); restore(); }
  });
}
test('Vite defaults restrict bind and CORS; LAN needs explicit origins', async () => {
  const saved = { lan: process.env.RP_USADOS_ALLOW_LAN, origins: process.env.RP_USADOS_DEV_ORIGINS };
  try {
    delete process.env.RP_USADOS_ALLOW_LAN; delete process.env.RP_USADOS_DEV_ORIGINS;
    const { default: normal } = await import('../theme/rp-usados/vite.config.js?security=loopback');
    assert.equal(normal.server.host, '127.0.0.1');
    assert(normal.server.cors.origin.test('http://127.0.0.1:9470'));
    assert(!normal.server.cors.origin.test('https://attacker.example'));
    process.env.RP_USADOS_ALLOW_LAN = '1';
    await assert.rejects(import('../theme/rp-usados/vite.config.js?security=missing-origin'), /LAN requiere/);
    process.env.RP_USADOS_DEV_ORIGINS = 'http://192.168.1.50:9470';
    const { default: lan } = await import('../theme/rp-usados/vite.config.js?security=explicit-lan');
    assert.equal(lan.server.host, '0.0.0.0');
    assert.deepEqual(lan.server.cors.origin, ['http://192.168.1.50:9470']);
  } finally {
    for (const [key,value] of [['RP_USADOS_ALLOW_LAN',saved.lan],['RP_USADOS_DEV_ORIGINS',saved.origins]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
