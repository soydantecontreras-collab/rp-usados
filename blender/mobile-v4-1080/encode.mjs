// Web encoding only: preserve every native v4 frame, no crop/grade/mask.
import {readFile, writeFile, stat} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const root=resolve(import.meta.dirname,'../..');
const work=join(root,'tools/.preview/mobile-v4-integration');
const report=JSON.parse(await readFile(join(work,'render-report.json')));
assert.equal(report.completed,144);assert.equal(report.source_unchanged,true);
const frames=join(work,'master-frames');
for(let n=1;n<=144;n++){
  const frame=await readFile(join(frames,String(n).padStart(4,'0')+'.png'));
  assert.equal(frame.readUInt32BE(16),1080);assert.equal(frame.readUInt32BE(20),1920);
}
const ffmpeg=join(root,'tools/.preview/ffmpeg/unpacked/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const video=join(root,'theme/rp-usados/assets/hero/v2/hero-mobile-v4-1080-crf18.mp4');
const poster=video.replace('.mp4','-poster.png');
const args=['-hide_banner','-y','-framerate','48','-start_number','1','-i',join(frames,'%04d.png'),
 '-frames:v','144','-an','-c:v','libx264','-preset','slow','-crf','18','-profile:v','high',
 '-level:v','4.2','-refs','3','-pix_fmt','yuv420p','-vf','scale=out_color_matrix=bt709:out_range=tv',
 '-colorspace','bt709','-color_primaries','bt709',
 '-g','4','-keyint_min','4','-sc_threshold','0','-bf','0','-movflags','+faststart',video];
execFileSync(ffmpeg,args,{stdio:'inherit'});
execFileSync(ffmpeg,['-hide_banner','-y','-i',video,'-frames:v','1','-update','1',poster],{stdio:'inherit'});
const bytes=await readFile(video),atoms=[];
for(let offset=0;offset<bytes.length;){
 const size=bytes.readUInt32BE(offset),type=bytes.toString('ascii',offset+4,offset+8);
 assert(size>=8);atoms.push(type);offset+=size;
}
assert(atoms.indexOf('moov')<atoms.indexOf('mdat'),'MP4 must support fast start');
const result={...report,bytes:bytes.length,bitrateContainer:bytes.length*8/3,
 codec:'H.264 High',level:'4.2',references:3,pixelFormat:'yuv420p',crf:18,preset:'slow',gop:4,bframes:0,
 audio:false,faststart:true,webSha256:createHash('sha256').update(bytes).digest('hex'),
 posterSha256:createHash('sha256').update(await readFile(poster)).digest('hex'),
 posterBytes:(await stat(poster)).size,
 sourceKind:'native PNG render from v4 scene at 1080×1920; not an upscale',
 colorConversion:'RGB PNG to limited-range BT.709 YUV for H.264; no visual grade',
 imageEffects:[],webFile:video,posterFile:poster};
await writeFile(join(work,'media-report.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({bytes:result.bytes,bitrateMbps:result.bitrateContainer/1e6,frames:144,width:1080,height:1920,fps:48,seconds:3}));
