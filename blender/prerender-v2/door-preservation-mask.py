"""Render opaque door/jamb coverage independently of the virtual blackout plane.

Background Blender process only. The approved scene is read, never saved. Camera,
door transforms and occluding architecture come directly from the source scene.
Glass remains black in this mask: it must not restore the visible showroom.
"""
import bpy,json
from pathlib import Path

HERE=Path(__file__).resolve().parent
OUT=HERE/'door-mattes'; OUT.mkdir(exist_ok=True)
s=bpy.context.scene
assert Path(bpy.data.filepath).name=='RP_Usados_Hero_v6_1.blend'
assert s.camera.name=='CAM_A_Ochava'
black=bpy.data.materials.new('MASK_Background'); black.diffuse_color=(0,0,0,1)
white=bpy.data.materials.new('MASK_DoorSurface'); white.diffuse_color=(1,1,1,1)
parts=[]
for o in s.objects:
    if not hasattr(o.data,'materials'): continue
    keep=o.name.startswith('Puerta_Acceso_Hoja') or o.name=='Ochava_MarcoAluminio'
    glass={i for i,m in enumerate(o.data.materials) if m and any(k in m.name.lower() for k in ['vidrio','glass'])}
    if keep: parts.append({'object':o.name,'glassSlotsExcluded':sorted(glass)})
    for i in range(len(o.data.materials)):
        o.data.materials[i]=white if keep and i not in glass else black
    if not o.data.materials: o.data.materials.append(black)
s.render.engine='BLENDER_WORKBENCH'
sh=s.display.shading
sh.light='FLAT'; sh.color_type='MATERIAL'; sh.background_type='WORLD'
s.world.color=(0,0,0)
sh.show_shadows=False; sh.show_cavity=False; sh.show_specular_highlight=False
sh.show_object_outline=False
s.display.render_aa='16'
s.view_settings.view_transform='Raw';s.view_settings.exposure=0;s.view_settings.gamma=1
s.render.resolution_x=1600;s.render.resolution_y=900;s.render.resolution_percentage=100
s.render.image_settings.media_type='IMAGE';s.render.image_settings.file_format='PNG'
s.render.image_settings.color_mode='RGB';s.render.film_transparent=False
for i in range(144):
    frame=1+i*71/143
    s.frame_set(int(frame),subframe=frame-int(frame))
    s.render.filepath=str(OUT/f'{i:04d}.png')
    bpy.ops.render.render(write_still=True)
(HERE/'door-mask-report.json').write_text(json.dumps({'parts':parts,'frames':144,'fps':48,'source':bpy.data.filepath},indent=2),encoding='utf-8')
print('DOOR_MATTES_COMPLETE',flush=True)
