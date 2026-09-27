// Local artifact viewer with byte-range support for seeking in the Blender MP4.
import {createServer} from 'node:http';
import {createReadStream,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,sep,extname} from 'node:path';
const root=resolve(fileURLToPath(new URL('../../../',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.md':'text/plain; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.mp4':'video/mp4','.blend':'application/octet-stream'};
createServer((req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let path=resolve(root,'.'+pathname);
    if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return;}
    if(statSync(path).isDirectory())path=resolve(path,'index.html');
    const stat=statSync(path);
    const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    const start=range?Number(range[1]):0;
    const end=range&&range[2]?Math.min(Number(range[2]),stat.size-1):stat.size-1;
    if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
    const headers={'Content-Type':mime[extname(path)]||'application/octet-stream','Accept-Ranges':'bytes','Content-Length':end-start+1,'Cache-Control':'no-store'};
    if(range)headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
    res.writeHead(range?206:200,headers);
    if(req.method==='HEAD')res.end();else createReadStream(path,{start,end}).pipe(res);
  }catch{res.writeHead(404).end('Not found');}
}).listen(9412,'127.0.0.1',()=>console.log('Blender review: http://127.0.0.1:9412/blender/stage-2a/review/'));
