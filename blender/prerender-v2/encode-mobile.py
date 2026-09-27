"""Transcode the approved mobile MP4 without rendering or altering its imagery/timing."""
from pathlib import Path
import subprocess,json,hashlib

HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1]
SOURCE=HERE/'mobile-source/RP_hero_mobile_0001-0144.mp4'
OUT=ROOT/'explorations/hero-v2/public/hero-v2/media'
FF=next((ROOT/'tools/.preview/ffmpeg/unpacked/imageio_ffmpeg/binaries').glob('ffmpeg*.exe'))
report={'source':str(SOURCE),'sourceBytes':SOURCE.stat().st_size,'sourceSHA256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'candidates':[]}
for crf in [18,20]:
    name=f'hero-mobile-portrait-crf{crf}'; target=OUT/f'{name}.mp4'
    cmd=[str(FF),'-y','-hide_banner','-loglevel','error','-i',str(SOURCE),'-map','0:v:0',
         '-c:v','libx264','-profile:v','high','-pix_fmt','yuv420p','-preset','slow','-crf',str(crf),
         '-g','4','-keyint_min','4','-sc_threshold','0','-bf','0','-an','-movflags','+faststart',
         '-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-color_range','tv',str(target)]
    subprocess.run(cmd,check=True)
    # Decode BT.709 YUV into full-range RGB, then explicitly tag the PNG as sRGB.
    # Carrying video transfer metadata into PNG produced an unwanted gamma change
    # in browser image decoding. No exposure/gamma filter is applied to the pixels.
    subprocess.run([str(FF),'-y','-hide_banner','-loglevel','error','-i',str(target),'-frames:v','1',
        '-vf','scale=in_color_matrix=bt709:in_range=tv:out_range=pc,format=rgb24,setparams=color_trc=iec61966-2-1:color_primaries=bt709:colorspace=gbr:range=full',
        '-update','1',str(OUT/f'{name}-poster.png')],check=True)
    quality=subprocess.run([str(FF),'-hide_banner','-i',str(target),'-i',str(SOURCE),'-lavfi','[0:v][1:v]ssim','-f','null','-'],capture_output=True,text=True,check=True)
    ssim=next(x for x in quality.stderr.splitlines() if 'SSIM Y:' in x)
    report['candidates'].append({'name':name,'bytes':target.stat().st_size,'averageMbps':target.stat().st_size*8/3/1e6,
        'crf':crf,'gop':4,'bframes':0,'ssim':ssim,'command':cmd,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
(HERE/'mobile-encoding-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
