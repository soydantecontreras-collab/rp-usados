"""Two seek candidates and a reduced probe. Assets are from the same render/color pipeline."""
import json,subprocess,time,hashlib,struct
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'explorations/hero-v2/public/hero-v2/media'
OUT.mkdir(parents=True,exist_ok=True)
FF=next((ROOT/'tools/.preview/ffmpeg/unpacked/imageio_ffmpeg/binaries').glob('ffmpeg*.exe'))
assert len(list((HERE/'frames').glob('*.png')))==144,'Render must be complete'
report=[]
for name,gop,crf,width in [('fast',4,18,1600),('compact',48,20,1600),('mobile',4,20,960)]:
    video=OUT/f'hero-{name}.mp4'
    cmd=[str(FF),'-y','-hide_banner','-loglevel','warning','-framerate','48','-i',str(HERE/'frames/%04d.png'),
         '-vf',f'scale={width}:-2:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p',
         '-c:v','libx264','-preset','slow','-crf',str(crf),'-g',str(gop),'-keyint_min',str(gop),
         '-sc_threshold','0','-bf','0' if name!='compact' else '2','-an','-movflags','+faststart',
         '-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','bt709','-color_range','tv',str(video)]
    before=time.time();subprocess.run(cmd,check=True)
    # Lossless PNG decoded from the delivered bitstream, not a differently exposed Blender still.
    subprocess.run([str(FF),'-y','-hide_banner','-loglevel','warning','-i',str(video),'-frames:v','1',
                    '-vf','scale=in_color_matrix=bt709:in_range=tv:out_range=pc,format=rgb24',str(OUT/f'poster-{name}.png')],check=True)
    # Compare decoded result with RGB source; reported metric complements frame inspection.
    result=subprocess.run([str(FF),'-hide_banner','-i',str(video),'-framerate','48','-i',str(HERE/'frames/%04d.png'),
                           '-lavfi',f'[0:v]format=yuv420p[a];[1:v]scale={width}:-2:out_color_matrix=bt709:out_range=tv,format=yuv420p[b];[a][b]ssim',
                           '-f','null','-'],capture_output=True,text=True,check=True)
    ssim=[line for line in result.stderr.splitlines() if 'SSIM' in line][-1]
    data=video.read_bytes(); atoms=[];offset=0
    while offset+8<=len(data):
        size,kind=struct.unpack_from('>I4s',data,offset)
        if size==1: size=struct.unpack_from('>Q',data,offset+8)[0]
        if size==0: size=len(data)-offset
        atoms.append({'type':kind.decode('ascii'),'offset':offset,'size':size});offset+=size
    assert next(a['offset'] for a in atoms if a['type']=='moov') < next(a['offset'] for a in atoms if a['type']=='mdat')
    report.append({'name':name,'width':width,'height':width*9//16,'fps':48,'frames':144,'duration':3,'gop':gop,'crf':crf,
                   'bytes':video.stat().st_size,'posterBytes':(OUT/f'poster-{name}.png').stat().st_size,
                   'encodeSeconds':time.time()-before,'ssim':ssim,'atoms':atoms,'command':cmd,'sha256':hashlib.sha256(data).hexdigest()})
(HERE/'encoding-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
