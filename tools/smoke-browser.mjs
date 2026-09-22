import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Optional external runtime; otherwise install playwright locally in tools/.
const require = createRequire(process.env.RP_PLAYWRIGHT_PACKAGE || import.meta.url);
const { chromium } = require('playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const base = 'http://127.0.0.1:9400';
const output = resolve('artifacts');
await mkdir(output, { recursive: true });
const results = [];
try {
  for (const [label, width, height] of [['desktop', 1440, 1000], ['tablet', 768, 1024], ['mobile', 390, 844], ['compact', 320, 740]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    const response = await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const summary = await page.evaluate(() => ({
      title: document.title,
      overflow: document.documentElement.scrollWidth > innerWidth,
      heading: document.querySelector('h1')?.innerText,
      empty: Boolean(document.querySelector('.stock-empty')),
      prices: document.querySelectorAll('.vehicle-price').length,
      font: getComputedStyle(document.body).fontFamily,
    }));
    if (response.status() !== 200 || summary.overflow || !summary.empty || summary.prices || errors.length) {
      throw new Error(JSON.stringify({ label, status: response.status(), ...summary, errors }));
    }
    await page.keyboard.press('Tab');
    const skipFocus = await page.locator('.skip-link').evaluate((el) => el === document.activeElement);
    if (!skipFocus) throw new Error('Skip link not first keyboard target');
    const skipFocusStyle = await page.locator('.skip-link').evaluate((el) => {
      const style = getComputedStyle(el);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, clipPath: style.clipPath };
    });
    if (skipFocusStyle.outlineStyle === 'none' || Number.parseFloat(skipFocusStyle.outlineWidth) < 2) {
      throw new Error('Skip link focus is not visibly outlined');
    }
    if (label === 'desktop') await page.screenshot({ path: resolve(output, 'focus-desktop.png') });
    const focusOrder = [];
    for (let index = 0; index < 6; index += 1) {
      focusOrder.push(await page.evaluate(() => {
        const active = document.activeElement;
        return active?.getAttribute('aria-label') || active?.textContent?.trim().replace(/\s+/g, ' ') || active?.tagName;
      }));
      await page.keyboard.press('Tab');
    }
    await page.locator('h1').click();
    if (label !== 'compact') await page.screenshot({ path: resolve(output, `home-${label}.png`), fullPage: true });
    results.push({ label, status: response.status(), ...summary, skipFocus, skipFocusStyle, focusOrder, errors });
    await page.close();
  }
  const noJs = await browser.newPage({ javaScriptEnabled: false });
  await noJs.goto(base);
  await noJs.getByRole('link', { name: 'Ver vehículos', exact: true }).first().click();
  await noJs.waitForURL('**/vehiculos/');
  if (!await noJs.locator('.stock-empty').count()) throw new Error('Catalog empty state missing');
  if (await noJs.locator('.vehicle-price').count()) throw new Error('Price in catalog');
  results.push({ noJavaScript: true, catalog: noJs.url(), empty: true, prices: 0 });
  await noJs.close();
  const zoomPage = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await zoomPage.goto(base, { waitUntil: 'networkidle' });
  await zoomPage.evaluate(() => { document.documentElement.style.zoom = '2'; });
  const zoomResult = await zoomPage.evaluate(() => ({
    zoom: getComputedStyle(document.documentElement).zoom,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }));
  if (zoomResult.overflow) throw new Error('Horizontal overflow at 200% CSS zoom');
  results.push({ cssZoom200: true, ...zoomResult });
  await zoomPage.close();
  await writeFile(resolve(output, 'smoke-results.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
