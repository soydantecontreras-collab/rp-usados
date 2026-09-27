"""Render-driven corrections and the visible existing tree canopy."""
import bpy, math, random, json, traceback
from mathutils import Vector
from pathlib import Path
ROOT=Path(r'C:/Users/dante.DESKTOP/Desktop/rp-usados-gpt/rp-usados/blender/visual-production-v001')
s=bpy.data.scenes['RP_VISUAL_01_APPROVED_CAMERA'];bpy.context.window.scene=s
assert not s.get('refine_v1_done')
# The wall was segmented to make openings. Beveling every segment created fake seams.
for o in s.objects:
    if o.type=='MESH' and any(t in o.name for t in ['PIER_','SILL_0.','HEADER_','FINAL_PIER','OCHAVA_SIDE','OCHAVA_LINTEL']):
        for m in list(o.modifiers):o.modifiers.remove(m)
    if 'CROSSING_STRIPE' in o.name:
        for v in o.data.vertices:v.co.z*=.06
        o.location.z=-.019
        for m in list(o.modifiers):o.modifiers.remove(m)
# Extend only the ground plane so the artificial finite-patch horizon is not visible.
road=bpy.data.objects['2A_STREET_PATCH']
for v in road.data.vertices:v.co.x*=4;v.co.y*=4
uv=road.data.uv_layers.active
for p in road.data.polygons:
    for li in p.loop_indices:
        v=road.matrix_world@road.data.vertices[road.data.loops[li].vertex_index].co
        uv.data[li].uv=(v.x/4,v.y/4)
for name,power in {'BLUE_SKY_SOFTBOX':1100,'STREET_BOUNCE':300,'GARAGE_SIDE_KEY':530,'WARM_INTERIOR_MAIN':180,'WARM_INTERIOR_REAR':200,'INTERIOR_GARAGE':95,'SIGN_SOFT_ACCENT':85}.items():
    bpy.data.objects['VIS_'+name].data.energy=power

# Neutral-blue sky gradient; this world requires environment baking later for web.
nt=s.world.node_tree;bg=next(n for n in nt.nodes if n.type=='BACKGROUND')
tex=nt.nodes.new('ShaderNodeTexCoord');sep=nt.nodes.new('ShaderNodeSeparateXYZ');r=nt.nodes.new('ShaderNodeValToRGB')
nt.links.new(tex.outputs['Normal'],sep.inputs[0]);nt.links.new(sep.outputs['Z'],r.inputs[0])
r.color_ramp.elements[0].position=0;r.color_ramp.elements[0].color=(.08,.13,.215,1)
r.color_ramp.elements[1].position=.75;r.color_ramp.elements[1].color=(.018,.04,.095,1)
nt.links.new(r.outputs['Color'],bg.inputs['Color']);bg.inputs['Strength'].default_value=.32

# Tree silhouette from the owner's current corner/Chacabuco photographs.
# No species is claimed; broadleaf mass is an estimated placement, outside the walk path.
c=bpy.data.collections.new('VIS_EXISTING_TREE_ESTIMATED');s.collection.children.link(c)
def mesh(name,verts,faces,mat):
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
    o=bpy.data.objects.new('VIS_'+name,me);c.objects.link(o);me.materials.append(mat);return o
wood=bpy.data.materials['VIS_15_WEATHERED_POLE'].copy();wood.name='VIS_TREE_BARK'
next(n for n in wood.node_tree.nodes if n.type=='BSDF_PRINCIPLED').inputs['Base Color'].default_value=(.065,.058,.043,1)
def rod(name,a,b,r1,r2):
    a,b=Vector(a),Vector(b);n=(b-a).normalized();t=n.cross(Vector((0,1,0))).normalized();v=n.cross(t)
    vs=[tuple(p+rr*(t*math.cos(i*math.tau/9)+v*math.sin(i*math.tau/9))) for p,rr in [(a,r1),(b,r2)] for i in range(9)]
    o=mesh(name,vs,[(i,(i+1)%9,(i+1)%9+9,i+9) for i in range(9)],wood)
    for p in o.data.polygons:p.use_smooth=True
random.seed(2026)
trunk=Vector((13.5,-.75,0))
rod('TREE_TRUNK',trunk,trunk+Vector((-.55,.22,5.6)),.20,.10)
centers=[]
for j in range(14):
    angle=j*2.40
    start=trunk+Vector((-.28,.15,3.9+j*.09))
    end=trunk+Vector((math.cos(angle)*random.uniform(1.3,2.8)-.5,math.sin(angle)*random.uniform(1.2,2.5),random.uniform(5.6,7.1)))
    rod('TREE_BRANCH',start,end,.055,.012);centers.append(end)
leaf=bpy.data.materials['VIS_03_BLACK_CORNER_PAINT'].copy();leaf.name='VIS_TREE_LEAF'
p=next(n for n in leaf.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(.022,.06,.026,1);p.inputs['Roughness'].default_value=.64
vs=[];fs=[]
for center in centers:
    for k in range(180):
        off=Vector((random.gauss(0,.58),random.gauss(0,.58),random.gauss(0,.36)))
        pos=center+off
        d=Vector((random.uniform(-1,1),random.uniform(-1,1),random.uniform(-.5,.5))).normalized()
        n=Vector((random.uniform(-1,1),random.uniform(-1,1),random.uniform(.3,1))).normalized()
        w=d.cross(n).normalized()*random.uniform(.028,.048);d*=random.uniform(.065,.10)
        i=len(vs);vs.extend([pos-d,pos+w,pos+d,pos-w,pos+Vector((0,0,.009))]);fs.extend([(i,i+1,i+4),(i+1,i+2,i+4),(i+2,i+3,i+4),(i+3,i,i+4)])
o=mesh('TREE_LEAF_MASS',vs,fs,leaf);o['reference_limit']='Canopy mass and placement estimated from supplied photos; no invented building geometry.'

# Smooth water reservoir sides: source cylinder had only twelve visibly flat facets.
tank=bpy.data.objects['2A_WATER_TANK_APPROX']
for p in tank.data.polygons:
    if abs(p.normal.z)<.5:p.use_smooth=True
s['refine_v1_done']=True
s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'RP_Usados_Hero_Visual_v001.blend'))
def test():
    status=ROOT/'review'/'render-status.json';status.write_text(json.dumps({'status':'rendering','pass':'refined'}))
    try:
        for frame,name in [(1,'A-initial'),(43,'B-middle'),(85,'C-arrival')]:
            s.frame_set(frame);bpy.context.view_layer.update();s.render.filepath=str(ROOT/'review'/f'{name}.png');bpy.ops.render.render(write_still=True)
        status.write_text(json.dumps({'status':'complete','pass':'refined'}))
    except Exception:status.write_text(json.dumps({'status':'error','detail':traceback.format_exc()}))
    finally:s.frame_set(1)
    return None
bpy.app.timers.register(test,first_interval=2)
print('Three review frames queued; duration and camera unchanged.')
