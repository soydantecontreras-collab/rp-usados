import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const require = createRequire(process.env.RP_PLAYWRIGHT_PACKAGE || 'C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = require('playwright');
const out = 'blender/web-integration-v6-1/qa';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
 const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
 const messages = [];
 page.on('console', m => { if (['error','warning'].includes(m.type())) messages.push(m.text()); });
 page.on('pageerror', e => messages.push(e.message));
 await page.goto('http://127.0.0.1:9400/?rp_hero_preview=1&hero_debug=1', { waitUntil: 'domcontentloaded', timeout: 120000 });
 await page.waitForFunction(() => ['ready','fallback'].includes(document.querySelector('[data-hero-3d]')?.dataset.state), null, { timeout: 30000 }).catch(e => messages.push(e.message));
 await page.waitForTimeout(1200);
 await page.screenshot({ path: `${out}/web-initial.png` });
 const initial = await page.evaluate(() => ({ ...window.__RP_HERO_DIAGNOSTICS__, resources: performance.getEntriesByType('resource').map(r => ({ name:r.name,duration:r.duration,transferSize:r.transferSize,encodedBodySize:r.encodedBodySize })) }));
 await writeFile(`${out}/probe.json`, JSON.stringify({ initial, messages }, null, 2));
 console.log(JSON.stringify({ ...initial, renderSamples: initial.renderSamples?.slice(-5), resources: undefined, messages }, null, 2));
} finally { await browser.close(); }
