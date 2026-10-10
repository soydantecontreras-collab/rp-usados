/** Public regression after permissions change; isolated local DEMO instance only. */
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const require = createRequire(process.env.RP_PLAYWRIGHT_PACKAGE || 'C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = require('playwright');
const base = process.env.RP_DEMO_URL || 'http://127.0.0.1:9470', out = 'tools/.preview/security-public';
await mkdir(out, { recursive: true });
const changes = execFileSync('git', ['diff', '--name-only', 'a3cc84c33ee72968f4158fdddb6346ce6823f52c', '--', 'theme/rp-usados'], { encoding: 'utf8' }).trim().split('\n');
assert(!changes.some(path => /\/src\/|\/assets\/media\/|\.php$/.test(path) && !/\/inc\/(post-types\/vehiculo|vehicle-admin|vehicle-data)\.php$/.test(path)), 'Public templates/assets changed outside security scope');
const browser = await chromium.launch({ channel: 'msedge', headless: true }), checks = [], profiles = [];
const check = (name, result) => { assert(result, name); checks.push(name); };
try {
  for (const [width, height] of [[1440,900], [375,812], [390,844], [430,932]]) {
    const mobile = width < 900, context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage(), requests = [], errors = [], bad = [];
    page.on('request', r => requests.push(r.url())); page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(base)) bad.push(r.url()); });
    check(`${width}: home responds`, (await page.goto(base)).status() === 200);
    await page.waitForFunction(() => window.__RP_V2__?.state === 'ready', null, { timeout: 20000 });
    check(`${width}: approved device video only`, requests.some(u => u.includes('.mp4')) && requests.filter(u => /\.mp4|poster\.png/.test(u)).every(u => u.includes(mobile ? 'hero-mobile-v4-1080' : 'hero-desktop-1080')));
    check(`${width}: eligible stock/price contract`, await page.locator('.vehicle').count() === 9 && await page.locator('.vehicle[data-state="reservado"]').count() === 2 && await page.locator('.vehicle[data-state="vendido"],.vehicle-price').count() === 0);
    check(`${width}: one responsive cover per card`, await page.locator('.vehicle').evaluateAll(cards => cards.every(card => card.querySelectorAll('a').length === 1 && card.querySelectorAll('img').length === 1 && card.querySelector('img').srcset && card.querySelector('img').sizes)));
    check(`${width}: no V1 or secondary gallery downloads`, !requests.some(u => /vento-rear|vento-front|\.glb|\.hdr|three[./-]|hero-webgl/.test(u)));
    if (mobile) { await page.locator('.header-menu-toggle').click(); check(`${width}: native navigation opens`, await page.locator('.header-menu-toggle').getAttribute('aria-expanded') === 'true'); await page.keyboard.press('Escape'); }
    await page.goto(`${base}/vehiculos/`);
    check(`${width}: CPT archive contract`, await page.locator('.vehicle').count() === 9 && !(await page.locator('main').innerText()).includes('TST'));
    await page.locator('.vehicle-link[href*="demo-vento"]').click();
    check(`${width}: detail has price and gallery`, (await page.locator('.vehicle-price').innerText()).includes('TST') && await page.locator('.gallery-slide').count() === 4);
    await page.locator('.gallery-slide').first().locator('img').evaluate(img => img.decode());
    await page.locator('.gallery-viewport').focus(); await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.querySelector('[data-position]').textContent.startsWith('02'));
    check(`${width}: gallery navigation retained`, true);
    await page.locator('.gallery-slide').nth(1).locator('.gallery-open').click();
    check(`${width}: lightbox retained`, await page.locator('.gallery-lightbox').evaluate(d => d.open));
    await page.keyboard.press('Escape');
    await page.goto(`${base}/vehiculos/demo-duster/`);
    check(`${width}: optional data remains absent`, await page.locator('.unit-facts dt').count() === 1 && await page.locator('.unit-version').count() === 0);
    check(`${width}: no overflow or local errors`, await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth) && errors.length === 0 && bad.length === 0);
    profiles.push({ width, height, errors, bad }); await context.close();
  }
  await writeFile(`${out}/report.json`, JSON.stringify({ passed: checks.length, checks, profiles, publicSourceUnchanged: true, browser: browser.version() }, null, 2));
  console.log(`Public security regression: ${checks.length} checks passed; public source unchanged.`);
} finally { await browser.close(); }
