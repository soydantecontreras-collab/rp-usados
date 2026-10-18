/** Real native login cookies, private REST, panel forms and responsive layout. */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const root = resolve(import.meta.dirname, '..'), out = resolve(root, 'tools/.preview/gestion-http');
await mkdir(out, { recursive: true });
await rm(resolve(out, 'accounts.json'), { force: true }); await rm(resolve(out, 'report.json'), { force: true });
const blueprint = { steps: [
  { step: 'activatePlugin', pluginPath: 'rp-usados-security/rp-usados-security.php' },
  { step: 'activateTheme', themeFolderName: 'rp-usados' },
  { step: 'setSiteOptions', options: { permalink_structure: '/%postname%/' } },
  { step: 'runPHP', code: "<?php require '/wordpress/wp-load.php'; require '/gestion-tests/http-fixture.php';" },
] };
await writeFile(resolve(out, 'blueprint.json'), JSON.stringify(blueprint));
const port = Number(process.env.RP_GESTION_HTTP_PORT || 9534), base = `http://127.0.0.1:${port}`;
const args = ['--experimental-wasm-jspi', resolve(root, 'tools/playground.mjs'), 'server', '--no-login', '--port', String(port), '--workers', '2', '--wp', '6.8', '--php', '8.3', '--blueprint', resolve(out, 'blueprint.json')];
for (const [local, remote] of [['theme/rp-usados','/wordpress/wp-content/themes/rp-usados'], ['plugins/rp-usados-security','/wordpress/wp-content/plugins/rp-usados-security'], ['tests/gestion','/gestion-tests'], ['tools/demo-fixtures','/gestion-fixtures'], ['tools/.preview/gestion-http','/gestion-output']]) args.push('--mount-dir', resolve(root, local), remote);
const child = spawn(process.execPath, args, { cwd: root, stdio: ['ignore','pipe','pipe'] });
let output = '', browser;
const ready = new Promise((done, reject) => {
  child.on('error', reject); child.on('exit', code => reject(new Error(`Fixture exited ${code}: ${output}`)));
  const capture = data => { output += data; if (output.includes('WordPress is running on')) done(); };
  child.stdout.on('data', capture); child.stderr.on('data', capture);
});
const checks = [], check = (name, result) => { assert(result, name); checks.push(name); };
const configuration = page => page.locator('#gestion-config').textContent().then(JSON.parse);
async function login(context, account) {
  const page = await context.newPage(); await page.goto(`${base}/gestion/`);
  await page.locator('[name="username"]').fill(account.login); await page.locator('[name="password"]').fill(account.password);
  await Promise.all([page.waitForNavigation(), page.locator('button[type="submit"]').filter({ hasText: 'Ingresar' }).click()]);
  return page;
}
try {
  await Promise.race([ready, new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error('Fixture readiness deadline exceeded')), 120000); timer.unref(); })]);
  const fixture = JSON.parse(await readFile(resolve(out, 'accounts.json'), 'utf8'));
  const require = createRequire(process.env.RP_PLAYWRIGHT_PACKAGE || 'C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
  const { chromium } = require('playwright'); browser = await chromium.launch({ channel: 'msedge', headless: true });
  const anonymous = await browser.newContext(), anonPage = await anonymous.newPage(); await anonPage.goto(base); await anonPage.goto(`${base}/gestion/`);
  check('anonymous receives branded login', await anonPage.locator('[name="username"]').count() === 1 && await anonPage.locator('.gestion-stock-row').count() === 0);
  check('anonymous panel includes noindex', (await anonPage.locator('meta[name="robots"]').getAttribute('content')).includes('noindex'));
  check('anonymous cannot list private stock', (await anonymous.request.get(`${base}/wp-json/rp-usados/v1/gestion/vehiculos`)).status() === 401);
  check('anonymous cannot create private vehicle', (await anonymous.request.post(`${base}/wp-json/rp-usados/v1/gestion/vehiculos`, { data: { publication: 'draft' } })).status() === 401);
  check('anonymous cannot upload native media', (await anonymous.request.post(`${base}/wp-json/wp/v2/media`, { data: {} })).status() === 401);
  const invalidCsrf = await anonymous.request.post(`${base}/gestion/`, { form: { action: 'login', username: fixture.accounts.manager.login, password: fixture.accounts.manager.password, csrf: 'invalid' } });
  check('login rejects invalid CSRF even with correct credentials', invalidCsrf.status() === 403);
  const token = await anonPage.locator('[name="csrf"]').inputValue();
  const crossOrigin = await anonymous.request.post(`${base}/gestion/`, { headers: { Origin: 'https://outside.invalid' }, form: { action: 'login', username: fixture.accounts.manager.login, password: fixture.accounts.manager.password, csrf: token } });
  check('login rejects cross-origin submission', crossOrigin.status() === 403);
  const wrong = await anonymous.request.post(`${base}/gestion/`, { form: { action: 'login', username: 'unknown-account', password: 'incorrect', csrf: token } });
  check('invalid login does not reveal account existence', (await wrong.text()).includes('No pudimos ingresar con esos datos.'));
  await anonymous.close();
  const denied = await browser.newContext(), deniedPage = await login(denied, fixture.accounts.subscriber);
  check('subscriber cannot enter through panel login', await deniedPage.locator('[name="username"]').count() === 1 && await deniedPage.locator('.gestion-stock-row').count() === 0);
  await deniedPage.goto(`${base}/wp-login.php`); await deniedPage.locator('#user_login').fill(fixture.accounts.subscriber.login); await deniedPage.locator('#user_pass').fill(fixture.accounts.subscriber.password);
  await Promise.all([deniedPage.waitForNavigation(), deniedPage.locator('#wp-submit').click()]);
  const deniedResult = await deniedPage.goto(`${base}/gestion/`);
  check('already-authenticated subscriber receives explicit denial', deniedResult.status() === 403 && await deniedPage.locator('.gestion-stock-row').count() === 0);
  check('subscriber cannot list even with authenticated cookie', (await denied.request.get(`${base}/wp-json/rp-usados/v1/gestion/vehiculos`)).status() >= 400); await denied.close();
  const manager = await browser.newContext(), page = await login(manager, fixture.accounts.manager), config = await configuration(page), headers = { 'X-WP-Nonce': config.nonce };
  const pageErrors = [], missingAssets = [], panelRequests = [];
  page.on('pageerror', error => pageErrors.push(error.message)); page.on('request', request => panelRequests.push(request.url()));
  page.on('response', response => { if (response.status() === 404 && /\.(?:js|css|woff2?|png|jpe?g|webp)(?:\?|$)/.test(response.url())) missingAssets.push(response.url()); });
  check('manager login reaches active stock', await page.locator('.gestion-stock-row').count() === 2);
  check('panel private caching disabled', /no-store/i.test((await manager.request.get(`${base}/gestion/`)).headers()['cache-control'] || ''));
  const request = (method, path, data = {}, nonce = config.nonce) => manager.request.fetch(`${base}/wp-json/rp-usados/v1/gestion${path}`, { method, data, headers: { 'X-WP-Nonce': nonce } });
  check('cookie REST without nonce denied', (await manager.request.get(`${base}/wp-json/rp-usados/v1/gestion/vehiculos`)).status() === 401);
  check('cookie REST with invalid nonce denied', (await request('GET', '/vehiculos', {}, 'invalid')).status() === 403);
  const renewed = await manager.request.get(`${base}/gestion/?access=session`), renewedData = await renewed.json();
  check('authenticated session can renew expiring nonces without REST nonce', renewed.status() === 200 && renewedData.nonce && renewedData.csrf && /no-store/.test(renewed.headers()['cache-control'] || ''));
  check('session bridge rejects cross-site origin', (await manager.request.get(`${base}/gestion/?access=session`, { headers: { Origin: 'https://outside.invalid' } })).status() === 403);
  const id = fixture.vehicles.disponible.id;
  const get = await request('GET', `/vehiculos/${id}`), initial = await get.json();
  check('manager authorized private serializer', get.status() === 200 && initial.fields.rp_precio_monto === '24500');
  check('manager arbitrary non-vehicle rejected', (await request('GET', `/vehiculos/${fixture.outside}`)).status() === 404);
  const malformed = await request('PATCH', `/vehiculos/${id}`, { revision: initial.revision, fields: { rp_marca: 'DO NOT SAVE', rp_precio_monto: ['1'] } });
  const malformedData = await malformed.json();
  check('malformed scalar returns field validation', [400,422].includes(malformed.status()) && (!!malformedData.data.errors?.rp_precio_monto || !!malformedData.data.params?.fields));
  let current = await (await request('GET', `/vehiculos/${id}`)).json();
  check('invalid payload preserves all previous fields', current.fields.rp_marca === initial.fields.rp_marca && current.fields.rp_precio_monto === initial.fields.rp_precio_monto && current.revision === initial.revision);
  check('foreign attachment rejected without mutation', (await request('PATCH', `/vehiculos/${id}`, { revision: current.revision, featured_media: fixture.foreign })).status() >= 400);
  const save = await request('PATCH', `/vehiculos/${id}`, { revision: current.revision, fields: { rp_precio_monto: '25000' }, gallery: [...current.gallery].reverse() });
  const updated = await save.json(); check('authorized edit updates price and gallery order', save.status() === 200 && updated.fields.rp_precio_monto === '25000' && updated.gallery[0] === current.gallery.at(-1));
  check('stale HTTP edit blocked', (await request('PATCH', `/vehiculos/${id}`, { revision: current.revision, fields: { rp_precio_monto: '1' } })).status() === 409);
  current = updated;
  const created = await request('POST', '/vehiculos', { publication: 'draft', fields: {} }), draft = await created.json();
  check('HTTP incomplete draft created', created.ok() && draft.id > 0 && draft.publication === 'draft');
  check('HTTP incomplete publication blocked', (await request('POST', `/vehiculos/${draft.id}/publicacion`, { revision: draft.revision, publication: 'publish' })).status() === 422);
  const reservedResponse = await request('PATCH', `/vehiculos/${id}/estado`, { revision: current.revision, state: 'reservado' }), reserved = await reservedResponse.json();
  check('HTTP quick state change confirmed by server', reservedResponse.status() === 200 && reserved.fields.rp_estado_stock === 'reservado');
  current = reserved;
  await page.goto(`${base}/gestion/?filter=reservado`);
  check('reserved filter contains both reserved units', await page.locator('.gestion-stock-row').count() === 2);
  await page.locator('[data-change-state]').first().click(); await page.locator('#quick-state').selectOption('vendido');
  check('sold action has explicit removal-without-deletion confirmation', await page.locator('[data-state-warning]').isVisible() && (await page.locator('[data-state-warning]').innerText()).includes('No se eliminará'));
  await page.locator('#state-dialog button[value="cancel"]').click();
  await page.goto(`${base}/gestion/?filter=vendido`);
  check('sold filter preserves sold unit', await page.locator('.gestion-stock-row').count() === 1);
  await page.goto(`${base}/gestion/?filter=activo&search=NoSuchModel`);
  check('search filters without inventing results', await page.locator('.gestion-stock-row').count() === 0);
  const bytes = await readFile(resolve(root, 'tools/demo-fixtures/square.png'));
  const upload = (name, buffer, mimeType) => manager.request.post(`${base}/wp-json/wp/v2/media?post=${id}`, { headers, multipart: { file: { name, mimeType, buffer } } });
  check('native REST valid raster upload accepted', (await upload('gestion-upload.png', bytes, 'image/png')).status() === 201);
  check('native REST false MIME rejected', (await upload('fake.png', Buffer.from('not an image'), 'image/png')).status() >= 400);
  check('native REST HEIC rejected', (await upload('phone.heic', Buffer.from('not a supported HEIC'), 'image/heic')).status() >= 400);
  await page.goto(`${base}/gestion/vehiculos/${id}/`);
  const priorGallery = await page.locator('[data-gallery] [data-image-id]').evaluateAll(items => items.map(item => Number(item.dataset.imageId)));
  await page.locator('[data-gallery] .gestion-photo').nth(1).locator('button[aria-label*="antes"]').click();
  check('UI gallery reorder works using accessible control', await page.locator('[data-gallery] [data-image-id]').first().getAttribute('data-image-id') === String(priorGallery[1]));
  await page.locator('[data-gallery] .gestion-photo').last().locator('button').filter({ hasText: 'Quitar de la galería' }).click();
  check('UI removes association preview without deleting attachment', await page.locator('[data-gallery] .gestion-photo').count() === priorGallery.length - 1);
  // Discard unsaved interaction checks by loading the persisted edit view.
  page.on('dialog', dialog => dialog.accept()); await page.reload();
  await page.locator('#cover_file').setInputFiles({ name: 'phone.heic', mimeType: 'image/heic', buffer: Buffer.from('HEIC fixture') });
  await page.waitForFunction(() => document.querySelector('[data-upload-queue]')?.textContent.includes('HEIC') || document.body.textContent.includes('Esta foto está en formato HEIC'));
  check('UI explains HEIC without technical error', (await page.locator('body').innerText()).includes('JPG, PNG o WebP'));
  const oldCover = await page.locator('[name="featured_media"]').inputValue();
  let simulateFailure = true;
  await page.route('**/wp-json/wp/v2/media', async route => {
    if (simulateFailure) { simulateFailure = false; await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ code: 'test_transport', message: 'Test transport temporarily unavailable' }) }); }
    else await route.continue();
  });
  await page.locator('#cover_file').setInputFiles({ name: 'replacement.png', mimeType: 'image/png', buffer: bytes });
  await page.locator('[data-upload-queue] button').filter({ hasText: 'Reintentar' }).waitFor();
  check('failed replacement preserves old cover and offers retry', await page.locator('[name="featured_media"]').inputValue() === oldCover);
  await page.locator('[data-upload-queue] button').filter({ hasText: 'Reintentar' }).click();
  await page.waitForFunction(old => document.querySelector('[name="featured_media"]').value !== old, oldCover);
  check('retry completes real upload before changing cover', await page.locator('[data-upload-queue]').innerText().then(text => text.includes('Foto subida')));
  await page.unroute('**/wp-json/wp/v2/media');
  await page.locator('#gallery_files').setInputFiles([{ name: 'batch-one.png', mimeType: 'image/png', buffer: bytes }, { name: 'batch-two.png', mimeType: 'image/png', buffer: bytes }]);
  await page.waitForFunction(count => document.querySelectorAll('[data-gallery] .gestion-photo').length === count + 2, priorGallery.length);
  check('multiple gallery uploads produce previews individually', await page.locator('[data-gallery] .gestion-photo').count() === priorGallery.length + 2);
  await page.reload();
  for (const [width,height] of [[1440,900],[375,812],[390,844],[430,932]]) {
    await page.setViewportSize({ width,height }); await page.goto(`${base}/gestion/`); await page.screenshot({ path: resolve(out, `stock-${width}.png`), fullPage: true });
    check(`${width}: list has no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.goto(`${base}/gestion/vehiculos/${id}/`); await page.screenshot({ path: resolve(out, `form-${width}.png`), fullPage: true });
    check(`${width}: form has no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    check(`${width}: form controls preserve touch readability`, await page.locator('input:not([type="hidden"]),select,textarea').evaluateAll(inputs => inputs.every(x => parseFloat(getComputedStyle(x).fontSize) >= 16)));
  }
  const withoutJs = await browser.newContext({ storageState: await manager.storageState(), javaScriptEnabled: false }), noJs = await withoutJs.newPage();
  await noJs.goto(`${base}/gestion/nuevo/`); await noJs.locator('#rp_marca').fill('NoJS'); await noJs.locator('#rp_modelo').fill('Draft');
  await Promise.all([noJs.waitForNavigation(), noJs.locator('[name="intent"][value="draft"]').click()]);
  check('no-JavaScript draft saves through server form', await noJs.locator('#rp_marca').inputValue() === 'NoJS' && !noJs.url().includes('/nuevo/'));
  await noJs.locator('#rp_anio').fill('2021'); await noJs.locator('#rp_estado_stock').selectOption('disponible');
  await noJs.locator('#cover_file').setInputFiles({ name: 'native-cover.png', mimeType: 'image/png', buffer: bytes });
  await Promise.all([noJs.waitForNavigation(), noJs.locator('[name="intent"][value="publish"]').click()]);
  check('no-JavaScript multipart upload and publication succeed', await noJs.locator('.publication-label').innerText() === 'Publicado' && Number(await noJs.locator('[name="featured_media"]').inputValue()) > 0);
  await withoutJs.close();
  const expiredContext = await browser.newContext({ storageState: await manager.storageState() }), expiredPage = await expiredContext.newPage();
  await expiredPage.goto(`${base}/gestion/vehiculos/${id}/`); await expiredPage.locator('#rp_precio_monto').fill('99999');
  await page.goto(`${base}/gestion/`); await Promise.all([page.waitForNavigation(), page.locator('button').filter({ hasText: 'Cerrar sesión' }).click()]);
  check('logout returns branded login', await page.locator('[name="username"]').count() === 1);
  check('logout invalidates authenticated private access', (await request('GET','/vehiculos')).status() >= 400);
  check('anonymous session bridge does not disclose nonce', (await manager.request.get(`${base}/gestion/?access=session`)).status() === 401);
  await expiredPage.locator('[name="intent"][value="save"]').click();
  await expiredPage.waitForFunction(() => document.querySelector('#session-dialog')?.open);
  check('expired session retains typed form data and offers reauthentication', await expiredPage.locator('#rp_precio_monto').inputValue() === '99999');
  await expiredContext.close();
  await manager.close();
  const admin = await browser.newContext(), adminPage = await login(admin, fixture.accounts.admin);
  check('administrator retains panel access', await adminPage.locator('.gestion-stock-row').count() >= 2); await admin.close();
  check('panel has no JavaScript errors or missing assets', pageErrors.length === 0 && missingAssets.length === 0);
  check('panel does not download public hero or 3D assets', !panelRequests.some(url => /\.mp4|\.glb|\.hdr|three[./-]|hero-webgl/.test(url)));
  await writeFile(resolve(out, 'report.json'), JSON.stringify({ passed: checks.length, checks, browser: browser.version(), fixture: 'Disposable WordPress native cookies/private REST/server forms', screenshots: [1440,375,390,430] }, null, 2));
  console.log(`Gestión HTTP: ${checks.length} checks passed.`);
} finally { await browser?.close(); child.kill('SIGTERM'); await rm(resolve(out, 'accounts.json'), { force: true }); }
