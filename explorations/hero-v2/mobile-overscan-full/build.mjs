import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../../..'),theme=resolve(root,'theme/rp-usados');
const output=resolve(root,'tools/.preview/mobile-overscan-full/bundle');
const {build}=await import(pathToFileURL(resolve(theme,'node_modules/vite/dist/node/index.js')));
const transform={name:'independent-native-scroll-overscan',enforce:'pre',transform(code,id){
 if(!id.replaceAll('\\','/').endsWith('/src/scripts/hero-v2/main.js'))return;
 const old=code;
 // No orientation scroll compensation. Native anchor handles Ver vehiculos.
 code=code.replace(/    if \(preserve && eligible\(\)\) \{[\s\S]*?\n    \}/,'');
 code=code.replace(/document\.querySelectorAll\('a\[href="#catalogo"\]'\)\.forEach\([\s\S]*?\n\}\)\);/,'');
 assert.notEqual(code,old);assert(!code.includes('scrollTo('));
 return {code,map:null};
}};
await build({root:theme,configFile:resolve(theme,'vite.config.js'),plugins:[transform],build:{outDir:output,emptyOutDir:true}});
const manifest=JSON.parse(await readFile(resolve(output,'.vite/manifest.json'),'utf8'));
const entry=manifest['src/scripts/main.js'];assert(entry?.file&&entry.css?.length);
await mkdir(resolve(root,'tools/.preview/mobile-overscan-full'),{recursive:true});
await writeFile(resolve(root,'tools/.preview/mobile-overscan-full/entry.json'),JSON.stringify(entry,null,2));
console.log(JSON.stringify({output,entry}));
