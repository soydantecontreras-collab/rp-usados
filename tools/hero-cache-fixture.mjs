// QA-only HTTP fixture: same local theme/media bytes, explicit browser cache policy.
// WordPress's normal preview uses max-age=0. No production or backend change.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('theme/rp-usados'),prefix='/wp-content/themes/rp-usados/';
const types={'.mp4':'video/mp4','.png':'image/png','.svg':'image/svg+xml','.css':'text/css','.js':'text/javascript','.woff2':'font/woff2'};
createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1:9460');
  if(url.pathname.startsWith(prefix)){
   const file=resolve(root,decodeURIComponent(url.pathname.slice(prefix.length)));if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
   const [data,info]=await Promise.all([readFile(file),stat(file)]),etag='"'+info.size+'-'+info.mtimeMs+'"';
   const headers={'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'public, max-age=3600','Accept-Ranges':'bytes',ETag:etag};
   if(req.headers['if-none-match']===etag){res.writeHead(304,headers).end();return;}
   const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
   if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),data.length-1):data.length-1;res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1});res.end(data.subarray(start,end+1));}
   else{res.writeHead(200,{...headers,'Content-Length':data.length});res.end(data);}
  }else if(url.pathname==='/'){
   const html=await fetch('http://127.0.0.1:9400/').then(r=>r.text());res.writeHead(200,{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store'});res.end(html.replaceAll('http://127.0.0.1:9400','http://127.0.0.1:9460'));
  }else{res.writeHead(404).end();}
 }catch{res.writeHead(404).end();}
}).listen(9460,'127.0.0.1',()=>console.log('QA cache fixture: http://127.0.0.1:9460/'));
