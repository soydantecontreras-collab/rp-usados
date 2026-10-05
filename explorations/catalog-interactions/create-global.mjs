import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root=import.meta.dirname;
const source=await readFile(resolve(root,'index.html'),'utf8');
const original=source.match(/<article class="vehicle[^"]*"[\s\S]*?<\/article>/)?.[0];
if(!original?.includes('Vento'))throw new Error('Missing current DEMO card.');
const photos=['demo-vento-side-1024x576.jpg','demo-vento-rear-1024x576.jpg','demo-vento-front-683x1024.jpg'];
const upload=source.match(/href="(http:\/\/127\.0\.0\.1:9470\/vehiculos\/demo-vento\/)"/)?.[1];
if(!upload)throw new Error('Missing real local demo permalink.');
// Source attachment names are read from the existing demo detail; no new media or inventory.
const detail=await(await fetch(upload)).text();
for(const name of photos.slice(1)){
  const candidates=[...detail.matchAll(/https?:\/\/[^"' ,<>]+demo-vento-(?:front|rear)(?:-\d+x\d+)?\.jpg/g)].map(match=>match[0]);
  const url=candidates.find(value=>value.endsWith(name));
  if(!url)throw new Error('Missing approved DEMO image '+name);
  const response=await fetch(url);
  if(!response.ok)throw new Error('Image unavailable '+name);
  await writeFile(resolve(root,'assets',name),Buffer.from(await response.arrayBuffer()));
}
await copyFile(resolve(root,'../../theme/rp-usados/assets/hero/v2/poster-fast-dark-doors.png'),resolve(root,'assets/hero-approved-poster.png'));
const cards=photos.map((photo,index)=>{
  let card=original.replace(/class="vehicle[^"]*"/,'class="vehicle variant-b"').replace(/data-variant="[^"]*"/,'data-cursor="card"')
    .replace(/<img[\s\S]*?>/,'<img class="vehicle-photo" src="./assets/'+photo+'" width="'+(index===2?683:1024)+'" height="'+(index===2?1024:576)+'" loading="lazy" alt="Volkswagen Vento · DEMO, fotografía '+(index+1)+'">');
  return card;
}).join('\n');
const template=await readFile(resolve(root,'global-template.html'),'utf8');
await writeFile(resolve(root,'global.html'),template.replace('<!-- CARDS -->',cards));
console.log('Global cursor sandbox created: current unit and approved static poster, no new assets or data.');
