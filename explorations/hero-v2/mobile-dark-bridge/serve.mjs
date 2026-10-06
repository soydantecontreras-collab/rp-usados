import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
const repo=resolve(import.meta.dirname,'../../..'),snapshot=resolve(repo,'tools/.preview/vercel-mobile-stable-3d081ca-20261005');
const entry=JSON.parse(await readFile(resolve(repo,'tools/.preview/mobile-dark-bridge/entry.json'),'utf8'));
const source=await readFile(resolve(repo,'tools/.preview/hero-fullscreen-static-20261006/hero-mobile-test-a/index.html'),'utf8');
const matte='<svg class="interior-matte" viewBox="0 0 720 1280" aria-hidden="true" focusable="false"><defs><filter id="aperture-edge" filterUnits="userSpaceOnUse" x="-200" y="-260" width="1120" height="1940"><feGaussianBlur stdDeviation="1.2"/></filter></defs><polygon fill="#000" filter="url(#aperture-edge)" points="360,635 360,635 360,646 360,900 360,910 360,910 360,900 360,646"/></svg>';
const testContent=`<div class="catalog-content test-content"><div class="wrap test-content-inner">
 <div class="test-heading"><p class="label">Contenido de prueba · no es stock real</p><h2 id="test-content-title">CATÁLOGO / TEST</h2><p>Ya saliste del hero. Esta sección clara forma parte del documento: seguí deslizando para comprobar cómo responde Chrome.</p></div>
 <div class="test-blocks" aria-label="Bloques ficticios para probar el scroll">
 ${[1,2,3].map(n=>`<article class="test-block"><div class="test-placeholder" aria-hidden="true">0${n}</div><h3>Bloque de prueba 0${n}</h3><p>DEMO · Sin vehículo ni información comercial.</p></article>`).join('')}
 </div>
 <div class="test-bottom"><p class="label">Final del contenido de prueba</p><h3>El scroll continúa.</h3><p>El hero quedó atrás. Podés seguir bajando hasta aquí y volver arriba con scroll normal.</p></div>
 </div></div></section>`;
const template=source
 .replace('data-hero-test-variant="A"','data-dark-bridge="web-mobile"')
 .replace('<link rel="stylesheet" href="/hero-native-test.css"><script src="/hero-native-test.js"></script>','<link rel="stylesheet" href="/effect.css"><link rel="stylesheet" href="/content-test.css"><script src="/init.js"></script>')
 .replace(/href='\/wp-content\/themes\/rp-usados\/assets\/dist\/assets\/app-[^']+\.css\?ver=0\.2\.0'/,`href='/experiment/${entry.css[0]}'`)
 .replace(/src="\/wp-content\/themes\/rp-usados\/assets\/dist\/assets\/app-[^"]+\.js"/,`src="/experiment/${entry.file}"`)
 .replace('</picture>','</picture>'+matte)
 .replace('</div><div class="hero-caption">','</div><div class="lower-blend" aria-hidden="true"></div><div class="hero-caption">')
 .replace(/<div class="catalog-content">[\s\S]*?<\/section>/,testContent);
assert(template.includes('/experiment/')&&template.includes('lower-blend'));assert(!/<iframe|fieldset|data-layer-variant/.test(template));
assert(template.includes('CATÁLOGO / TEST')&&template.includes('test-bottom'));
const types={'.html':'text/html;charset=utf-8','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.mp4':'video/mp4','.png':'image/png','.svg':'image/svg+xml'};
const port=Number(process.argv[2]||9497);
createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://127.0.0.1:'+port);
 if(['/','/hero-mobile-dark-bridge/'].includes(url.pathname)){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store','X-Robots-Tag':'noindex'}).end(template);return;}
 const local=['/effect.css','/content-test.css'].includes(url.pathname),init=url.pathname==='/init.js',bundle=url.pathname.startsWith('/experiment/');
 const base=local||init?import.meta.dirname:bundle?resolve(repo,'tools/.preview/mobile-dark-bridge/bundle'):snapshot;
 const name=bundle?url.pathname.slice('/experiment'.length):url.pathname;
 const file=resolve(base,'.'+decodeURIComponent(name));if(!file.startsWith(base+sep)){res.writeHead(403).end();return;}
 if(!(await stat(file)).isFile()){res.writeHead(404).end();return;}
 const data=await readFile(file),headers={'Content-Type':types[extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':bundle||local||init?'no-store':'public,max-age=3600'};
 const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
 if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),data.length-1):data.length-1;if(start>end){res.writeHead(416).end();return;}res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1}).end(data.subarray(start,end+1));}
 else res.writeHead(200,{...headers,'Content-Length':data.length}).end(req.method==='HEAD'?undefined:data);
}catch{res.writeHead(404).end();}}).listen(port,'127.0.0.1',()=>console.log(`Independent full page: http://127.0.0.1:${port}/hero-mobile-dark-bridge/`));
