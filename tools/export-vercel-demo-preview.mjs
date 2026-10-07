// Export the isolated WordPress demo as a static, noindex presentation snapshot.
// The real WordPress installation and installable theme never receive demo posts.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { ownerPlaceholders, prepareOwnerPresentation } from './owner-preview-presentation.mjs';

const root = resolve(import.meta.dirname, '..');
const source = process.env.RP_DEMO_SOURCE || 'http://127.0.0.1:9470';
const ownerPresentation = process.env.RP_OWNER_PREVIEW === '1';
const ownerContact = { whatsapp:process.env.RP_PREVIEW_WHATSAPP || '', origin:process.env.RP_OWNER_PUBLIC_ORIGIN || '' };
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd:root, encoding:'utf8' }).trim();
const suffix = commit.slice(0, 9);
const out = resolve(root, process.argv[2] || `tools/.preview/vercel-demo-${suffix}`);
assert(out.startsWith(resolve(root, 'tools/.preview') + sep));
assert.equal(execFileSync('git', ['diff', 'HEAD', '--', 'theme/rp-usados'], { cwd:root, encoding:'utf8' }).trim(), '', 'Commit theme changes before exporting.');
await mkdir(out, { recursive:true });
assert.equal((await readdir(out)).length, 0, 'Use a fresh output directory.');

const theme = '/wp-content/themes/rp-usados/';
const slugs = ['demo-vento','demo-hilux','demo-cronos','demo-fit','demo-duster','demo-208','demo-ranger','demo-kicks','demo-onix'];
const routes = ['/', '/vehiculos/', ...slugs.map(slug => `/vehiculos/${slug}/`)];
const files = new Map();
const uploads = new Set();
const allowed = new Set(['.html','.css','.js','.woff2','.svg','.png','.jpg','.jpeg','.webp','.cur','.mp4','.txt','.json']);
const sha256 = data => createHash('sha256').update(data).digest('hex');

