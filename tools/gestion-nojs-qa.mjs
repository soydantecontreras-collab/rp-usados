import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const root = resolve(import.meta.dirname, '..');
const fixture = JSON.parse(await readFile(resolve(root,'tools/.preview/gestion/accounts.json'),'utf8'));
const require = createRequire(process.env.RP_PLAYWRIGHT_PACKAGE || resolve(root,'tools/package.json'));
const { chromium } = require('playwright');
const browser = await chromium.launch({channel:'msedge',headless:true});
const context = await browser.newContext({javaScriptEnabled:false}); const page = await context.newPage();
const base = 'http://127.0.0.1:9540';
try {
  await page.goto(base+'/gestion/'); await page.locator('.login-form [name=usuario]').fill(fixture.accounts.manager.login); await page.locator('.login-form [name=password]').fill(fixture.accounts.manager.password);
  await Promise.all([page.waitForNavigation(),page.locator('.login-form [type=submit]').click()]);
  await page.goto(base+'/gestion/nuevo/'); await page.locator('#modelo').fill('NoJS aislado DEMO');
  await Promise.all([page.waitForNavigation(),page.getByRole('button',{name:'Guardar borrador',exact:true}).click()]);
  assert.equal(await page.locator('#modelo').inputValue(),'NoJS aislado DEMO');
  await page.locator('#marca').fill('DEMO'); await page.locator('#anio').fill('2021'); await page.locator('#estado').selectOption('disponible');
  await page.locator('#cover-file').setInputFiles(resolve(root,'tools/demo-fixtures/square.png'));
  await Promise.all([page.waitForNavigation(),page.getByRole('button',{name:'Publicar vehículo',exact:true}).click()]);
  assert.equal((await page.locator('#publication-status').textContent()).trim(),'Publicado');
  const config = await page.evaluate(()=>JSON.parse(document.body.dataset.config));
  const response = await context.request.post(base+`/wp-json/rp-usados/v1/gestion/vehiculos/${config.vehiculo.id}/publicacion`,{headers:{'X-WP-Nonce':config.nonce},data:{publicacion:'draft',revision:config.vehiculo.revision}}); assert(response.ok());
  console.log('No JS: login, draft creation, multipart upload, publication and unpublication passed.');
} finally { await browser.close(); }
