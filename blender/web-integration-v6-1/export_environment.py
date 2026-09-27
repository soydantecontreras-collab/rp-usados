"""Linear world capture, avoiding display-referred HDR output from Blender."""
import bpy, math, numpy as np
from pathlib import Path
OUT = Path(__file__).resolve().parents[2] / 'theme/rp-usados/assets/hero/v6-1'
WORK = Path(__file__).resolve().parent
s = bpy.context.scene
for o in s.objects:
    o.hide_render = True
c = bpy.data.cameras.new('World_capture')
c.type = 'PANO'
c.panorama_type = 'EQUIRECTANGULAR'
o = bpy.data.objects.new('World_capture', c)
s.collection.objects.link(o)
o.rotation_euler = (math.pi / 2, 0, 0)
s.camera = o
s.cycles.samples = 4
s.render.resolution_x, s.render.resolution_y, s.render.resolution_percentage = 1024, 512, 100
s.render.image_settings.media_type = 'IMAGE'
s.render.image_settings.file_format = 'OPEN_EXR'
s.render.image_settings.color_depth = '32'
s.render.filepath = str(WORK / 'world-linear.exr')
bpy.ops.render.render(write_still=True)
image = bpy.data.images.load(s.render.filepath, check_existing=False)
pixels = np.empty(1024*512*4, dtype=np.float32)
image.pixels.foreach_get(pixels)
rgb = np.maximum(0, pixels.reshape(512,1024,4)[::-1,:,:3])
mantissa, exponent = np.frexp(rgb.max(axis=2))
scale = np.where(rgb.max(axis=2) > 1e-32, mantissa * 256 / np.maximum(rgb.max(axis=2),1e-32), 0)
rgbe = np.zeros((512,1024,4),dtype=np.uint8)
rgbe[:,:,:3] = np.minimum(rgb * scale[:,:,None],255).astype(np.uint8)
rgbe[:,:,3] = np.where(scale > 0, exponent + 128, 0).astype(np.uint8)
with (OUT/'environment.hdr').open('wb') as output:
    output.write(b'#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y 512 +X 1024\n')
    output.write(rgbe.tobytes())
print('LINEAR ENVIRONMENT', rgb.min(), rgb.max(), rgb.mean())
