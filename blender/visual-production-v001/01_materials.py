"""Run via Blender MCP. Production materials; approved camera remains untouched."""
import bpy, json, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(r'C:/Users/dante.DESKTOP/Desktop/rp-usados-gpt/rp-usados/blender/visual-production-v001')
s=bpy.data.scenes['RP_VISUAL_01_APPROVED_CAMERA']
bpy.context.window.scene=s
assert not s.get('materials_v1_done')
camera=s.camera
signature=[]
for frame in range(1,116):
    s.frame_set(frame); bpy.context.view_layer.update()
    signature.append({'frame':frame,'location':list(camera.location),'rotation':list(camera.rotation_euler),'lens':camera.data.lens})
(ROOT/'camera-original.json').write_text(json.dumps(signature,indent=2))
s.frame_set(1)

def enum(obj, prop, value):
    options=[i.identifier for i in obj.bl_rna.properties[prop].enum_items]
    assert value in options, (prop,value,options)
    setattr(obj,prop,value)

def material(name,color,rough=.65,metal=0):
    m=bpy.data.materials.new('VIS_'+name); m.use_nodes=True
    m.diffuse_color=(*color,1)
    p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=rough
    p.inputs['Metallic'].default_value=metal
    return m

def maps(m,asset,res='1k',color=False,strength=.25,rough=True):
    nt=m.node_tree; p=next(n for n in nt.nodes if n.type=='BSDF_PRINCIPLED')
    for suffix,socket in [('diff','Base Color'),('rough','Roughness'),('nor_gl','Normal')]:
        if suffix=='diff' and not color: continue
        if suffix=='rough' and not rough: continue
        file=ROOT/'textures'/f'{asset}_{suffix}_{res}.jpg'
        im=bpy.data.images.load(str(file),check_existing=True)
        if suffix!='diff': enum(im.colorspace_settings,'name','Non-Color')
        n=nt.nodes.new('ShaderNodeTexImage'); n.image=im
        n.label=f'CC0 {asset} / {suffix}'
        if suffix=='nor_gl':
            normal=nt.nodes.new('ShaderNodeNormalMap'); normal.inputs['Strength'].default_value=strength
            nt.links.new(n.outputs['Color'],normal.inputs['Color']); nt.links.new(normal.outputs['Normal'],p.inputs[socket])
        else: nt.links.new(n.outputs['Color'],p.inputs[socket])
    m['source']='https://polyhaven.com/a/'+asset
    m['license']='CC0; real facade colors remain reference-led.'

M={
 'wall':material('01_PAINT_LIGHT_GREY',(.43,.455,.45),.72),
 'base':material('02_PAINT_CHARCOAL',(.073,.082,.079),.68),
 'black':material('03_BLACK_CORNER_PAINT',(.012,.014,.016),.53),
 'metal':material('04_PAINTED_METAL_FRAMES',(.50,.53,.50),.33,.28),
 'glass':material('05_CLEAR_GLASS',(.90,.95,.94),.095),
 'walk':material('06_SIDEWALK_CONCRETE',(.235,.23,.205),.76),
 'road':material('07_ASPHALT_DRY',(.08,.09,.10),.80),
 'curb':material('08_CURB_OCHRE_YELLOW',(.64,.365,.035),.74),
 'context':material('09_NEIGHBOUR_PLASTER',(.23,.25,.25),.80),
 'inside':material('10_INTERIOR_PLASTER',(.43,.40,.35),.80),
 'floor':material('11_INTERIOR_CONCRETE',(.25,.25,.24),.52),
 'mark':material('12_WORN_CROSSWALK_PAINT',(.56,.57,.54),.8),
 'sign':material('13_SIGN_FACE_AWAITING_ORIGINAL',(.008,.01,.012),.28),
 'steel':material('14_DARK_STEEL',(.045,.05,.054),.30,.65),
 'wood':material('15_WEATHERED_POLE',(.15,.145,.10),.86),
 'tile':material('16_ROOF_TERRACOTTA',(.10,.054,.037),.8),
}
for key in ['wall','base','black','curb','context','inside']:
    maps(M[key],'painted_plaster_wall',strength=.17 if key!='base' else .28,rough=False)
maps(M['road'],'asphalt_02','2k',color=True,strength=.65)
maps(M['walk'],'concrete_floor_worn_001',strength=.32)
maps(M['floor'],'concrete_floor_worn_001',color=True,strength=.12)
p=next(n for n in M['glass'].node_tree.nodes if n.type=='BSDF_PRINCIPLED')
p.inputs['Transmission Weight'].default_value=1
p.inputs['IOR'].default_value=1.47

oldkeys={'LIGHT_GREY':'wall','CHARCOAL':'base','BLACK_CORNER':'black','LIGHT_METAL':'metal',
 'OPAQUE_OPENING':'glass','SIDEWALK':'walk','STREET_PROXY':'road','YELLOW_CURB':'curb',
 'NEIGHBOUR':'context','INTERIOR_SCHEMATIC':'inside','CROSSWALK':'mark'}
for o in s.objects:
    if o.type!='MESH': continue
    for slot in o.material_slots:
        for term,key in oldkeys.items():
            if slot.material and term in slot.material.name:
                slot.material=M[key]; break
    if 'SIGN_PANEL' in o.name: o.data.materials[0]=M['sign']
    if o.name=='2A_FLOOR': o.data.materials[0]=M['floor']
    if 'UTILITY_POLE' in o.name: o.data.materials[0]=M['wood']
    if 'DARK_RECESS' in o.name:
        # Physical glass thickness, separated from external protective grille.
        axis=0 if 'GARAGE' in o.name else 1
        for v in o.data.vertices: v.co[axis]*=.22
    # World-sized UVs. No procedural shader dependency at export.
    uv=o.data.uv_layers.new(name='SurfaceUV') if not o.data.uv_layers else o.data.uv_layers.active
    repeat=3.0 if 'STREET_PATCH' in o.name else 2.0
    for poly in o.data.polygons:
        normal=o.matrix_world.to_3x3()@poly.normal
        a=max(range(3),key=lambda k:abs(normal[k]))
        axes=[k for k in range(3) if k!=a]
        for li in poly.loop_indices:
            v=o.matrix_world@o.data.vertices[o.data.loops[li].vertex_index].co
            uv.data[li].uv=(v[axes[0]]/repeat,v[axes[1]]/repeat)
    if len(o.data.polygons)>1 and not any(t in o.name for t in ['BAR_','OVERHEAD','ANTENNA']):
        bevel=o.modifiers.new('Small physical edge radius','BEVEL')
        bevel.width=.006 if 'FRAME' in o.name or 'JAMB' in o.name or 'RAIL' in o.name else .012
        bevel.segments=2
        bevel.affect=bevel.affect
        bevel.use_clamp_overlap=True
        bevel.harden_normals=True

# Remove only the undocumented plinths from this production scene.
for o in list(s.objects):
    if 'INTERIOR_SIMPLE_PLINTH' in o.name:
        o.hide_render=True; o.hide_set(True)
        o['status']='Unconfirmed proxy, excluded from production renders.'

s['materials_v1_done']=True
for a in bpy.context.screen.areas:
    if a.type=='VIEW_3D':
        a.spaces.active.overlay.show_overlays=False
        a.spaces.active.region_3d.view_perspective='CAMERA'
        a.spaces.active.region_3d.view_camera_zoom=10
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'RP_Usados_Hero_Visual_v001.blend'))
print(json.dumps({'materials':len(M),'images':len([i for i in bpy.data.images if i.source=='FILE']),'camera_frames_unchanged':115}))
