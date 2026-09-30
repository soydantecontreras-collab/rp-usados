import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const require = createRequire(process.env.RP_PLAYWRIGHT_PACKAGE || 'C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = require('playwright');
const browser = await chromium.launch({ channel:'msedge', headless:true });
const out = 'artifacts/local-demo';
await mkdir(out, { recursive:true });
const checks = [];
const check = (name, pass) => { assert(pass, name); checks.push(name); };
const profiles = [
  { name:'desktop', width:1440, height:900, mobile:false },
  { name:'mobile-375', width:375, height:812, mobile:true },
  { name:'mobile-390', width:390, height:844, mobile:true },
  { name:'mobile-430', width:430, height:932, mobile:true },
];
const align = (page, selector) => page.evaluate(selector => {
  const element = document.querySelector(selector);
  scrollTo(0, element.getBoundingClientRect().top + scrollY - document.querySelector('header').offsetHeight);
}, selector);
const errors = [];
try {
  for (const profile of profiles) {
    const context = await browser.newContext({ viewport:{width:profile.width,height:profile.height}, isMobile:profile.mobile, hasTouch:profile.mobile, deviceScaleFactor:1 });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(`${profile.name}: ${error.message}`));
    const requests = [];
    page.on('request', request => requests.push(request.url()));
    await page.goto('http://127.0.0.1:9470/');
    await page.waitForFunction(() => window.__RP_V2__?.state === 'ready', null, {timeout:15000});
    await page.evaluate(() => document.fonts.ready);
    check(`${profile.name}: clearly demo`, await page.locator('aside[aria-label="Datos de prueba"]').isVisible());
    check(`${profile.name}: 9 eligible vehicles`, await page.locator('.vehicle').count() === 9);
    check(`${profile.name}: 2 reserved, sold excluded`, await page.locator('.vehicle[data-state="reservado"]').count() === 2 && await page.locator('.vehicle[data-state="vendido"]').count() === 0);
    check(`${profile.name}: no price in cards`, await page.locator('.vehicle-price').count() === 0 && !(await page.locator('#catalogo').innerText()).includes('TST'));
    check(`${profile.name}: full-card links`, await page.locator('.vehicle').evaluateAll(cards => cards.every(card => card.children.length === 1 && card.firstElementChild.matches('a.vehicle-link'))));
    check(`${profile.name}: one device video resource`, requests.some(url => url.includes('.mp4')) && requests.filter(url => url.includes('.mp4')).every(url => url.includes(profile.mobile ? 'hero-mobile-portrait-crf18' : 'hero-fast-dark-doors')));
    check(`${profile.name}: no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
    await page.screenshot({ path:`${out}/home-${profile.name}.png` });
    await align(page, '.catalog-content');
    await page.locator('.vehicle-photo').evaluateAll(images => Promise.all(images.map(image => { image.loading = 'eager'; return image.decode().catch(() => {}); })));
    check(`${profile.name}: all card photos load`, await page.locator('.vehicle-photo').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)));
    await page.screenshot({ path:`${out}/catalog-${profile.name}.png` });
    if (profile.name === 'desktop' || profile.name === 'mobile-390') {
      const captureStyle = await page.addStyleTag({ content:'.v2-header,.skip{visibility:hidden!important}' });
      await page.locator('#catalogo').screenshot({ path:`${out}/catalog-section-${profile.name}.png` });
      await captureStyle.evaluate(node => node.remove());
    }
    if (profile.name === 'desktop' || profile.name === 'mobile-390') {
      await align(page, '#nosotros');
      await page.locator('.heritage-media img').evaluate(img => img.decode());
      check(`${profile.name}: brand photo loads`, await page.locator('.heritage-media img').evaluate(img => img.complete && img.naturalWidth > 0));
      await page.screenshot({ path:`${out}/nosotros-${profile.name}.png` });
      const captureStyle = await page.addStyleTag({ content:'.v2-header,.skip{visibility:hidden!important}' });
      await page.locator('#nosotros').screenshot({ path:`${out}/nosotros-section-${profile.name}.png` });
      await captureStyle.evaluate(node => node.remove());
      await align(page, '#opciones');
      await page.screenshot({ path:`${out}/financiacion-${profile.name}.png` });
      const captureStyle2 = await page.addStyleTag({ content:'.v2-header,.skip{visibility:hidden!important}' });
      await page.locator('#opciones').screenshot({ path:`${out}/financiacion-section-${profile.name}.png` });
      await captureStyle2.evaluate(node => node.remove());
    }
    await page.goto('http://127.0.0.1:9470/vehiculos/demo-vento/');
    await page.evaluate(() => document.fonts.ready);
    check(`${profile.name}: full gallery`, await page.locator('.gallery-slide').count() === 4);
    check(`${profile.name}: price only on detail`, (await page.locator('.vehicle-price').innerText()).includes('TST'));
    check(`${profile.name}: no fabricated WhatsApp number`, await page.locator('.unit-enquiry a[href*="wa.me"]').count() === 0);
    await page.screenshot({ path:`${out}/ficha-${profile.name}.png` });
    await page.locator('.gallery-slide img').evaluateAll(images => Promise.all(images.map(img => { img.loading = 'eager'; return img.decode().catch(() => {}); })));
    check(`${profile.name}: mixed source image ratios`, await page.locator('.gallery-slide img').evaluateAll(images => images.length === 4 && new Set(images.map(img => `${img.naturalWidth}/${img.naturalHeight}`)).size >= 3));
    if (profile.name === 'desktop' || profile.name === 'mobile-390') {
      await page.locator('[data-next]').click();
      await page.waitForFunction(() => document.querySelector('[data-position]').textContent.startsWith('2'));
      await page.screenshot({ path:`${out}/galeria-${profile.name}.png` });
      const captureStyle = await page.addStyleTag({ content:'.v2-header,.skip{visibility:hidden!important}' });
      await page.locator('#unit-info').screenshot({ path:`${out}/ficha-info-${profile.name}.png` });
      await captureStyle.evaluate(node => node.remove());
    }
    check(`${profile.name}: no errors`, errors.length === 0);
    await page.goto('http://127.0.0.1:9470/vehiculos/');
    check(`${profile.name}: archive shows eligible demo only`, await page.locator('.vehicle').count() === 9 && await page.locator('.vehicle[data-state="vendido"]').count() === 0);
    await page.goto('http://127.0.0.1:9470/vehiculos/demo-duster/');
    check(`${profile.name}: optional fields collapse cleanly`, await page.locator('.full-specs>div').count() === 3 && await page.locator('.unit-strip dt').count() === 1);
    await context.close();
    if (profile.mobile) {
      const context2 = await browser.newContext({ viewport:{width:profile.width,height:profile.height}, isMobile:true, hasTouch:true, deviceScaleFactor:1 });
      const page2 = await context2.newPage();
      await page2.goto('http://127.0.0.1:9400/');
      await page2.waitForFunction(() => !!window.__RP_V2__);
      await page2.evaluate(() => scrollTo(0, 160));
      await page2.waitForFunction(() => __RP_V2__.progress > .1);
      const stage = await page2.evaluate(() => ({
        viewport:visualViewport.height,
        bottom:document.querySelector('.hero-stage').getBoundingClientRect().bottom,
        stageHeight:document.querySelector('.hero-stage').getBoundingClientRect().height,
        dynamic:CSS.supports('height','100dvh'),
      }));
      check(`${profile.name}: sticky scene fills viewport`, Math.abs(stage.bottom - stage.viewport) < 2);
      await page2.setViewportSize({ width:profile.width, height:profile.height + 72 });
      await page2.waitForTimeout(250);
      const grown = await page2.evaluate(() => ({ viewport:visualViewport.height, bottom:document.querySelector('.hero-stage').getBoundingClientRect().bottom }));
      check(`${profile.name}: stays flush after viewport growth`, Math.abs(grown.bottom - grown.viewport) < 2);
      await page2.setViewportSize({ width:profile.width, height:profile.height });
      await page2.waitForTimeout(250);
      const shrunk = await page2.evaluate(() => ({ viewport:visualViewport.height, bottom:document.querySelector('.hero-stage').getBoundingClientRect().bottom }));
      check(`${profile.name}: stays flush after viewport shrink`, Math.abs(shrunk.bottom - shrunk.viewport) < 2);
      await page2.evaluate(() => {
        const root = document.querySelector('.hero-track');
        const stage = document.querySelector('.hero-stage');
        scrollTo(0, root.offsetTop - document.querySelector('header').offsetHeight + (root.offsetHeight - stage.offsetHeight) * .98);
      });
      await page2.waitForFunction(() => __RP_V2__.progress > .97);
      const join = await page2.evaluate(() => {
        const stage = document.querySelector('.hero-stage').getBoundingClientRect();
        const track = document.querySelector('.hero-track').getBoundingClientRect();
        const bridge = document.querySelector('.transition-bridge').getBoundingClientRect();
        const curve = document.querySelector('.catalog-cap').getBoundingClientRect();
        return {stageBottom:stage.bottom,trackBottom:track.bottom,bridgeTop:bridge.top,bridgeBottom:bridge.bottom,curveTop:curve.top};
      });
      check(`${profile.name}: bridge and curve contiguous`, Math.abs(join.trackBottom - join.bridgeTop) < 2 && Math.abs(join.bridgeBottom - join.curveTop) < 2);
      await page2.screenshot({ path:`${out}/hero-handoff-${profile.name}.png` });
      await page2.evaluate(() => scrollTo(0, 140));
      await page2.waitForFunction(() => __RP_V2__.progress < .3);
      check(`${profile.name}: reverse scroll follows native document`, true);
      await context2.close();
    }
  }
  const reduced = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const page = await reduced.newPage();
  const requested = [];
  page.on('request', request => requested.push(request.url()));
  await page.goto('http://127.0.0.1:9400/');
  check('reduced motion static with catalog access', await page.locator('.hero-poster').isVisible() && !requested.some(url => url.endsWith('.mp4')));
  await page.locator('header nav a').click();
  check('reduced motion skip works', await page.evaluate(() => document.activeElement.id === 'catalogo'));
  await reduced.close();
  const clean = await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const cleanPage = await clean.newPage();
  await cleanPage.goto('http://127.0.0.1:9400/');
  check('normal site remains empty and has no demo markers', await cleanPage.locator('.stock-empty').count() === 1 && await cleanPage.locator('aside[aria-label="Datos de prueba"]').count() === 0);
  await cleanPage.setViewportSize({width:720,height:900});
  check('200% browser-zoom equivalent reflow has no horizontal overflow', await cleanPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  await clean.close();
} finally {
  await writeFile(`${out}/report.json`, JSON.stringify({checks,errors,profiles},null,2));
  await browser.close();
}
console.log(JSON.stringify({ passed:checks.length, errors },null,2));
