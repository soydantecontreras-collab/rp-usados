/** Actual cookies, native admin-AJAX uploads and REST. Disposable WordPress only. */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..'), out = resolve(root, 'tools/.preview/security-http');
await mkdir(out, { recursive: true });
await rm(resolve(out, 'accounts.json'), { force: true });
const blueprint = { steps: [
  { step: 'activatePlugin', pluginPath: 'rp-usados-security/rp-usados-security.php' },
  { step: 'activateTheme', themeFolderName: 'rp-usados' },
  { step: 'setSiteOptions', options: { permalink_structure: '/%postname%/' } },
  { step: 'runPHP', code: "<?php require '/wordpress/wp-load.php'; require '/security-tests/http-fixture.php';" },
] };
await writeFile(resolve(out, 'blueprint.json'), JSON.stringify(blueprint));
const port = Number(process.env.RP_SECURITY_HTTP_PORT || 9532), base = `http://127.0.0.1:${port}`;
const args = ['--experimental-wasm-jspi', resolve(root, 'tools/playground.mjs'), 'server', '--no-login', '--port', String(port), '--workers', '2', '--wp', '6.8', '--php', '8.3', '--blueprint', resolve(out, 'blueprint.json')];
for (const [local, remote] of [['theme/rp-usados','/wordpress/wp-content/themes/rp-usados'], ['plugins/rp-usados-security','/wordpress/wp-content/plugins/rp-usados-security'], ['tests/security','/security-tests'], ['tools/demo-fixtures','/security-fixtures'], ['tools/.preview/security-http','/security-output']]) args.push('--mount-dir', resolve(root, local), remote);
const child = spawn(process.execPath, args, { cwd: root, stdio: ['ignore','pipe','pipe'] });
let output = '', browser;
const ready = new Promise((done, reject) => {
  child.on('error', reject);
  child.on('exit', code => reject(new Error(`Fixture exited ${code}: ${output}`)));
  const capture = data => { output += data; if (output.includes('WordPress is running on')) done(); };
  child.stdout.on('data', capture); child.stderr.on('data', capture);
});
const checks = [], check = (name, result) => { assert(result, name); checks.push(name); };
try {
  await Promise.race([ready, new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error('Fixture readiness deadline exceeded')), 120000); timer.unref(); })]);
  const fixture = JSON.parse(await readFile(resolve(out, 'accounts.json'), 'utf8'));
  const require = createRequire(process.env.RP_PLAYWRIGHT_PACKAGE || 'C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
  const { chromium } = require('playwright');
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const plain = await browser.newContext();
  // Playground's first request completes a one-time boot redirect. Use a GET,
  // otherwise a redirected POST is converted to GET by the HTTP client.
  await plain.request.get(base);
  const anonymousCreate = await plain.request.post(`${base}/wp-json/wp/v2/vehiculo`, { data: { title: 'DENIED' }, maxRedirects: 0 });
  check('HTTP anonymous cannot create vehicle', anonymousCreate.status() === 401);
  const bytes = await readFile(resolve(root, 'tools/demo-fixtures/square.png'));
  const anonymousUpload = await plain.request.post(`${base}/wp-admin/async-upload.php`, { maxRedirects: 0, multipart: { action: 'upload-attachment', 'async-upload': { name: 'test.png', mimeType: 'image/png', buffer: bytes } } });
  const anonymousBody = await anonymousUpload.text();
  check('HTTP anonymous cannot upload', !anonymousUpload.ok() || ['0', '-1'].includes(anonymousBody.trim()) || anonymousBody.includes('"success":false'));
  await plain.close();
  for (const role of ['subscriber', 'manager']) {
    const account = fixture.accounts[role], context = await browser.newContext(), page = await context.newPage();
    await page.goto(`${base}/wp-login.php`);
    await page.locator('#user_login').fill(account.login);
    await page.locator('#user_pass').fill(account.password);
    await Promise.all([page.waitForNavigation(), page.locator('#wp-submit').click()]);
    const response = await page.goto(`${base}/wp-admin/post.php?post=${fixture.vehicle}&action=edit`);
    if (role === 'subscriber') {
      check('HTTP subscriber native editor denied', response.status() === 403);
      await context.close(); continue;
    }
    check('HTTP manager native vehicle editor allowed', response.status() === 200 && await page.locator('#rp-vehicle-data').count() === 1);
    check('HTTP manager lacks unrelated admin capabilities', (await context.request.get(`${base}/wp-admin/options-general.php`)).status() === 403 && (await context.request.get(`${base}/wp-admin/plugins.php`)).status() === 403);
    const config = await page.evaluate(() => ({ rest: window.wpApiSettings?.nonce, upload: window._wpPluploadSettings?.defaults?.multipart_params?._wpnonce }));
    assert(config.rest && config.upload, 'Native WordPress emitted session-bound nonces');
    const rest = (method, route, data = {}, nonce = config.rest) => context.request.fetch(`${base}/wp-json/wp/v2/${route}`, { method, data, headers: { 'X-WP-Nonce': nonce } });
    check('HTTP cookie-auth REST rejects invalid CSRF nonce', (await rest('POST', `vehiculo/${fixture.vehicle}`, { title: 'DENIED' }, 'invalid')).status() === 403);
    check('HTTP cookie-auth REST edits authorized vehicle', (await rest('POST', `vehiculo/${fixture.vehicle}`, { title: 'HTTP UPDATED FIXTURE' })).status() === 200);
    check('HTTP manager cannot create normal posts', (await rest('POST', 'posts', { title: 'DENIED' })).status() === 403);
    check('HTTP forged featured-media ID rejected', (await rest('POST', `vehiculo/${fixture.vehicle}`, { featured_media: fixture.foreign })).status() === 403);
    const upload = (nonce, buffer = bytes, name = 'test.png', target = fixture.vehicle) => context.request.post(`${base}/wp-admin/async-upload.php`, { multipart: { action: 'upload-attachment', _wpnonce: nonce, post_id: String(target), 'async-upload': { name, mimeType: 'image/png', buffer } } });
    const badNonce = await upload('invalid');
    check('HTTP native multipart upload rejects invalid nonce', badNonce.status() === 403);
    const valid = await upload(config.upload), validData = await valid.json();
    check('HTTP native multipart PNG upload accepted', validData.success === true && validData.data.id > 0);
    const image = validData.data.id;
    check('HTTP permitted cover accepted through native REST', (await rest('POST', `vehiculo/${fixture.vehicle}`, { featured_media: image })).status() === 200);
    const fake = await upload(config.upload, Buffer.from('<?php echo "not an image";'), 'fake.png');
    check('HTTP forged MIME rejected by native upload', (await fake.json()).success === false);
    const target = await upload(config.upload, bytes, 'test.png', fixture.outside);
    check('HTTP upload to unrelated page rejected', (await target.json()).success === false);
    const getForeign = await context.request.post(`${base}/wp-admin/admin-ajax.php`, { form: { action: 'get-attachment', id: String(fixture.foreign) } });
    check('HTTP native AJAX attachment-ID bypass blocked', (await getForeign.json()).success === false);
    const nonceBefore = await page.locator('[name="rp_vehicle_nonce"]').inputValue();
    // Do not consume the one-time metabox notice by following the redirect.
    const formUpdate = await context.request.post(`${base}/wp-admin/post.php`, { maxRedirects: 0, form: { action: 'editpost', post_ID: String(fixture.vehicle), post_type: 'vehiculo', _wpnonce: await page.locator('#_wpnonce').inputValue(), post_title: 'HTTP UPDATED FIXTURE', rp_vehicle_nonce: nonceBefore, 'rp_precio_monto[0]': '999', post_status: 'publish' } });
    check('HTTP native edit form completes its save redirect', formUpdate.status() === 302);
    await page.reload();
    check('HTTP malformed scalar form preserves existing price', await page.locator('#rp_precio_monto').inputValue() === '12345.67');
    check('HTTP native form explains rejected malformed input', (await page.locator('#rp-vehicle-data').innerText()).includes('Se conservó su valor anterior: Precio'));
    await context.close();
  }
  await writeFile(resolve(out, 'report.json'), JSON.stringify({ passed: checks.length, checks, transport: 'Native WordPress HTTP cookies/REST/admin-AJAX multipart', browser: browser.version() }, null, 2));
  console.log(`HTTP security: ${checks.length} checks passed.`);
} finally {
  await browser?.close();
  child.kill('SIGTERM');
  await rm(resolve(out, 'accounts.json'), { force: true });
}
