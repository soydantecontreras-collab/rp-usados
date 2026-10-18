/** Real cookies/REST/UI against the separate local DEMO instance. No real stock. */
import { chromium, browserOptions } from './browser-runtime.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const root = resolve(import.meta.dirname, '..');
const out = resolve(process.env.RP_GESTION_OUT || resolve(root, 'tools/.preview/gestion'));
const screenshots = resolve(out, 'screenshots'); await mkdir(screenshots, { recursive: true });
const base = `http://127.0.0.1:${process.env.RP_GESTION_PORT || 9540}`;
const fixture = JSON.parse(await readFile(resolve(out, 'accounts.json'), 'utf8'));
const browser = await chromium.launch(browserOptions());
const checks = []; const check = (name, condition) => { assert(condition, name); checks.push(name); if (checks.length % 10 === 0) console.log(`${checks.length} checks: ${name}`); };
const bytes = await readFile(resolve(root, 'tools/demo-fixtures/square.png'));
const uiVersion = 'QA edición DEMO ' + Date.now();
async function login(context, role = 'manager', email = false) {
  const page = await context.newPage(); await page.goto(`${base}/gestion/`);
  const account = fixture.accounts[role];
  await page.locator('[name=usuario]').first().fill(email ? account.email : account.login);
  await page.locator('[name=password]').first().fill(account.password);
  await Promise.all([page.waitForNavigation(), page.locator('.login-form [type=submit]').click()]);
  return page;
}
async function configOf(page) { return page.evaluate(() => JSON.parse(document.body.dataset.config)); }
async function request(context, nonce, method, route, data) {
  const r = await context.request.fetch(`${base}/wp-json/rp-usados/v1/gestion/${route}`, { method, headers: { 'X-WP-Nonce': nonce }, ...(data !== undefined ? { data } : {}) });
  return { status: r.status(), data: await r.json(), headers: r.headers() };
}
try {
  const anonymous = await browser.newContext(); await anonymous.request.get(base);
  const loginPage = await anonymous.newPage(); const lr = await loginPage.goto(`${base}/gestion/`);
  check('own SSR login', lr.status() === 200 && await loginPage.locator('.login-form').count() === 1);
  check('login no-store + noindex', /no-store/.test(lr.headers()['cache-control']) && /noindex/.test(lr.headers()['x-robots-tag']));
  check('clickjacking/CSP guards', lr.headers()['x-frame-options'] === 'DENY' && lr.headers()['content-security-policy'].includes("frame-ancestors 'none'"));
  const anonRest = await request(anonymous, '', 'GET', 'vehiculos');
  check('anonymous REST denied and private', [401,403].includes(anonRest.status) && /no-store/.test(anonRest.headers['cache-control']));
  check('missing login CSRF denied', (await anonymous.request.post(`${base}/gestion/sesion/`, { form: { usuario: fixture.accounts.manager.login, password: fixture.accounts.manager.password } })).status() === 403);
  await loginPage.locator('[data-password]').first().click();
  check('password reveal', await loginPage.locator('.login-form [name=password]').getAttribute('type') === 'text');
  await loginPage.locator('[data-password]').first().click();
  check('password conceal', await loginPage.locator('.login-form [name=password]').getAttribute('type') === 'password');
  await loginPage.screenshot({ path: resolve(screenshots, 'gestion-login-desktop.png'), fullPage: true });
  const subscriber = await browser.newContext(); const denied = await login(subscriber, 'subscriber');
  check('authenticated subscriber access denied', await denied.locator('h1').textContent() === 'Acceso denegado');
  check('subscriber direct REST forbidden', (await request(subscriber, (await configOf(denied)).nonce, 'GET', 'vehiculos')).status === 403);
  const adminContext = await browser.newContext(); const adminPage = await login(adminContext, 'admin');
  const ac = await configOf(adminPage);
  const leftovers = await request(adminContext, ac.nonce, 'GET', 'vehiculos');
  for (const item of leftovers.data.items) {
    if (!fixture.vehicles.includes(item.id) && item.modelo.includes('DEMO')) await request(adminContext, ac.nonce, 'POST', `vehiculos/${item.id}/publicacion`, { publicacion: 'draft', revision: item.revision });
  }
  await adminPage.reload();
  check('administrator panel access', await adminPage.locator('.stock-row').count() === 3);
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await login(context, 'manager', true);
  page.on('pageerror', error => console.log('UI JS error:', error.message));
  const config = await configOf(page); let nonce = config.nonce;
  const adminRedirect = await context.request.get(`${base}/wp-admin/`, { maxRedirects: 0 });
  check('manager wp-admin redirects to own panel without changing permissions', adminRedirect.status() === 302 && new URL(adminRedirect.headers().location, base).pathname === '/gestion/');
  const call = (method, route, data) => request(context, nonce, method, route, data);
  const id = fixture.vehicles[0];
  check('email login + active list', await page.locator('.stock-row').count() === 3);
  check('panel uses plugin-only assets', await page.evaluate(() => [...document.querySelectorAll('script[src],link[rel=stylesheet]')].every(n => (n.src || n.href).includes('/plugins/rp-usados-security/'))));
  check('no sensitive/internal form fields in list', !await page.locator('[name*=rp_destacado],[name*=whatsapp],[name*=post_title]').count());
  check('invalid REST nonce denied', (await request(context, 'wrong', 'GET', 'vehiculos')).status === 403);
  const listResponse = await call('GET', 'vehiculos');
  check('REST list private headers', /no-store/.test(listResponse.headers['cache-control']) && listResponse.headers.vary.includes('Cookie'));
  check('REST listed prices allowed only private', listResponse.data.items[0].precio === '12345.67');
  for (const [filter, count] of [['disponible', 2], ['reservado', 1], ['vendido', 1], ['borradores', 1]]) { const total = (await call('GET', `vehiculos?filtro=${filter}`)).data.total; check(`filter ${filter}`, filter === 'borradores' ? total >= count : total === count); }
  check('search across brand/model', (await call('GET', 'vehiculos?buscar=Volkswagen%20Vento')).data.total === 1);
  check('unknown REST query field denied', (await call('GET', 'vehiculos?post_status=any')).status === 400);
  check('non-vehicle object denied', (await call('GET', `vehiculos/${fixture.page}`)).status === 404);
  const original = (await call('GET', `vehiculos/${id}`)).data;
  for (const [key, invalid] of Object.entries({ marca: [], modelo: false, anio: '1800', precio: '1e6', moneda: 'EUR', estado: 'private', galeria: [fixture.unrelated], portada: fixture.unrelated, descripcion: [], publicacion: 'private', rp_destacado: '1', rp_whatsapp_numero: '1' })) {
    const response = await call('PATCH', `vehiculos/${id}`, { revision: original.revision, version: 'MUST NOT WRITE', [key]: invalid });
    check(`HTTP invalid ${key} rejected atomically`, response.status >= 400 && (await call('GET', `vehiculos/${id}`)).data.revision === original.revision);
  }
  check('mutations reject query injection', (await call('PATCH', `vehiculos/${id}?estado=vendido`, { revision: original.revision })).status === 400);
  check('publication endpoint allowlist', (await call('POST', `vehiculos/${id}/publicacion`, { publicacion: 'draft', modelo: 'forbidden', revision: original.revision })).status === 400);
  check('state endpoint allowlist', (await call('PATCH', `vehiculos/${id}/estado`, { estado: 'reservado', precio: '1', revision: original.revision })).status === 400);
  const draft = await call('POST', 'vehiculos', { modelo: 'QA DEMO draft', publicacion: 'draft' });
  check('create incomplete draft', draft.status === 201 && draft.data.publicacion === 'draft');
  const did = draft.data.id;
  check('publish missing mandatory fields rejected', (await call('POST', `vehiculos/${did}/publicacion`, { publicacion: 'publish', revision: draft.data.revision })).status === 422);
  const upload = (name, buffer = bytes, mimeType = 'image/png') => context.request.post(`${base}/wp-json/rp-usados/v1/gestion/fotos`, { headers: { 'X-WP-Nonce': nonce }, multipart: { vehiculo: String(did), foto: { name, mimeType, buffer } } });
  const validUpload = await upload('qa-demo.png'); const image = await validUpload.json();
  check('approved upload succeeds', validUpload.status() === 201 && image.id > 0);
  check('pending photo recoverable privately', (await call('GET', `fotos/${image.id}?vehiculo=${did}`)).status === 200);
  check('foreign photo lookup denied', (await call('GET', `fotos/${fixture.unrelated}?vehiculo=${did}`)).status === 404);
  const heic = await upload('iphone.heic', Buffer.from('1234ftypheicDEMO'), 'image/heic'); const heicData = await heic.json();
  check('HEIC explicit rejection', heic.status() === 415 && heicData.message === 'Esta foto está en formato HEIC. Por ahora, subila como JPG, PNG o WebP.');
  check('HEIF disguised as JPG rejected', (await upload('fake.jpg', Buffer.from('1234ftypmif1DEMO'), 'image/jpeg')).status() === 415);
  check('SVG rejected', (await upload('evil.svg', Buffer.from('<svg/>'), 'image/svg+xml')).status() === 422);
  check('corrupt image rejected', (await upload('corrupt.png', Buffer.from('not an image'))).status() === 422);
  check('PHP double extension rejected', (await upload('evil.php.png')).status() === 422);
  check('oversized image rejected', (await upload('large.png', Buffer.alloc(12 * 1024 * 1024 + 1))).status() >= 400);
  const publication = await call('PATCH', `vehiculos/${did}`, { marca: 'DEMO', modelo: 'Prueba QA', version: 'Validación', anio: '2021', estado: 'disponible', portada: image.id, precio: '', moneda: 'USD', publicacion: 'publish', revision: draft.data.revision });
  check('complete vehicle publishes without optional data', publication.status === 200 && publication.data.publicacion === 'publish');
  check('automatic title in HTTP', publication.data.titulo === 'DEMO Prueba QA Validación 2021');
  check('stale version HTTP conflict', (await call('PATCH', `vehiculos/${did}`, { modelo: 'LOST', revision: draft.data.revision })).status === 409);
  const unpublish = await call('POST', `vehiculos/${did}/publicacion`, { publicacion: 'draft', revision: publication.data.revision });
  check('publication separated from stock', unpublish.status === 200 && unpublish.data.estado === 'disponible' && unpublish.data.publicacion === 'draft');
  // Real UI form + uploads and order, not just endpoint calls.
  await page.goto(`${base}/gestion/vehiculos/${id}/`);
  await page.waitForFunction(() => typeof window.rpGestionDirty === 'function');
  check('restricted field set', !await page.locator('[name*=combustible],[name*=transmision],[name*=motor],[name*=destacado],[name*=whatsapp],[name*=excerpt],[name*=post_title],[name*=post_name]').count());
  check('legacy currency visible', await page.locator('#moneda').inputValue() === 'TST');
  await page.locator('#version').fill(uiVersion);
  await page.locator('.back-link').click();
  check('internal unsaved navigation warning', await page.locator('#confirm-dialog').isVisible());
  await page.locator('[data-cancel]').click();
  check('cancel keeps text', await page.locator('#version').inputValue() === uiVersion);
  const coverBefore = await page.locator('[name="rp_vehicle[portada]"]').inputValue();
  await page.locator('#cover-file').setInputFiles({ name: 'iphone.heic', mimeType: 'image/heic', buffer: Buffer.from('1234ftypheicDEMO') });
  await page.waitForFunction(() => document.querySelector('#upload-queue').textContent.includes('Esta foto está en formato HEIC'));
  check('UI HEIC notice + cover retained', await page.locator('[name="rp_vehicle[portada]"]').inputValue() === coverBefore);
  await page.getByRole('button', { name: 'Descartar intento' }).click();
  let failedOnce = true;
  await page.route('**/wp-json/rp-usados/v1/gestion/fotos', async route => { if (failedOnce) { failedOnce = false; await route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ message: 'DEMO fallo de subida para probar reintento' }) }); } else await route.continue(); });
  await page.locator('#cover-file').setInputFiles({ name: 'qa-cover-demo.png', mimeType: 'image/png', buffer: bytes });
  await page.getByRole('button', { name: 'Reintentar', exact: true }).waitFor();
  check('failed cover upload preserves previous', await page.locator('[name="rp_vehicle[portada]"]').inputValue() === coverBefore);
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await page.waitForFunction(old => document.querySelector('[name="rp_vehicle[portada]"]').value !== old, coverBefore);
  check('per-file retry succeeds', await page.locator('.upload-item.uploaded').count() === 1);
  await page.unroute('**/wp-json/rp-usados/v1/gestion/fotos');
  const galleryBefore = await page.locator('#gallery-preview figure').count();
  await page.locator('#gallery-files').setInputFiles([{ name: 'qa-gallery-one.png', mimeType: 'image/png', buffer: bytes }, { name: 'qa-gallery-two.png', mimeType: 'image/png', buffer: bytes }]);
  await page.waitForFunction(count => document.querySelectorAll('#gallery-preview figure').length === count + 2, galleryBefore);
  check('multiple files upload real server', await page.locator('#gallery-preview figure').count() === galleryBefore + 2);
  const orderBefore = await page.locator('[name="rp_vehicle[galeria]"]').inputValue();
  await page.locator('#gallery-preview figure').nth(1).getByRole('button', { name: 'Anterior', exact: true }).click();
  check('keyboard-capable gallery reorder', await page.locator('[name="rp_vehicle[galeria]"]').inputValue() !== orderBefore);
  await page.locator('#gallery-preview figure').first().getByRole('button', { name: 'Usar como principal' }).click();
  check('gallery use as cover', await page.locator('[name="rp_vehicle[portada]"]').inputValue() !== coverBefore);
  await page.locator('.save-actions .button-primary').click();
  await page.waitForFunction(() => document.querySelector('#save-feedback').textContent === 'Cambios guardados');
  check('UI saved feedback only after server', (await call('GET', `vehiculos/${id}`)).data.version === uiVersion);
  // Actual expired cookie session, then same-user login and retry without losing text.
  await page.locator('#version').fill('QA sesión recuperada DEMO'); await context.clearCookies();
  await page.locator('.save-actions .button-primary').click();
  await page.locator('#session-dialog').waitFor({ state: 'visible' });
  check('expired session keeps form', await page.locator('#version').inputValue() === 'QA sesión recuperada DEMO');
  check('temporary recovery contains no auth', await page.evaluate(() => { const raw = sessionStorage.getItem('rp-gestion-recovery'); return raw && !/password|nonce|csrf/.test(raw); }));
  await page.locator('#session-form [name=usuario]').fill(fixture.accounts.manager.login);
  await page.locator('#session-form [name=password]').fill(fixture.accounts.manager.password);
  await page.locator('#session-form [type=submit]').click();
  await page.waitForFunction(() => document.querySelector('#save-feedback').textContent === 'Cambios guardados').catch(async error => {
    console.log('Session feedback:', await page.locator('#session-feedback').textContent(), 'Save:', await page.locator('#save-feedback').textContent()); throw error;
  });
  check('expired session relogin + save succeeds', await page.locator('#session-dialog').isVisible() === false);
  check('recovery discarded on save', await page.evaluate(() => sessionStorage.getItem('rp-gestion-recovery') === null));
  await page.reload(); nonce = (await configOf(page)).nonce;
  const current = (await call('GET', `vehiculos/${id}`)).data;
  await call('PATCH', `vehiculos/${id}`, { version: 'QA newer server DEMO', revision: current.revision });
  await page.locator('#version').fill('QA stale local DEMO'); await page.locator('.save-actions .button-primary').click();
  await page.waitForFunction(() => document.querySelector('#save-feedback').textContent.includes('Otro usuario'));
  check('UI concurrent editing protects newer data', (await call('GET', `vehiculos/${id}`)).data.version === 'QA newer server DEMO' && await page.locator('#version').inputValue() === 'QA stale local DEMO');
  await page.locator('#reload-current').click(); await page.locator('[data-confirm]').click(); await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => document.querySelector('#version').value === 'QA newer server DEMO');
  check('explicit conflict recovery gets current revision', await page.locator('#version').inputValue() === 'QA newer server DEMO');
  await page.goto(`${base}/gestion/`);
  const row = page.locator(`.stock-row[data-id="${id}"]`); await row.locator('summary').click(); await row.locator('select').selectOption('vendido'); await row.getByRole('button', { name: 'Guardar estado' }).click();
  check('sold confirmation exact wording', await page.locator('#confirm-text').textContent() === 'Este vehículo dejará de aparecer en el catálogo. No se eliminará.');
  await page.locator('[data-cancel]').click();
  check('cancel sold does not change server', (await call('GET', `vehiculos/${id}`)).data.estado === 'disponible');
  await row.getByRole('button', { name: 'Guardar estado' }).click(); await page.locator('[data-confirm]').click();
  await page.waitForFunction(id => !document.querySelector(`.stock-row[data-id="${id}"]`), id);
  const sold = (await call('GET', `vehiculos/${id}`)).data;
  check('confirmed sold excludes active and retains record', sold.estado === 'vendido' && sold.publicacion === 'publish');
  await call('PATCH', `vehiculos/${id}`, { estado: original.estado, version: original.version, portada: original.portada, galeria: original.galeria, revision: sold.revision });
  // No-JS server-rendered edit/save/list and upload; no wp-admin needed.
  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const nj = await login(nojs); check('no-JS native login and list', await nj.locator('.stock-row').count() === 3);
  await nj.goto(`${base}/gestion/nuevo/`); await nj.locator('#modelo').fill('NoJS DEMO');
  await Promise.all([nj.waitForNavigation(), nj.getByRole('button', { name: 'Guardar borrador', exact: true }).click()]);
  if (!await nj.locator('#modelo').count()) console.log('NoJS draft response:', nj.url(), (await nj.locator('body').innerText()).slice(0,600));
  check('no-JS draft save', await nj.locator('#modelo').inputValue() === 'NoJS DEMO' && (await nj.locator('#save-feedback').textContent()).includes('Cambios guardados'));
  await nj.locator('#marca').fill('DEMO'); await nj.locator('#anio').fill('2021'); await nj.locator('#estado').selectOption('disponible');
  await nj.locator('#cover-file').setInputFiles({ name: 'nojs-demo.png', mimeType: 'image/png', buffer: bytes });
  await Promise.all([nj.waitForNavigation(), nj.getByRole('button', { name: 'Publicar vehículo', exact: true }).click()]);
  check('no-JS upload and publication', (await nj.locator('#publication-status').textContent()).trim() === 'Publicado');
  // Put this extra test unit back into drafts to keep the delivered active DEMO compact.
  const njData = await configOf(nj); await request(nojs, njData.nonce, 'POST', `vehiculos/${njData.vehiculo.id}/publicacion`, { publicacion: 'draft', revision: njData.vehiculo.revision });
  await nojs.close();
  for (const [width, height] of [[1440,1000],[375,812],[390,844],[430,932]]) {
    await page.setViewportSize({ width, height }); await page.goto(`${base}/gestion/`); await page.evaluate(() => document.fonts.ready);
    check(`list responsive ${width}`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    check(`mobile cards/desktop rows ${width}`, await page.locator('.stock-columns').isVisible() === (width > 900));
    await page.screenshot({ path: resolve(screenshots, width === 1440 ? 'gestion-desktop.png' : `gestion-mobile-${width}.png`), fullPage: true });
    await page.goto(`${base}/gestion/vehiculos/${id}/`);
    check(`form responsive ${width}`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: resolve(screenshots, width === 1440 ? 'gestion-form-desktop.png' : `gestion-form-mobile-${width}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 720, height: 500 }); await page.goto(`${base}/gestion/`);
  check('200% equivalent viewport reflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.keyboard.press('Tab');
  check('visible keyboard focus', await page.evaluate(() => { const e = document.activeElement; return e.matches(':focus-visible') && parseFloat(getComputedStyle(e).outlineWidth) >= 3; }));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  check('reduced motion no animation', await page.evaluate(() => getComputedStyle(document.querySelector('.stock-row')).animationName === 'none'));
  await page.goto(`${base}/gestion/?buscar=NO_MATCH_DEMO`);
  check('empty stock state', await page.getByRole('heading', { name: 'No hay vehículos para mostrar' }).count() === 1);
  await page.screenshot({ path: resolve(screenshots, 'gestion-empty.png'), fullPage: true });
  const publicContext = await browser.newContext(); const publicPage = await publicContext.newPage();
  for (const path of ['/', '/vehiculos/', '/?s=DEMO']) {
    const response = await publicPage.goto(base + path); const body = await publicPage.locator('body').innerText();
    check(`public ${path} no prices`, !/12[.,]?345|12345|TST|ARS\s+[\d]|USD\s+[\d]/.test(body));
    check(`public ${path} no panel assets`, !await publicPage.locator('script[src*="rp-usados-security"],link[href*="rp-usados-security"]').count());
    check(`public ${path} still serves`, response.status() === 200);
  }
  const trackedPublic = execFileSync('git', ['diff', '--name-only', '47e96a9090f273026c5c7c747cfad5aad3bcd82c', '--', 'theme/rp-usados/*.php', 'theme/rp-usados/style.css', 'theme/rp-usados/src', 'theme/rp-usados/assets/hero', 'theme/rp-usados/assets/institutional', 'plugins/rp-usados-security/inc/roles.php', 'plugins/rp-usados-security/inc/media.php'], { cwd: root, encoding: 'utf8' });
  check('public sources and security policy intact', trackedPublic.trim() === '');
  await page.goto(`${base}/gestion/`); await Promise.all([page.waitForNavigation(), page.getByRole('button', { name: 'Cerrar sesión' }).click()]);
  check('native logout returns to login', await page.locator('.login-form').count() === 1);
  // Generic messages and reasonable per-IP/account rate limit; run last.
  const challenge = await (await anonymous.request.get(`${base}/gestion/sesion/`)).json();
  const fail = account => anonymous.request.post(`${base}/gestion/sesion/`, { form: { csrf: challenge.csrf, usuario: account, password: 'wrong-DEMO-only' } });
  const first = await (await fail('nonexistent-DEMO')).json(); const second = await (await fail(fixture.accounts.manager.login)).json();
  check('login errors do not enumerate users', first.message === second.message);
  let rate;
  for (let i = 0; i < 8; i++) rate = await fail('nonexistent-DEMO');
  check('login rate limit', rate.status() === 429);
  // This intentionally leaves the disposable instance throttled for 15 minutes.
  // Restart gestion-preview for handoff; it regenerates the DEMO and credentials.
  await writeFile(resolve(out, 'http-report.json'), JSON.stringify({ passed: checks.length, checks }, null, 2));
  console.log(`Gestion HTTP/UI: ${checks.length} passed.`);
} finally { await browser.close(); }
