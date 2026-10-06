import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';

const repo=resolve(import.meta.dirname,'../../..');
const snapshot=resolve(repo,'tools/.preview/vercel-mobile-stable-3d081ca-20261005');
const source=await readFile(resolve(repo,'tools/.preview/hero-fullscreen-static-20261006/hero-mobile-test-a/index.html'),'utf8');
const template=source
  .replace('data-hero-test-variant="A"','data-layer-variant="VARIANT"')
  .replace('<link rel="stylesheet" href="/hero-native-test.css"><script src="/hero-native-test.js"></script>','<link rel="stylesheet" href="/viewport.css"><script src="/init.js"></script>')
  .replace('</div><div class="hero-caption">','</div><div class="hero-overlay"><div class="hero-caption">')
  .replace('<p class="media-status" role="status"></p></div></div>','<p class="media-status" role="status"></p></div></div></div>');
assert(template.includes('hero-overlay'));
assert(!/<iframe|fieldset|hero-frame|data-delta/.test(template));
const types={'.html':'text/html;charset=utf-8','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.mp4':'video/mp4','.png':'image/png','.svg':'image/svg+xml'};
const port=Number(process.argv[2]||9496);
createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://127.0.0.1:'+port);
    if(['/','/hero-mobile-current/','/hero-mobile-three-layer/'].includes(url.pathname)) {
      const variant=url.pathname==='/hero-mobile-three-layer/'?'B':'A';
      const html=template.replace('VARIANT',variant);
      res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store','X-Robots-Tag':'noindex'}).end(html);return;
    }
    const local=['/viewport.css','/init.js'].includes(url.pathname);
    const base=local?import.meta.dirname:snapshot;
    const file=resolve(base,'.'+decodeURIComponent(url.pathname));
    if(!file.startsWith(base+sep)){res.writeHead(403).end();return;}
    if(!(await stat(file)).isFile()){res.writeHead(404).end();return;}
    const data=await readFile(file),headers={'Content-Type':types[extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':local?'no-store':'public,max-age=3600'};
    const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if(range){
      const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),data.length-1):data.length-1;
      if(start>end){res.writeHead(416).end();return;}
      res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1});res.end(data.subarray(start,end+1));
    } else {res.writeHead(200,{...headers,'Content-Length':data.length});res.end(req.method==='HEAD'?undefined:data);}
  } catch {res.writeHead(404).end();}
}).listen(port,'127.0.0.1',()=>console.log(`Full-document tests: http://127.0.0.1:${port}/hero-mobile-current/ and /hero-mobile-three-layer/`));
