"""Regression: actual encoded pixels must preserve doors while the aperture stays black."""
from pathlib import Path
import subprocess,json
import numpy as np
from PIL import Image

HERE=Path(__file__).resolve().parent; ROOT=HERE.parents[1]
FF=next((ROOT/'tools/.preview/ffmpeg/unpacked/imageio_ffmpeg/binaries').glob('ffmpeg*.exe'))
MEDIA=ROOT/'explorations/hero-v2/public/hero-v2/media'
def decoded(name):
    result=subprocess.run([str(FF),'-v','error','-i',str(MEDIA/name),'-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True,check=True)
    return np.frombuffer(result.stdout,dtype=np.uint8).reshape(-1,900,1600,3)
old=decoded('hero-fast-dark.mp4');new=decoded('hero-fast-dark-doors.mp4')
assert len(old)==len(new)==144
report=[]
for i in [35,50,65,80,100,115]:
    aperture=np.asarray(Image.open(HERE/f'transition-mattes/{i:04d}.png'))[:,:,0]
    doors=np.asarray(Image.open(HERE/f'door-mattes/{i:04d}.png'))[:,:,0]
    # Interior samples exclude anti-aliased geometry edges.
    inside=(aperture>253)&(doors<2)
    keep=(aperture>253)&(doors>253)
    for axis in [0,1]:
        inside=inside&np.roll(inside,3,axis)&np.roll(inside,-3,axis)
        keep=keep&np.roll(keep,2,axis)&np.roll(keep,-2,axis)
    old_door=float(old[i][keep].mean());new_door=float(new[i][keep].mean())
    room=float(new[i][inside].mean())
    assert keep.sum()>100,f'No measurable door region at frame {i}'
    assert new_door>old_door+15,f'Door not separated at frame {i}'
    assert room<12,f'Interior brightened at frame {i}'
    report.append({'frame':i,'doorPixels':int(keep.sum()),'oldDoorMeanRGB':old_door,'newDoorMeanRGB':new_door,'interiorMeanRGB':room})
assert new[-1].max()<15,'Final fade no longer black'
(HERE/'door-visibility-check.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
