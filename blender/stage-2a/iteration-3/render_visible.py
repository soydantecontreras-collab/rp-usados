"""Render only the 85 frames before the proposed future interface takeover."""
import bpy
import json
import traceback
from pathlib import Path

ROOT=Path(r'C:/Users/dante.DESKTOP/Desktop/rp-usados-gpt/rp-usados/blender/stage-2a')
OUT=ROOT/'iteration-3'/'review'
OUT.mkdir(parents=True,exist_ok=True)
status=OUT/'render-status.json'
assert bpy.data.filepath.endswith('RP_Usados_Blockout_2A_v003_handoff.blend')
scene=bpy.data.scenes['RP_2A_VISIBLE_UNTIL_PORTAL_F85']

def render_visible_movie():
    status.write_text(json.dumps({'status':'rendering','frames':85}),encoding='utf-8')
    try:
        bpy.context.window.scene=scene
        scene.frame_set(1)
        scene.render.resolution_x=960
        scene.render.resolution_y=562
        scene.render.resolution_percentage=100
        scene.render.fps=24
        scene.render.image_settings.media_type='VIDEO'
        scene.render.image_settings.file_format='FFMPEG'
        scene.render.ffmpeg.format='MPEG4'
        scene.render.ffmpeg.codec='H264'
        scene.render.ffmpeg.constant_rate_factor='HIGH'
        scene.render.filepath=str(OUT/'RP-2A-A-visible-3_5s-HANDOFF.mp4')
        bpy.ops.render.render(animation=True)
        status.write_text(json.dumps({'status':'complete','frames':85,'fps':24,
            'duration_seconds':85/24}),encoding='utf-8')
    except Exception:
        status.write_text(json.dumps({'status':'error','detail':traceback.format_exc()}),encoding='utf-8')
    finally:
        scene.render.resolution_x=1440
        scene.render.resolution_y=844
        scene.render.image_settings.media_type='IMAGE'
        scene.render.image_settings.file_format='PNG'
        scene.frame_set(1)
    return None

bpy.app.timers.register(render_visible_movie,first_interval=2.0)
print('Visible segment render queued: '+str(status))
