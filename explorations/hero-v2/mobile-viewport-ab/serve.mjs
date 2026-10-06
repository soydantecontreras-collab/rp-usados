import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const dir=import.meta.dirname,repo=resolve(dir,'../../..');
const snapshot=resolve(repo,process.env.RP_AB_SNAPSHOT||'tools/.preview/vercel-mobile-stable-3d081ca-20261005');
const port=Number(process.env.RP_AB_PORT||9493);
let original;
try { original=await readFile(resolve(snapshot,'index.html'),'utf8'); }
catch { throw new Error('Falta el snapshot aprobado. Ver README.md; no se modifica WordPress para arrancar esta sandbox.'); }
if(!original.includes('hero-scene')||!original.includes('--hero-stable-viewport'))throw new Error('El snapshot no contiene la versión A aprobada.');
const injected=original.replace('</head>','<link rel="stylesheet" href="/frame.css"><script src="/stage-init.js"></script></head>').replace('</body>','<script type="module" src="/frame.js"></script></body>');
const types={'.html':'text/html;charset=utf-8','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2','.mp4':'video/mp4','.png':'image/png','.svg':'image/svg+xml','.jpeg':'image/jpeg','.jpg':'image/jpeg','.webp':'image/webp','.cur':'image/x-icon'};
createServer(async(req,res)=>{
 try {
  const path=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(path==='/hero.html'){res.writeHead(200,{'Content-Type':types['.html'],'Cache-Control':'no-store'}).end(injected);return;}
  const local=path==='/'||/^\/(?:index\.html|lab\.(?:css|js)|frame\.(?:css|js)|stage-init\.js)$/.test(path);
  const base=local?dir:snapshot;
  const file=resolve(base,'.'+(path==='/'?'/index.html':path)+(path!=='/'&&path.endsWith('/')?'index.html':''));
  if(!file.startsWith(base+sep)){res.writeHead(403).end();return;}
  if(!(await stat(file)).isFile()){res.writeHead(404).end();return;}
  const data=await readFile(file),headers={'Content-Type':types[extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':local?'no-store':'public,max-age=3600'};
  const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),data.length-1):data.length-1;if(start>end||start>=data.length){res.writeHead(416,{'Content-Range':`bytes */${data.length}`}).end();return;}res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1}).end(data.subarray(start,end+1));}
  else res.writeHead(200,{...headers,'Content-Length':data.length}).end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404).end();}
}).listen(port,'127.0.0.1',()=>console.log(`Sandbox A/B local: http://127.0.0.1:${port}/`));
