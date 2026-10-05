// Offline asset generation only; no browser/runtime dependency or new package.
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const require=createRequire(process.env.RP_IMAGE_RUNTIME || 'C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
const directory=resolve(import.meta.dirname,'../theme/rp-usados/src/assets/cursors');
const size=32;

function cursorDib(rgba,hotspot){
  const maskStride=Math.ceil(size/32)*4;
  const dib=Buffer.alloc(40+size*size*4+maskStride*size);
  dib.writeUInt32LE(40,0);dib.writeInt32LE(size,4);dib.writeInt32LE(size*2,8);
  dib.writeUInt16LE(1,12);dib.writeUInt16LE(32,14);dib.writeUInt32LE(size*size*4,20);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const source=(y*size+x)*4,destination=40+((size-1-y)*size+x)*4;
    dib[destination]=rgba[source+2];dib[destination+1]=rgba[source+1];dib[destination+2]=rgba[source];dib[destination+3]=rgba[source+3];
    if(rgba[source+3]===0)dib[40+size*size*4+(size-1-y)*maskStride+(x>>3)]|=0x80>>(x%8);
  }
  const header=Buffer.alloc(22);
  header.writeUInt16LE(2,2);header.writeUInt16LE(1,4);header[6]=size;header[7]=size;
  header.writeUInt16LE(hotspot[0],10);header.writeUInt16LE(hotspot[1],12);
  header.writeUInt32LE(dib.length,14);header.writeUInt32LE(22,18);
  return Buffer.concat([header,dib]);
}
for(const [name,hotspot] of [['default',[1,1]],['pointer',[6,2]]]){
  const svg=await readFile(resolve(directory,name+'.svg'));
  const png=await sharp(svg,{density:288}).resize(size,size).png().toBuffer();
  const rgba=await sharp(png).ensureAlpha().raw().toBuffer();
  await writeFile(resolve(directory,name+'.png'),png);
  const cur=cursorDib(rgba,hotspot);await writeFile(resolve(directory,name+'.cur'),cur);
  console.log(JSON.stringify({name,size:[size,size],hotspot,pngBytes:png.length,curBytes:cur.length}));
}
