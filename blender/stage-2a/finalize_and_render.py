"""MCP finalization: inspection, separate .blend, review movie. No web changes."""
import bpy, json, math, traceback
from pathlib import Path
from mathutils import Vector

OUT=Path(r'C:/Users/dante.DESKTOP/Desktop/rp-usados-gpt/rp-usados/blender/stage-2a')
s=bpy.data.scenes['RP_2A_CLOSED']
p=bpy.data.scenes['RP_2A_PATH_OPEN_PROVISIONAL']
cam=bpy.data.objects['2A_CAM_PATH_A_12S_REHEARSAL']
p.camera=cam
for scene in [s,p]:
    scene.timeline_markers['04 BEFORE THRESHOLD'].frame=205
    scene.timeline_markers['05 CROSSING PROVISIONAL'].frame=247
    scene.render.resolution_x=1440
    scene.render.resolution_y=844
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'

bpy.context.window.scene=p
collisions=[]
max_roll=0
previous=None
positions=[]
for frame in range(1,290):
    p.frame_set(frame)
    dg=bpy.context.evaluated_depsgraph_get()
    loc=cam.evaluated_get(dg).matrix_world.translation.copy()
    right=cam.matrix_world.to_quaternion()@Vector((1,0,0))
    max_roll=max(max_roll,abs(right.z))
    if previous is not None:
        direction=loc-previous
        if direction.length > 1e-7:
            hit,point,normal,idx,obj,mat=p.ray_cast(dg,previous,direction.normalized(),distance=direction.length)
            if hit: collisions.append({'frame':frame,'object':obj.name})
    positions.append(list(loc))
    previous=loc
meshes=[o for o in s.objects if o.type=='MESH']
for o in meshes: o.data.calc_loop_triangles()
stats={
    'scenes':[x.name for x in bpy.data.scenes],
    'base_objects':len(s.objects),'base_meshes':len(meshes),
    'triangles':sum(len(o.data.loop_triangles) for o in meshes),
    'materials_in_stage':len({m for o in meshes for m in o.data.materials}),
    'non_unit_mesh_scales':[o.name for o in meshes if any(abs(v-1)>1e-6 for v in o.scale)],
    'camera_center_path_collisions':collisions,
    'max_camera_right_vector_vertical_component':max_roll,
    'animated_channels':6,
    'textures':0,'door_animation':False,
    'render_resolution':[1440,844],
    'validation_limit':'Centerline collision check only; dimensions and real door clearance unverified.',
    'first_position':positions[0],'last_position':positions[-1],
}
assert not collisions, collisions
assert not stats['non_unit_mesh_scales']
assert max_roll<.0001
assert (Vector(positions[-1])-Vector((1.7803301,1.7803301,1.78))).length<.001
assert bpy.data.objects['2A_DOOR_CLOSED_PROXY_UNKNOWN_MECHANISM'].name in s.objects
assert bpy.data.objects['2A_DOOR_CLOSED_PROXY_UNKNOWN_MECHANISM'].name not in p.objects

# Restore base closed scene, keep the source default scene untouched in the same file.
p.frame_set(1)
bpy.context.window.scene=s
s.camera=bpy.data.objects['2A_CAM_A_BALANCED']; s.frame_set(1)
blend=OUT/'RP_Usados_Blockout_2A_v001.blend'
assert not blend.exists(), 'Refuse to overwrite an existing stage file.'
bpy.ops.wm.save_as_mainfile(filepath=str(blend))
stats['blend_file']=str(blend)
(OUT/'validation.json').write_text(json.dumps(stats,indent=2),encoding='utf-8')
print(json.dumps(stats,indent=2))

def render_review_movie():
    status=OUT/'review'/'render-status.json'
    status.write_text(json.dumps({'status':'rendering','frames':289}),encoding='utf-8')
    try:
        bpy.context.window.scene=p
        p.camera=cam
        p.frame_set(1)
        p.render.resolution_x=960
        p.render.resolution_y=562
        p.render.resolution_percentage=100
        p.render.fps=24
        p.render.image_settings.media_type='VIDEO'
        p.render.image_settings.file_format='FFMPEG'
        p.render.ffmpeg.format='MPEG4'
        p.render.ffmpeg.codec='H264'
        p.render.ffmpeg.constant_rate_factor='HIGH'
        p.render.filepath=str(OUT/'review'/'RP-2A-recorrido-PROVISIONAL.mp4')
        bpy.ops.render.render(animation=True)
        status.write_text(json.dumps({'status':'complete','frames':289,'fps':24,'resolution':[960,562]}),encoding='utf-8')
    except Exception:
        status.write_text(json.dumps({'status':'error','detail':traceback.format_exc()}),encoding='utf-8')
    finally:
        p.render.resolution_x=1440; p.render.resolution_y=844
        p.render.image_settings.media_type='IMAGE'
        p.render.image_settings.file_format='PNG'
        p.frame_set(1)
        bpy.context.window.scene=s
        s.camera=bpy.data.objects['2A_CAM_A_BALANCED']; s.frame_set(1)
    return None

bpy.app.timers.register(render_review_movie,first_interval=2.0)
print('Review render queued. Progress: review/render-status.json. Separate .blend already saved.')
