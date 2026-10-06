import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const repo=resolve(import.meta.dirname,'../../..');
const out=resolve(repo,'tools/.preview/hero-three-layer');
const require=createRequire('C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
const geometry=JSON.parse(await readFile(resolve(out,'geometry.json')));
const scroll=JSON.parse(await readFile(resolve(out,'scroll.json')));
const extra=JSON.parse(await readFile(resolve(out,'extra.json')));
const checks=[];
const check=(name,passed)=>{checks.push({name,passed});assert(passed,name);};
for(const width of [375,390,430])for(const variant of ['A','B']) {
  const baseline=geometry.find(m=>m.width===width&&m.variant===variant&&m.delta===0);
  for(const delta of [0,16,72]) {
    const m=geometry.find(m=>m.width===width&&m.variant===variant&&m.delta===delta);
    check(`${width}/${variant}/+${delta}: fixed image/text/CTA`,['image','cta','title','copy'].every(key=>Math.abs(m[key].top-baseline[key].top)<.02));
    check(`${width}/${variant}/+${delta}: wrapper fills viewport`,Math.abs(m.wrapper.bottom-m.height)<.02);
    check(`${width}/${variant}/+${delta}: expected coverage`,Math.abs(m.canvasGap-(variant==='A'?delta:0))<.02);
    check(`${width}/${variant}/+${delta}: no overflow/embedding`,m.noOverflow&&m.topLevel&&m.iframes===0);
    check(`${width}/${variant}/+${delta}: mobile video presented`,m.readyState>=2&&m.posterPresented&&m.src.endsWith('hero-mobile-portrait-crf18.mp4'));
  }
}
const mid=scroll.find(m=>m.step==='mid').metrics;
check('Native first 19px: video advances',scroll.find(m=>m.step==='small-scroll').metrics.time>0);
check('Native forward: camera advances',mid.time>1);
for(const step of ['mid+16','mid+72']){
  const m=scroll.find(m=>m.step===step).metrics;
  check(step+': same frame/no compensation',m.time===mid.time&&m.scrollY===mid.scrollY);
  check(step+': fixed image/CTA/no gap',m.image.top===mid.image.top&&m.cta.top===mid.cta.top&&m.imageGap===0);
}
for(const step of ['reverse','reload'])check(step+': first video frame presented',scroll.find(m=>m.step===step).metrics.time===0&&scroll.find(m=>m.step===step).metrics.posterPresented);
const reload=extra.find(m=>m.step==='mid-reload');
check('Mid reload restores native scroll and correct frame',reload.before.scrollY===reload.after.scrollY&&Math.abs(reload.before.time-reload.after.time)<.025&&reload.after.posterPresented);
check('Native route captures actual CSS units without simulation',extra.find(m=>m.step==='native').mode.mode==='native');
check('Landscape keeps approved contained portrait media',extra.find(m=>m.step==='landscape').metrics.fit==='contain');
check('Portrait returns without horizontal overflow',extra.find(m=>m.step==='portrait-return').metrics.fit==='cover'&&extra.find(m=>m.step==='portrait-return').metrics.noOverflow);
check('Skip reaches and focuses following content',extra.find(m=>m.step==='skip').catalog.focused);

const strips={};
for(const label of ['0','72']){
  const a=await readFile(resolve(out,`a-${label}.jpg`)),b=await readFile(resolve(out,`b-${label}.jpg`));
  const {width,height}=await sharp(a).metadata();
  const path=resolve(out,`compare-${label}.png`);
  await sharp({create:{width:width*2+16,height,channels:3,background:'#242426'}})
    .composite([{input:a,left:0,top:0},{input:b,left:width+16,top:0}]).png().toFile(path);
  for(const [variant,input] of [['A',a],['B',b]]){
    const data=await sharp(input).extract({left:20,top:height-20,width:width-40,height:20}).removeAlpha().raw().toBuffer();
    let black=0,total=0;
    for(let i=0;i<data.length;i+=3){if(Math.max(data[i],data[i+1],data[i+2])<=4)black++;total+=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];}
    strips[`${variant}/+${label}`]={nearBlackFraction:black/(data.length/3),meanLuma:total/(data.length/3)};
  }
}
const report={passed:checks.length,checks,bottomPixelStrips:strips,geometry,scroll,extra,limits:['Desktop Chromium emulation: not an actual Android Chrome toolbar.','760/832 are explicit measurement inputs, not native-page fixed sizes.','Dark media pixels, approved caption shading, and OS navigation are distinct from layout coverage.']};
await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({passed:checks.length,strips,report:resolve(out,'report.json')},null,2));
