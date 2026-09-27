"""Offline doorway matte from the approved camera. Never saves or edits the source blend.

The matte hides interior pixels in the delivered VIDEO, so a late reverse seek cannot
expose the showroom underneath an HTML fade. Workbench is used only for the matte;
all visible architecture still comes from the approved Cycles frames.
"""
import bpy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'blender/prerender-v2/transition-mattes'
OUT.mkdir(exist_ok=True)
s = bpy.context.scene
assert Path(bpy.data.filepath).name == 'RP_Usados_Hero_v6_1.blend'
assert s.camera.name == 'CAM_A_Ochava'

black = bpy.data.materials.new('MASK_Occluder'); black.diffuse_color = (0,0,0,1)
white = bpy.data.materials.new('MASK_Interior'); white.diffuse_color = (1,1,1,1)
for o in list(s.objects):
    if not hasattr(o.data, 'materials'): continue
    glass = {i for i,m in enumerate(o.data.materials) if m and any(k in m.name.lower() for k in ['vidrio','glass'])}
    door = o.name.startswith('Puerta_Acceso_Hoja')
    for i in range(len(o.data.materials)):
        o.data.materials[i] = white if door and i in glass else black
    if not o.data.materials: o.data.materials.append(black)

# Aperture behind the approved jambs; world coordinates read from the existing model.
left = (-1.8404342-.025, .8575557+.025)
right = (-.8575557-.025, 1.8404342+.025)
mesh = bpy.data.meshes.new('MASK_Aperture')
mesh.from_pydata([(left[0],left[1],.30),(right[0],right[1],.30),
                   (right[0],right[1],2.30),(left[0],left[1],2.30)],[],[(0,1,2,3)])
o = bpy.data.objects.new('MASK_Aperture',mesh); s.collection.objects.link(o)
o.data.materials.append(white)
s.render.engine = 'BLENDER_WORKBENCH'
sh = s.display.shading
sh.light = 'FLAT'; sh.color_type = 'MATERIAL'; sh.background_type = 'WORLD'
s.world.color = (0,0,0)
sh.show_shadows = False; sh.show_cavity = False; sh.show_specular_highlight = False
sh.show_object_outline = False
s.display.render_aa = '16'
s.view_settings.view_transform = 'Raw'
s.view_settings.exposure = 0; s.view_settings.gamma = 1
s.render.resolution_x = 1600; s.render.resolution_y = 900; s.render.resolution_percentage = 100
s.render.image_settings.media_type = 'IMAGE'; s.render.image_settings.file_format = 'PNG'
s.render.image_settings.color_mode = 'RGB'; s.render.film_transparent = False
for i in range(144):
    frame = 1+i*71/143
    s.frame_set(int(frame),subframe=frame-int(frame))
    s.render.filepath = str(OUT/f'{i:04d}.png')
    bpy.ops.render.render(write_still=True)
print('TRANSITION_MATTES_COMPLETE',flush=True)
