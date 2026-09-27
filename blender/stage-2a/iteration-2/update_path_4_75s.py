"""Stage 2A camera revision. Run once through Blender MCP on v001, save as v002.

Only a new provisional camera scene is added. Building, doorway and old path
remain available for comparison. All dimensions remain modeling hypotheses.
"""
import bpy
import json
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(r'C:/Users/dante.DESKTOP/Desktop/rp-usados-gpt/rp-usados/blender/stage-2a')
OUT = ROOT / 'iteration-2'
OUT.mkdir(parents=True, exist_ok=True)
DEST = ROOT / 'RP_Usados_Blockout_2A_v002_ritmo.blend'
assert not DEST.exists(), 'v002 already exists; refusing to overwrite it.'
assert bpy.data.filepath.endswith('RP_Usados_Blockout_2A_v001.blend')
assert 'RP_2A_PATH_A_4_75S_PROVISIONAL' not in bpy.data.scenes

prior = bpy.data.scenes['RP_2A_PATH_OPEN_PROVISIONAL']
base_camera = bpy.data.objects['2A_CAM_A_BALANCED']
start = base_camera.location.copy()
scene = prior.copy()
scene.name = 'RP_2A_PATH_A_4_75S_PROVISIONAL'
scene.frame_start = 1
scene.frame_end = 115
scene.render.fps = 24
scene.render.resolution_x = 1440
scene.render.resolution_y = 844
scene.render.resolution_percentage = 100
scene.render.image_settings.media_type = 'IMAGE'
scene.render.image_settings.file_format = 'PNG'
scene['revision'] = 'Stage 2A — camera A, 4.75 s rehearsal, 20 cm past threshold.'
scene['door'] = 'FREE FOR CAMERA TEST ONLY; opening mechanism unknown.'
scene['future_ui'] = 'Cue at frame 105, about 10–15 cm outside; no UI implemented.'
for marker in list(scene.timeline_markers):
    scene.timeline_markers.remove(marker)

camera_collection = bpy.data.collections.new('2A_10_CAM_PATH_A_4_75S_ONLY')
scene.collection.children.link(camera_collection)
cam = base_camera.copy()
cam.data = base_camera.data.copy()
cam.name = '2A_CAM_A_4_75S_SHORT_ENTRY'
cam.data.name = '2A_LENS_A_34MM_SHORT_ENTRY'
cam.animation_data_clear()
camera_collection.objects.link(cam)
cam.data.lens = base_camera.data.lens  # 34 mm: approved A composition retained.
cam['motion_note'] = 'Short commercial rehearsal; camera height and focal length fixed.'
cam['transition_note'] = 'Frame 105 is a FUTURE UI cue only. No fade or interface animated.'
scene.camera = cam

origin = Vector((1.25, 1.25, 0))  # provisional center of chamfer entrance
normal = Vector((2**-.5, 2**-.5, 0))
tangent = Vector((2**-.5, -2**-.5, 0))
initial_d = (start - origin).dot(normal)
initial_side = (start - origin).dot(tangent)
duration = 4.75
# Distances in meters to the access plane; negative means outside.
# Values and slopes are exploratory; no physical acceleration claim.
knots = [
    (0.00, initial_d, 1.8),
    (0.35, -17.55, 3.9),
    (1.20, -13.55, 5.4),
    (2.40, -7.00, 5.4),
    (3.40, -2.35, 3.65),
    (4.05, -0.48, 2.10),
    (4.40, -0.08, 0.65),
    (4.75, 0.20, 0.0),
]

def distance(t):
    for (a, p, v), (b, q, w) in zip(knots, knots[1:]):
        if a <= t <= b + 1e-9:
            u = (t-a)/(b-a)
            span = b-a
            return ((2*u**3-3*u**2+1)*p + (u**3-2*u**2+u)*span*v
                    + (-2*u**3+3*u**2)*q + (u**3-u**2)*span*w)
    return knots[-1][1]