async function save(path, data) {
  assert(!path.startsWith('/') && !path.split('/').includes('..'));
  const destination = resolve(out, path);
  await mkdir(dirname(destination), { recursive:true });
  await writeFile(destination, data);
  files.set(path, { bytes:Buffer.byteLength(data), sha256:sha256(data) });
}
async function fetchSource(path) {
  const response = await fetch(source + path);
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
  return response;
}
function sanitizeHtml(html) {
  // Discovery and admin endpoints are unavailable in this static snapshot.
  html = html.replace(/<link\b[^>]*rel=['"](?:https:\/\/api\.w\.org\/|alternate|EditURI|wlwmanifest|shortlink|dns-prefetch)['"][^>]*>\s*/gi, '');
  html = html.replace(/<meta\b[^>]*name=['"](?:generator|robots)['"][^>]*>\s*/gi, '');
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, tag => tag.includes('_wpemojiSettings') || tag.includes('speculationrules') ? '' : tag);
  html = html.replaceAll(source, '');
  assert(!/127\.0\.0\.1|localhost|99999999|__RP_TRACE__|__NATIVE_TRACE__/.test(html));
  return html.replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
}

for (const route of routes) {
  let html = await (await fetchSource(route)).text();
  assert(html.includes('DEMO VISUAL · NO ES STOCK REAL'), `Missing demo banner: ${route}`);
  assert(!html.includes('wpadminbar'), `Admin toolbar leaked: ${route}`);
  if (route === '/' || route === '/vehiculos/') {
    assert.equal((html.match(/class="vehicle-link"/g) || []).length, 9, `${route}: expected nine cards`);
    assert(!html.includes('data-state="vendido"') && !html.includes('demo-vendido'), `${route}: sold vehicle leaked`);
    assert(!html.includes('class="vehicle-price"'), `${route}: card price leaked`);
  } else {
    assert(html.includes('DEMO VISUAL') && html.includes('DATOS DE DESARROLLO'), `Unlabelled detail: ${route}`);
  }
  html = sanitizeHtml(html);
  if (ownerPresentation) html = prepareOwnerPresentation(html, route, ownerContact);
  for (const match of html.matchAll(/\/wp-content\/uploads\/[^\s"'<>?,]+?\.(?:png|jpe?g)/gi)) {
    const path = match[0];
    assert(/^\/wp-content\/uploads\/\d{4}\/\d{2}\/demo-(?:landscape|portrait|square|wide|vento-side|vento-rear|vento-front)(?:-\d+x\d+)?\.(?:png|jpg)$/.test(path), `Unexpected upload: ${path}`);
    uploads.add(path);
  }
  for (const match of html.matchAll(/(?:src|href)=['"](\/wp-includes\/[^'"]+)['"]/g)) {
    const path = new URL(match[1], source).pathname;
    assert(path.endsWith('.css'), `Unexpected WP runtime asset: ${path}`);
    if (!files.has(path.slice(1))) await save(path.slice(1), Buffer.from(await (await fetchSource(path)).arrayBuffer()));
  }
  await save(route === '/' ? 'index.html' : route.slice(1) + 'index.html', html);
}

for (const path of uploads) await save(path.slice(1), Buffer.from(await (await fetchSource(path)).arrayBuffer()));
if (ownerPresentation) for (const [path, svg] of ownerPlaceholders) await save(path, svg);
await save(theme.slice(1) + 'style.css', await readFile(resolve(root, 'theme/rp-usados/style.css')));
for (const folder of ['assets/dist/assets','assets/brand','assets/hero/v2','assets/institutional']) {
  for (const entry of await readdir(resolve(root, 'theme/rp-usados',folder), { withFileTypes:true })) {
    assert(entry.isFile(), `Only flat approved asset directories: ${folder}`);
    if (entry.name.startsWith('admin-')) continue;
    assert(allowed.has(extname(entry.name)) && !/three|webgl|\.glb|\.hdr|\.map$/i.test(entry.name));
    await save(theme.slice(1) + folder + '/' + entry.name, await readFile(resolve(root, 'theme/rp-usados', folder, entry.name)));
  }
}
await save('robots.txt', 'User-agent: *\nDisallow: /\n');
await save('vercel.json', JSON.stringify({
  $schema:'https://openapi.vercel.sh/vercel.json', framework:null, git:{deploymentEnabled:false}, trailingSlash:true,
  headers:[
    {source:'/(.*)',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'},{key:'X-Content-Type-Options',value:'nosniff'}]},
    {source:'/wp-content/themes/rp-usados/assets/(.*)',headers:[{key:'Cache-Control',value:'public, max-age=3600'}]},
  ],
}, null, 2));
await save('.vercelignore', '.vercel/\n');
for (const path of files.keys()) {
  if (path === '.vercelignore') continue;
  assert(allowed.has(extname(path)), `Unexpected extension: ${path}`);
  if (/\.(?:html|css|js|json|svg|txt)$/.test(path)) {
    const value = await readFile(resolve(out,path),'utf8');
    assert(!/-----BEGIN .*PRIVATE KEY|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30}|__RP_TRACE__|__NATIVE_TRACE__|__QA_VIDEO__/.test(value), `Sensitive/debug content: ${path}`);
  }
}
const report = { generatedAt:new Date().toISOString(), sourceCommit:commit, branch:execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim(), kind:'static-demo-preview-noindex', out:relative(root,out), routes, files:Object.fromEntries(files), totalBytes:[...files.values()].reduce((n,item)=>n+item.bytes,0), limitations:['DEMO VISUAL / NO ES STOCK REAL on every page.','No WordPress runtime or administration.','No fabricated WhatsApp recipient.','Vehicles, prices and photos are visual test fixtures, not inventory.'] };
if (ownerPresentation) {
  report.kind = 'static-owner-presentation-noindex';
  report.contact = ownerContact;
  report.limitations = ['Owner presentation: development labels removed only in exported snapshot, explicitly authorized by user.','Nine isolated fixture vehicles; no real inventory or WordPress runtime.','Original JPEG photos retained; code-generated grid placeholders reproduced without text.'];
}
const reportPath = resolve(root, process.env.RP_EXPORT_REPORT || 'artifacts/vercel-demo-preview/export-report.json');
await mkdir(dirname(reportPath), {recursive:true});
await writeFile(reportPath, JSON.stringify(report,null,2));
console.log(JSON.stringify({out:report.out, commit, routes:routes.length, uploads:uploads.size, files:files.size, totalBytes:report.totalBytes}));
