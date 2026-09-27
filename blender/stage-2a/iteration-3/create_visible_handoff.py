"""Stage 2A third timing review: end visible 3D at the portal framing.

The complete 4.75-second camera path remains in a separate scene, untouched.
No UI, door mechanism, model or material is created.
"""
import bpy
import json
from pathlib import Path

ROOT=Path(r'C:/Users/dante.DESKTOP/Desktop/rp-usados-gpt/rp-usados/blender/stage-2a')
DEST=ROOT/'RP_Usados_Blockout_2A_v003_handoff.blend'
OUT=ROOT/'iteration-3'
OUT.mkdir(parents=True,exist_ok=True)
assert bpy.data.filepath.endswith('RP_Usados_Blockout_2A_v002_ritmo.blend')
assert not DEST.exists(), 'Refusing to overwrite existing v003.'
assert 'RP_2A_VISIBLE_UNTIL_PORTAL_F85' not in bpy.data.scenes

full=bpy.data.scenes['RP_2A_PATH_A_4_75S_PROVISIONAL']
visible=full.copy()
visible.name='RP_2A_VISIBLE_UNTIL_PORTAL_F85'
visible.frame_start=1
visible.frame_end=85
visible.camera=full.camera
visible['stage']='2A — visible camera segment only; future web handoff at frame 85.'
visible['important']='At handoff, camera is about 2m OUTSIDE. The complete path crosses later in the preserved full scene.'
visible['future_ui']='A future interface can begin taking over the doorway view here. No UI or transition implemented.'
for marker in list(visible.timeline_markers):
    if marker.frame>85:
        visible.timeline_markers.remove(marker)
visible.timeline_markers.new('05 VISIBLE 3D ENDS / FUTURE UI HANDOFF',frame=85)

prior=json.loads((ROOT/'iteration-2'/'path_4_75s.json').read_text(encoding='utf-8'))
handoff=prior['samples'][84]
assert handoff['frame']==85
assert abs(handoff['distance_to_threshold_m']+2)<.01
assert full.frame_end==115
assert prior['final_distance_m']==.2
assert full.camera==visible.camera
assert '2A_DOOR_CLOSED_PROXY_UNKNOWN_MECHANISM' not in visible.objects

report={
    'stage':'2A, iteration 3',
    'visible_scene':visible.name,
    'visible_frames':85,
    'visible_video_duration_seconds':85/24,
    'last_visible_frame_time_seconds':handoff['seconds'],
    'visible_camera_distance_to_threshold_m':handoff['distance_to_threshold_m'],
    'continued_offscreen_scene':full.name,
    'continued_offscreen_frames':115-85,
    'continued_offscreen_seconds':(115-85)/24,
    'physical_crossing_in_continuation_seconds':prior['crossing_seconds'],
    'physical_end_depth_inside_m':prior['final_distance_m'],
    'door_animated':False,
    'ui_animated':False,
    'model_changed':False,
    'v002_preserved':True,
}
(OUT/'handoff.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
bpy.context.window.scene=visible
visible.frame_set(1)
visible.render.image_settings.media_type='IMAGE'
visible.render.image_settings.file_format='PNG'
bpy.ops.wm.save_as_mainfile(filepath=str(DEST))
print(json.dumps(report,indent=2))
