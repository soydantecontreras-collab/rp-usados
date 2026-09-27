"""V2 A encoding unchanged; composite the doorway darkness and short terminal fade offline."""
from pathlib import Path
import subprocess,json,hashlib

HERE=Path(__file__).resolve().parent; ROOT=HERE.parents[1]
FF=next((ROOT/'tools/.preview/ffmpeg/unpacked/imageio_ffmpeg/binaries').glob('ffmpeg*.exe'))
OUT=ROOT/'explorations/hero-v2/public/hero-v2/media'
assert len(list((HERE/'transition-mattes').glob('*.png')))==144
assert len(list((HERE/'door-mattes').glob('*.png')))==144
video=OUT/'hero-fast-dark-doors.mp4'
cmd=[str(FF),'-y','-hide_banner','-loglevel','warning',
     '-framerate','48','-i',str(HERE/'frames/%04d.png'),
     '-framerate','48','-i',str(HERE/'transition-mattes/%04d.png'),
     '-framerate','48','-i',str(HERE/'door-mattes/%04d.png'),
     '-f','lavfi','-i','color=c=0x080809:s=1600x900:r=48:d=3',
     '-filter_complex','[0:v]format=gbrp[scene];[1:v]format=gbrp[aperture];[2:v]format=gbrp[doors];'
       '[aperture][doors]blend=all_expr=\'max(0,A-B)\',gblur=sigma=0.5[matte];[3:v]format=gbrp[dark];'
       '[scene][dark][matte]maskedmerge,fade=t=out:st=2.55:d=0.35:color=0x080809,'
       'scale=1600:900:out_color_matrix=bt709:out_range=tv,format=yuv420p[out]',
     '-map','[out]','-frames:v','144','-c:v','libx264','-preset','slow','-crf','18',
     '-g','4','-keyint_min','4','-sc_threshold','0','-bf','0','-an','-movflags','+faststart',
     '-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','bt709','-color_range','tv',str(video)]
subprocess.run(cmd,check=True)
subprocess.run([str(FF),'-y','-hide_banner','-loglevel','error','-i',str(video),'-frames:v','1',
                '-vf','scale=in_color_matrix=bt709:in_range=tv:out_range=pc,format=rgb24',str(OUT/'poster-fast-dark-doors.png')],check=True)
report={'base':'V2 A; original 144 Cycles frames; camera and door timing unchanged',
        'treatment':'Aperture minus independent opaque door/jamb matte; original door lighting preserved; final fade 2.55–2.90 seconds unchanged',
        'duration':3,'fps':48,'frames':144,'gop':4,'crf':18,'bytes':video.stat().st_size,
        'sha256':hashlib.sha256(video.read_bytes()).hexdigest(),'command':cmd}
(HERE/'transition-encoding-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
