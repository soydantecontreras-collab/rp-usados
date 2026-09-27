"""Approved source -> offline render intermediates. Never save the source blend."""
import bpy, hashlib, json, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'blender/prerender-v2/frames'
OUT.mkdir(parents=True, exist_ok=True)
s = bpy.context.scene
source = Path(bpy.data.filepath)
assert source.name == 'RP_Usados_Hero_v6_1.blend'
assert s.camera.name == 'CAM_A_Ochava' and s.render.engine == 'CYCLES'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'OPTIX'
prefs.get_devices()
for device in prefs.devices:
    device.use = device.type == 'OPTIX'
assert any(d.use for d in prefs.devices), 'No OPTIX GPU available'
s.cycles.device = 'GPU'
s.cycles.samples = 64
s.cycles.use_denoising = True
s.render.resolution_x, s.render.resolution_y = 1600, 900
s.render.resolution_percentage = 100
assert 'IMAGE' in [i.identifier for i in s.render.image_settings.bl_rna.properties['media_type'].enum_items]
s.render.image_settings.media_type = 'IMAGE'
assert 'PNG' in [i.identifier for i in s.render.image_settings.bl_rna.properties['file_format'].enum_items]
s.render.image_settings.file_format = 'PNG'
s.render.image_settings.color_mode = 'RGB'
s.render.image_settings.color_depth = '8'
s.render.image_settings.compression = 15
s.render.use_persistent_data = True
report = {'source': str(source), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
          'camera': s.camera.name, 'size': [1600,900], 'samples':64, 'outputFPS':48,
          'outputFrames':144, 'duration':3, 'sourceRange':[1,72],
          'view':s.view_settings.view_transform,'look':s.view_settings.look,'exposure':s.view_settings.exposure,
          'frameSeconds':[]}
started=time.time()
for i in range(144):
    path=OUT / f'{i:04d}.png'
    if path.exists(): continue
    frame=1+i*71/143
    s.frame_set(int(frame), subframe=frame-int(frame))
    s.render.filepath=str(path)
    before=time.time()
    bpy.ops.render.render(write_still=True)
    report['frameSeconds'].append(time.time()-before)
    (OUT.parent/'status.json').write_text(json.dumps({'done':i+1,'total':144,'elapsed':time.time()-started}),encoding='utf-8')
report['elapsed']=time.time()-started
(OUT.parent/'render-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('V2_RENDER_COMPLETE',flush=True)