samples = []
for frame in range(1, 116):
    t = (frame-1)/24
    align = min(1, t/2.8)
    align = align*align*(3-2*align)
    position = origin + normal*distance(t) + tangent*initial_side*(1-align)
    position.z = start.z
    target = Vector((3.25,3.35,2.48)).lerp(
        origin + normal*4.5 + Vector((0,0,1.86)), align)
    cam.location = position
    cam.rotation_euler = (target-position).to_track_quat('-Z','Y').to_euler()
    cam.keyframe_insert(data_path='location', frame=frame)
    cam.keyframe_insert(data_path='rotation_euler', frame=frame)
    samples.append({'frame':frame,'seconds':round(t,4),
                    'distance_to_threshold_m':round(distance(t),4),
                    'position':[round(v,5) for v in position]})

for layer in cam.animation_data.action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for curve in bag.fcurves:
                for key in curve.keyframe_points:
                    key.interpolation = 'LINEAR'

for frame,label in [
    (1,'01 EXTERIOR A'),(10,'02 MOVE STARTS'),(59,'03 APPROACH'),
    (82,'04 DOOR CUE ONLY'),(101,'05 DECELERATION'),
    (105,'06 FUTURE UI CUE ONLY'),(110,'07 THRESHOLD'),
    (115,'08 END 20 CM INSIDE')]:
    scene.timeline_markers.new(label,frame=frame)

bpy.context.window.scene = scene
scene.frame_set(1)
actual=[]
hits=[]
roll=0.0
previous=None
for frame in range(1,116):
    scene.frame_set(frame)
    dg=bpy.context.evaluated_depsgraph_get()
    p=cam.evaluated_get(dg).matrix_world.translation.copy()
    right=cam.matrix_world.to_quaternion() @ Vector((1,0,0))
    roll=max(roll,abs(right.z))
    if previous is not None:
        delta=p-previous
        if delta.length > 1e-8:
            hit,point,normal_hit,index,obj,matrix=scene.ray_cast(
                dg,previous,delta.normalized(),distance=delta.length)
            if hit: hits.append({'frame':frame,'object':obj.name})
    previous=p
    actual.append(p)

speeds=[(b-a).length*24 for a,b in zip(actual,actual[1:])]
crossing=next(x for x in samples if x['distance_to_threshold_m']>=0)
cue=samples[104]  # frame 105
assert not hits,hits
assert roll < 1e-4,roll
assert abs(samples[-1]['distance_to_threshold_m']-.2)<1e-5
assert abs(samples[0]['distance_to_threshold_m']-initial_d)<1e-3
assert prior.frame_end==289 and prior.camera.name=='2A_CAM_PATH_A_12S_REHEARSAL'
assert scene.camera.name not in prior.objects
report={
    'revision':'2A iteration 2',
    'scene':scene.name,
    'camera':cam.name,
    'initial_camera':'A, same location, direction and 34 mm focal length as v001',
    'time_seconds':duration,'fps':24,'frames':115,
    'video_container_duration_seconds':115/24,
    'initial_distance_m':initial_d,
    'final_distance_m':.2,
    'future_ui_cue_frame':105,
    'future_ui_cue_seconds':cue['seconds'],
    'future_ui_cue_distance_m':cue['distance_to_threshold_m'],
    'crossing_frame':crossing['frame'],
    'crossing_seconds':crossing['seconds'],
    'max_speed_m_s':max(speeds),
    'max_roll_component':roll,
    'centerline_collisions':hits,
    'door_animation':False,
    'interior_detail_changed':False,
    'geometry_changed':False,
    'prior_scene_preserved':prior.name,
    'source_file_preserved':'RP_Usados_Blockout_2A_v001.blend',
    'samples':samples,
}
(OUT/'path_4_75s.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(DEST))
print(json.dumps({k:v for k,v in report.items() if k!='samples'},indent=2))
