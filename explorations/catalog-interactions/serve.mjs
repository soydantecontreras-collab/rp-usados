// Serves only this isolated directory on loopback. No theme/admin/config routes.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = import.meta.dirname;
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json', '.woff2':'font/woff2', '.jpg':'image/jpeg', '.png':'image/png', '.webp':'image/webp' };
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + sep) || !mime[extname(file)]) { response.writeHead(404).end(); return; }
    const data = await readFile(file);
    response.writeHead(200, { 'Content-Type':mime[extname(file)], 'Cache-Control':'no-store' });
    response.end(data);
  } catch { response.writeHead(404).end(); }
}).listen(9480, '127.0.0.1', () => console.log('Catalog interaction sandbox: http://127.0.0.1:9480/'));
