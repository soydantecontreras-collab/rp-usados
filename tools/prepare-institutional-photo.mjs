// Usage: node tools/prepare-institutional-photo.mjs "C:/path/to/approved-photo.jpeg"
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const require=createRequire('C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp'),input=process.argv[2];
if(!input)throw new Error('Provide an approved photo path.');
const source=await readFile(resolve(input)),dir=resolve(import.meta.dirname,'../theme/rp-usados/assets/institutional');
await mkdir(dir,{recursive:true});
for(const width of [480,720,960]){
 const {data,info}=await sharp(source).rotate().resize({width,withoutEnlargement:true}).webp({quality:86,effort:5}).toBuffer({resolveWithObject:true});
 await writeFile(resolve(dir,`local-institucional-${width}.webp`),data);
 console.log(JSON.stringify({file:`local-institucional-${width}.webp`,width:info.width,height:info.height,bytes:data.length}));
 if(width!==720){
  const jpeg=await sharp(source).rotate().resize({width,withoutEnlargement:true}).jpeg({quality:89,mozjpeg:true}).toBuffer();
  await writeFile(resolve(dir,`local-institucional-${width}.jpg`),jpeg);
 }
}
