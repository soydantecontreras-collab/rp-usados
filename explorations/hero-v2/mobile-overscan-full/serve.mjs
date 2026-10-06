import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
const repo=resolve(import.meta.dirname,'../../..'),snapshot=resolve(repo,'tools/.preview/vercel-mobile-stable-3d081ca-20261005');
const entry=JSON.parse(await readFile(resolve(repo,'tools/.preview/mobile-overscan-full/entry.json'),'utf8'));
const source=await readFile(resolve(repo,'tools/.preview/hero-fullscreen-static-20261006/hero-mobile-test-a/index.html'),'utf8');
const previous=await readFile(resolve(repo,'tools/.preview/hero-dark-bridge-content-static-20261006-r2/hero-mobile-dark-bridge/index.html'),'utf8');
const content=previous.match(/<div class="catalog-content test-content">[\s\S]*?<\/section>/)[0];
const template=source
 .replace('data-hero-test-variant="A"','data-media-overscan="lvh"')
 .replace('<link rel="stylesheet" href="/hero-native-test.css"><script src="/hero-native-test.js"></script>','<link rel="stylesheet" href="/viewport.css"><link rel="stylesheet" href="/content-test.css"><script src="/init.js"></script>')
 .replace(/href='\/wp-content\/themes\/rp-usados\/assets\/dist\/assets\/app-[^']+\.css\?ver=0\.2\.0'/,`href='/experiment/${entry.css[0]}'`)
 .replace(/src="\/wp-content\/themes\/rp-usados\/assets\/dist\/assets\/app-[^"]+\.js"/,`src="/experiment/${entry.file}"`)
 .replace('</div><div class="hero-caption">','</div><div class="hero-overlay"><div class="hero-caption">')
 .replace('<p class="media-status" role="status"></p></div></div>','<p class="media-status" role="status"></p></div></div></div>')
 .replace(/<div class="catalog-content">[\s\S]*?<\/section>/,content);
assert(template.includes('hero-overlay')&&template.includes('CATÁLOGO / TEST'));
assert(!/<iframe|fieldset|lower-blend|interior-matte/.test(template));
const types={'.html':'text/html;charset=utf-8','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.mp4':'video/mp4','.png':'image/png','.svg':'image/svg+xml'};
const port=Number(process.argv[2]||9498);
createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://127.0.0.1:'+port);
 if(['/','/hero-mobile-overscan/'].includes(url.pathname)){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store','X-Robots-Tag':'noindex'}).end(template);return;}
 const local=['/viewport.css','/init.js','/content-test.css'].includes(url.pathname),bundle=url.pathname.startsWith('/experiment/');
 const base=local?import.meta.dirname:bundle?resolve(repo,'tools/.preview/mobile-overscan-full/bundle'):snapshot;
 const name=bundle?url.pathname.slice('/experiment'.length):url.pathname;
 const file=resolve(base,'.'+decodeURIComponent(name));if(!file.startsWith(base+sep)){res.writeHead(403).end();return;}
 if(!(await stat(file)).isFile()){res.writeHead(404).end();return;}
 const data=await readFile(file),headers={'Content-Type':types[extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':bundle||local?'no-store':'public,max-age=3600'};
 const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
 if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),data.length-1):data.length-1;if(start>end){res.writeHead(416).end();return;}res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1}).end(data.subarray(start,end+1));}
 else res.writeHead(200,{...headers,'Content-Length':data.length}).end(req.method==='HEAD'?undefined:data);
}catch{res.writeHead(404).end();}}).listen(port,'127.0.0.1',()=>console.log(`Independent overscan full page: http://127.0.0.1:${port}/hero-mobile-overscan/`));
