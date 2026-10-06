import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../../..'),theme=resolve(root,'theme/rp-usados');
const output=resolve(root,'tools/.preview/mobile-dark-bridge/bundle');
const effect=resolve(import.meta.dirname,'effect.js').replaceAll('\\','/');
const {build}=await import(pathToFileURL(resolve(theme,'node_modules/vite/dist/node/index.js')));
const transform={name:'independent-mobile-dark-bridge',enforce:'pre',transform(code,id){
  const normalized=id.replaceAll('\\','/');
  if(normalized.endsWith('/src/scripts/hero-v2/main.js')){
    assert(code.includes('function progress(value)'));assert(code.includes('disposed = true; media?.dispose();'));
    code=`import {darkBridge} from '${effect}';\n`+code;
    code=code.replace('cue.style.opacity = String(Math.max(0, 1 - value * 6));','cue.style.opacity = String(Math.max(0, 1 - value * 6));\n  darkBridge.setProgress(value,device);');
    code=code.replace('if (disposed) return;\n  trigger?.kill();','if (disposed) return;\n  darkBridge.reset();\n  trigger?.kill();');
    code=code.replace('disposed = true; media?.dispose();','disposed = true; darkBridge.dispose(); media?.dispose();');
    return {code,map:null};
  }
  if(normalized.endsWith('/src/scripts/hero-v2/seek-controller.js')){
    assert(code.includes('diagnostics.presentedTime = time;'));
    return {code:`import {darkBridge} from '${effect}';\n`+code.replace('diagnostics.presentedTime = time;','diagnostics.presentedTime = time;\n    darkBridge.presentedFrame(time);'),map:null};
  }
}};
await build({root:theme,configFile:resolve(theme,'vite.config.js'),plugins:[transform],build:{outDir:output,emptyOutDir:true}});
const manifest=JSON.parse(await readFile(resolve(output,'.vite/manifest.json'),'utf8'));
const entry=manifest['src/scripts/main.js'];assert(entry?.file&&entry.css?.length);
await mkdir(resolve(root,'tools/.preview/mobile-dark-bridge'),{recursive:true});
await writeFile(resolve(root,'tools/.preview/mobile-dark-bridge/entry.json'),JSON.stringify(entry,null,2));
console.log(JSON.stringify({output,entry}));
