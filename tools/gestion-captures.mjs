/** Capture only, no stock writes. Requires the isolated DEMO runtime running. */
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..'), out = resolve(root, 'tools/.preview/gestion');
const screenshots = resolve(out, 'screenshots'); await mkdir(screenshots, { recursive: true });
const fixture = JSON.parse(await readFile(resolve(out, 'accounts.json'), 'utf8'));
const require = createRequire(process.env.RP_PLAYWRIGHT_PACKAGE || resolve(root, 'tools/package.json'));
const { chromium } = require('playwright');
const base = `http://127.0.0.1:${process.env.RP_GESTION_PORT || 9540}`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto(`${base}/gestion/`);
  await page.screenshot({ path: resolve(screenshots, 'gestion-login-desktop.png'), fullPage: true });
  await page.locator('.login-form [name=usuario]').fill(fixture.accounts.manager.login);
  await page.locator('.login-form [name=password]').fill(fixture.accounts.manager.password);
  await Promise.all([page.waitForNavigation(), page.locator('.login-form [type=submit]').click()]);
  const profiles = [];
  for (const [width,height] of [[1440,1000],[375,812],[390,844],[430,932]]) {
    await page.setViewportSize({ width, height });
    for (const [name,path] of [['list','/gestion/'],['form',`/gestion/vehiculos/${fixture.vehicles[0]}/`]]) {
      await page.goto(base + path); await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      if (overflow) throw new Error(`${name} ${width}: horizontal overflow`);
      const suffix = width === 1440 ? 'desktop' : `mobile-${width}`;
      const file = name === 'list' ? `gestion-${suffix}.png` : `gestion-form-${suffix}.png`;
      await page.screenshot({ path: resolve(screenshots,file), fullPage: true }); profiles.push({ name, width, height, overflow });
    }
  }
  await page.goto(`${base}/gestion/?buscar=NO_MATCH_DEMO`); await page.screenshot({path:resolve(screenshots,'gestion-empty.png'),fullPage:true});
  if (errors.length) throw new Error(errors.join('\n'));
  await writeFile(resolve(out,'capture-report.json'),JSON.stringify({profiles,errors,browser:browser.version()},null,2));
  console.log(`Captures: ${profiles.length} desktop/mobile + login + empty; no JS errors.`);
} finally { await browser.close(); }
