import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';

const approved = '460b17621cd6ebadd8c30ac862acc4d147aaee58';
const root = resolve(import.meta.dirname, '..');
const origin = 'http://127.0.0.1:9400';
const themePrefix = '/wp-content/themes/rp-usados/';
const out = resolve(root, process.argv[2] || 'tools/.preview/vercel-testing-460b176');
assert(out.startsWith(resolve(root, 'tools/.preview') + '/'.replace('/', process.platform === 'win32' ? '\\' : '/')));
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], {cwd:root,encoding:'utf8'}).trim(), approved);
assert.equal(execFileSync('git', ['diff', approved, '--', 'theme/rp-usados'], {cwd:root,encoding:'utf8'}).trim(), '');
await mkdir(out, {recursive:true});
assert.equal((await readdir(out)).length, 0, 'Use a fresh output directory; never deploy stale files.');

const allowed = new Set(['.html','.css','.js','.woff2','.svg','.png','.mp4','.txt','.json']);
const files = new Map();
const digest = data => createHash('sha256').update(data).digest('hex');
function prepareHtml(html, sourceOrigin) {
  html = html.replace(/<link\b[^>]*rel=['"](?:https:\/\/api\.w\.org\/|alternate|EditURI|wlwmanifest|shortlink|dns-prefetch)['"][^>]*>\s*/gi, '');
  html = html.replace(/<meta\b[^>]*name=['"](?:generator|robots)['"][^>]*>\s*/gi, '');
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, tag => tag.includes('_wpemojiSettings') || tag.includes('speculationrules') ? '' : tag);
  html = html.replaceAll(sourceOrigin, '');
  assert(!/127\.0\.0\.1|localhost|99999999/.test(html));
  return html.replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
}
async function save(path, data) {
  assert(!path.includes('..') && !path.startsWith('/'));
  const file = resolve(out, path);
  await mkdir(dirname(file), {recursive:true});
  await writeFile(file, data);
  files.set(path, {bytes:Buffer.byteLength(data),sha256:digest(data)});
}
async function get(path) {
  const response = await fetch(origin + path);
  assert.equal(response.status, 200, path);
  return response;
}

for (const [route, target] of [['/', 'index.html'], ['/vehiculos/', 'vehiculos/index.html']]) {
  let html = await (await get(route)).text();
  assert(html.includes('stock-empty') && !html.includes('class="vehicle-link"'), 'Only the empty real inventory can be exported.');
  assert(!/QA LOCAL|NO ES STOCK|99999999|TST\s|wpadminbar|__RP_TRACE__|__NATIVE_TRACE__/.test(html));
  // WordPress discovery/editor endpoints do not exist in a presentation snapshot.
  html = prepareHtml(html, origin);
  for (const match of html.matchAll(/(?:src|href)=['"]([^'"]+)['"]/g)) {
    const url = match[1];
    if (!url.startsWith('/wp-includes/')) continue;
    const path = new URL(url, origin).pathname;
    assert(path.endsWith('.css'), 'Do not publish WordPress runtime scripts.');
    if (!files.has(path.slice(1))) await save(path.slice(1), Buffer.from(await (await get(path)).arrayBuffer()));
  }
  await save(target, html);
}

if (process.env.RP_EXPORT_DEMO === '1') {
  const demoOrigin = 'http://127.0.0.1:9462';
  const response = await fetch(demoOrigin + '/vehiculos/demo-visual/');
  assert.equal(response.status, 200);
  let html = prepareHtml(await response.text(), demoOrigin).replaceAll('/vehiculos/demo-visual/', '/demo/ficha/');
  assert(html.includes('DEMO VISUAL') && html.includes('no es una unidad en venta') && html.includes('patrones de prueba'));
  assert(!/wa\.me|99999999|TST\s/.test(html));
  const uploads = new Set([...html.matchAll(/\/wp-content\/uploads\/[^\s"'<>?,]+\.png/g)].map(m=>m[0]));
  assert(uploads.size > 0);
  for (const path of uploads) {
    assert(/\/demo-(?:wide|portrait|square)(?:-\d+x\d+)?\.png$/.test(path), 'Only labelled demonstration patterns may be exported.');
    const image = await fetch(demoOrigin + path);
    assert.equal(image.status, 200);
    await save(path.slice(1), Buffer.from(await image.arrayBuffer()));
  }
  await save('demo/ficha/index.html', html);
}

await save(themePrefix.slice(1) + 'style.css', await readFile(resolve(root, 'theme/rp-usados/style.css')));
for (const folder of ['assets/dist/assets','assets/brand','assets/hero/v2']) {
  for (const entry of await readdir(resolve(root, 'theme/rp-usados',folder), {withFileTypes:true})) {
    assert(entry.isFile(), 'Only flat approved asset directories are allowed.');
    if (entry.name.startsWith('admin-')) continue;
    const extension = entry.name.slice(entry.name.lastIndexOf('.'));
    assert(allowed.has(extension));
    assert(!/three|webgl|\.glb|\.hdr|\.map$/.test(entry.name));
    await save(themePrefix.slice(1) + folder + '/' + entry.name, await readFile(resolve(root, 'theme/rp-usados',folder,entry.name)));
  }
}
await save('robots.txt', 'User-agent: *\nDisallow: /\n');
await save('vercel.json', JSON.stringify({
  $schema:'https://openapi.vercel.sh/vercel.json',
  framework:null,
  git:{deploymentEnabled:false},
  trailingSlash:true,
  headers:[
    {source:'/(.*)',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'},{key:'X-Content-Type-Options',value:'nosniff'}]},
    {source:'/wp-content/themes/rp-usados/assets/(.*)',headers:[{key:'Cache-Control',value:'public, max-age=3600'}]},
  ],
},null,2));
await save('.vercelignore', '.vercel/\n');
for (const [path] of files) {
  if (path === '.vercelignore') continue;
  assert(allowed.has(path.slice(path.lastIndexOf('.'))));
  if (/\.(?:html|css|js|json|svg|txt)$/.test(path)) {
    const text = await readFile(resolve(out,path),'utf8');
    assert(!/-----BEGIN .*PRIVATE KEY|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30}|__RP_TRACE__|__NATIVE_TRACE__|__QA_VIDEO__/.test(text),path);
  }
}
const report = {sourceCommit:approved,branch:'main',kind:'static-presentation-only',out:relative(root,out),routes:['/','/vehiculos/',...(process.env.RP_EXPORT_DEMO==='1'?['/demo/ficha/']:[])],files:Object.fromEntries(files),totalBytes:[...files.values()].reduce((n,f)=>n+f.bytes,0),limitations:['No WordPress runtime or administration.','Main catalog is empty; no QA records presented as real inventory.','WhatsApp number remains unconfirmed; no fabricated recipient.','Optional /demo/ficha/ is a labelled visual demonstration using image test patterns, not a real vehicle.']};
await mkdir(resolve(root,'artifacts/vercel-preview'),{recursive:true});
await writeFile(resolve(root,'artifacts/vercel-preview/export-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({out:report.out,commit:approved,files:files.size,totalBytes:report.totalBytes,routes:report.routes}));
