import bpy,math,json,random
from pathlib import Path
from mathutils import Vector
ROOT=Path(r'C:/Users/dante.DESKTOP/Desktop/rp-usados-gpt/rp-usados/blender/visual-production-v001')
s=bpy.data.scenes['RP_VISUAL_01_APPROVED_CAMERA'];bpy.context.window.scene=s
assert not s.get('review_setup_done')

# Densify the existing canopy; trunk remains outside the vehicle access.
leaves=bpy.data.objects['VIS_TREE_LEAF_MASS'];random.seed(55)
for j in range(3):
    copy=leaves.copy();copy.data=leaves.data.copy();copy.name='VIS_TREE_CANOPY_LAYER_'+str(j)
    leaves.users_collection[0].objects.link(copy)
    copy.location=(random.uniform(-.42,.42),random.uniform(-.42,.42),random.uniform(-.18,.35))
for o in bpy.data.collections['VIS_EXISTING_TREE_ESTIMATED'].objects:
    o.location.x+=.55

# A curved concrete curb, keeping the two straight street edges.
curbs=[o for o in s.objects if o.name.startswith('2A_YELLOW_CURB')]
diagonal=min(curbs,key=lambda o:abs(o.location.x-o.location.y))
diagonal.hide_render=True;diagonal.hide_set(True)
pts=[Vector((1.82+3.47*math.cos(math.pi+i*math.pi/2/24),1.82+3.47*math.sin(math.pi+i*math.pi/2/24),0)) for i in range(25)]
verts=[];faces=[]
for i,p in enumerate(pts):
    normal=Vector((p.x-1.82,p.y-1.82,0)).normalized()
    for offset,z in [(-.065,0),(.065,0),(.065,.145),(-.065,.145)]:
        q=p+normal*offset;verts.append((q.x,q.y,z))
for i in range(24):
    for k in range(4):faces.append((i*4+k,i*4+(k+1)%4,(i+1)*4+(k+1)%4,(i+1)*4+k))
me=bpy.data.meshes.new('VIS_CURVED_CURB');me.from_pydata(verts,[],faces);me.update();me.materials.append(bpy.data.materials['VIS_08_CURB_OCHRE_YELLOW'])
o=bpy.data.objects.new('VIS_CURVED_YELLOW_CURB',me);bpy.data.collections['VIS_PAVING'].objects.link(o)
b=o.modifiers.new('Worn edge radius','BEVEL');b.width=.012;b.segments=2
verts=[(p.x,p.y,.144) for p in pts]
me=bpy.data.meshes.new('VIS_CORNER_APRON');me.from_pydata(verts,[],[tuple(range(25))]);me.update();me.materials.append(bpy.data.materials['VIS_06_SIDEWALK_CONCRETE'])
o=bpy.data.objects.new('VIS_CORNER_APRON',me);bpy.data.collections['VIS_PAVING'].objects.link(o)
for obj in [o,bpy.data.objects['VIS_CURVED_YELLOW_CURB']]:
    uv=obj.data.uv_layers.new(name='SurfaceUV')
    for p in obj.data.polygons:
        for li in p.loop_indices:
            v=obj.data.vertices[obj.data.loops[li].vertex_index].co;uv.data[li].uv=(v.x/2,v.y/2)

# Material swatches are a separate diagnostic scene, excluded from the hero.
lab=bpy.data.scenes.new('RP_MATERIALS_NEUTRAL_REVIEW');lab.use_fake_user=True
bpy.context.window.scene=lab
try:lab.render.engine='CYCLES'
except TypeError as e:raise RuntimeError(str(e))
lab.cycles.device=s.cycles.device;lab.cycles.samples=64;lab.cycles.use_denoising=True
lab.render.resolution_x=1440;lab.render.resolution_y=900;lab.render.resolution_percentage=100
lab.world=bpy.data.worlds.new('VIS_NEUTRAL_STUDIO');lab.world.use_nodes=True
bg=next(n for n in lab.world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs['Color'].default_value=(.25,.25,.25,1);bg.inputs['Strength'].default_value=.25
def cube(name,loc,size,mat):
    x,y,z=[v/2 for v in size];me=bpy.data.meshes.new(name)
    me.from_pydata([(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)],[],[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]);me.update();me.materials.append(mat)
    ob=bpy.data.objects.new(name,me);lab.collection.objects.link(ob);ob.location=loc
    mod=ob.modifiers.new('Rounded sample edge','BEVEL');mod.width=.045;mod.segments=4
    uv=me.uv_layers.new()
    for p in me.polygons:
        drop=max(range(3),key=lambda k:abs(p.normal[k]));axes=[k for k in range(3) if k!=drop]
        for li in p.loop_indices:
            v=me.vertices[me.loops[li].vertex_index].co;uv.data[li].uv=(v[axes[0]]+.5,v[axes[1]]+.5)
    return ob
names=['VIS_01_PAINT_LIGHT_GREY','VIS_02_PAINT_CHARCOAL','VIS_03_BLACK_CORNER_PAINT','VIS_04_PAINTED_METAL_FRAMES','VIS_05_CLEAR_GLASS','VIS_06_SIDEWALK_CONCRETE','VIS_07_ASPHALT_DRY','VIS_08_CURB_OCHRE_YELLOW']
for i,name in enumerate(names):cube('SWATCH_%02d'%(i+1),((i%4-1.5)*1.75,.95 if i<4 else -.95,.3),(1.40,1.40,.35),bpy.data.materials[name])
cube('STUDIO_GROUND',(0,0,-.08),(25,25,.1),bpy.data.materials['VIS_02_PAINT_CHARCOAL'])
for name,loc,power,size in [('KEY',(-3,-4,7),1500,5),('FILL',(4,2,5),1100,4)]:
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.size=size
    o=bpy.data.objects.new(name,d);lab.collection.objects.link(o);o.location=loc;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
d=bpy.data.cameras.new('MATERIAL_CAMERA');d.type='ORTHO';d.ortho_scale=8.5
o=bpy.data.objects.new('MATERIAL_CAMERA',d);lab.collection.objects.link(o);o.location=(.4,-6.5,9);o.rotation_euler=(Vector((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler();lab.camera=o
lab['swatch_order']=json.dumps(names)

bpy.context.window.scene=s;s.frame_set(1);s['review_setup_done']=True
# Package the .blend with its maps so it is portable. Originals remain separate.
used=set()
for mat in bpy.data.materials:
    if mat.use_nodes:
        for n in mat.node_tree.nodes:
            if n.type=='TEX_IMAGE' and n.image:used.add(n.image)
for im in used:
    if im.source=='FILE':im.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'RP_Usados_Hero_Visual_v001.blend'))
print(json.dumps({'main_objects':len(s.objects),'lab_scene':lab.name,'packed_images':len(used),'visible_frames':[1,85]}))
