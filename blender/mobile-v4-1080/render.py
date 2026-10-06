"""Render the supplied v4 unchanged, with output-only settings in memory."""
import bpy
import hashlib
import json
from pathlib import Path
import time

root = Path(__file__).resolve().parents[2]
output = root / 'tools/.preview/mobile-v4-integration'
frames = output / 'master-frames'
frames.mkdir(parents=True, exist_ok=True)
source = Path(bpy.data.filepath)
source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
scene = bpy.context.scene
assert scene.render.engine == 'CYCLES'
assert (scene.frame_start, scene.frame_end) == (1, 144)
assert scene.render.fps / scene.render.fps_base == 48
assert all(image.packed_file or Path(bpy.path.abspath(image.filepath)).exists()
           for image in bpy.data.images if image.source == 'FILE')
settings = dict(engine=scene.render.engine, samples=scene.cycles.samples,
                adaptive_threshold=scene.cycles.adaptive_threshold,
                denoising=scene.cycles.use_denoising,
                transform=scene.view_settings.view_transform,
                look=scene.view_settings.look, exposure=scene.view_settings.exposure,
                gamma=scene.view_settings.gamma, camera=scene.camera.name)

# Compute device changes neither geometry nor the artist's render settings.
preferences = bpy.context.preferences.addons['cycles'].preferences
preferences.refresh_devices()
gpu = next(device for device in preferences.devices
           if device.type == 'OPTIX')
preferences.compute_device_type = gpu.type
preferences.refresh_devices()
for device in preferences.devices:
    device.use = device.type == gpu.type
assert 'GPU' in [item.identifier for item in
                 scene.cycles.bl_rna.properties['device'].enum_items]
scene.cycles.device = 'GPU'
assert 'PNG' in [item.identifier for item in
                 scene.render.image_settings.bl_rna.properties['file_format'].enum_items]
scene.render.resolution_x = 1080
scene.render.resolution_y = 1920
scene.render.resolution_percentage = 100
assert 'IMAGE' in [item.identifier for item in
                   scene.render.image_settings.bl_rna.properties['media_type'].enum_items]
scene.render.image_settings.media_type = 'IMAGE'
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'
scene.render.image_settings.color_depth = '8'
scene.render.image_settings.compression = 15
started = time.time()
manifest = dict(source=str(source), source_sha256=source_hash, visual_settings=settings,
                width=1080, height=1920, fps=48, frames=144, seconds=3,
                compute=gpu.name, completed=0, original_saved=False)

for frame in range(1, 145):
    scene.frame_set(frame)
    scene.render.filepath = str(frames / f'{frame:04d}.png')
    bpy.ops.render.render(write_still=True)
    manifest['completed'] = frame
    manifest['elapsed_seconds'] = time.time() - started
    (output / 'render-report.json').write_text(json.dumps(manifest, indent=2))
    print(f'RP_RENDER_PROGRESS {frame}/144 {manifest["elapsed_seconds"]:.1f}s', flush=True)

assert hashlib.sha256(source.read_bytes()).hexdigest() == source_hash
manifest['source_unchanged'] = True
(output / 'render-report.json').write_text(json.dumps(manifest, indent=2))
print('RP_RENDER_COMPLETE', flush=True)
