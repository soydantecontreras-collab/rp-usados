"""Visible detail only. Dimensions remain photographic estimates, not a survey."""
import bpy, math, random, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(r'C:/Users/dante.DESKTOP/Desktop/rp-usados-gpt/rp-usados/blender/visual-production-v001')
s=bpy.data.scenes['RP_VISUAL_01_APPROVED_CAMERA']; bpy.context.window.scene=s
assert not s.get('geometry_v1_done')
M={k:bpy.data.materials[n] for k,n in {
 'wall':'VIS_01_PAINT_LIGHT_GREY','base':'VIS_02_PAINT_CHARCOAL','black':'VIS_03_BLACK_CORNER_PAINT',
 'metal':'VIS_04_PAINTED_METAL_FRAMES','glass':'VIS_05_CLEAR_GLASS','walk':'VIS_06_SIDEWALK_CONCRETE',
 'curb':'VIS_08_CURB_OCHRE_YELLOW','context':'VIS_09_NEIGHBOUR_PLASTER','inside':'VIS_10_INTERIOR_PLASTER',
 'steel':'VIS_14_DARK_STEEL','wood':'VIS_15_WEATHERED_POLE','tile':'VIS_16_ROOF_TERRACOTTA'}.items()}
C={}
for key in ['FACADE_DETAIL','PAVING','ROOF_DETAIL','URBAN_VISIBLE','INTERIOR_MINIMUM']:
    c=bpy.data.collections.new('VIS_'+key); s.collection.children.link(c); C[key]=c

def uvmap(o,repeat=2):
    uv=o.data.uv_layers.new(name='SurfaceUV')
    o.data.update(); bpy.context.view_layer.update()
    for p in o.data.polygons:
        n=o.matrix_world.to_3x3()@p.normal
        drop=max(range(3),key=lambda k:abs(n[k])); axes=[k for k in range(3) if k!=drop]
        for li in p.loop_indices:
            v=o.matrix_world@o.data.vertices[o.data.loops[li].vertex_index].co
            uv.data[li].uv=(v[axes[0]]/repeat,v[axes[1]]/repeat)

def mesh(name,verts,faces,mat,coll='FACADE_DETAIL'):
    me=bpy.data.meshes.new(name); me.from_pydata(verts,[],faces); me.update()
    o=bpy.data.objects.new('VIS_'+name,me); C[coll].objects.link(o)
    me.materials.append(mat); return o

def box(name,loc,size,mat,coll='FACADE_DETAIL',angle=0,bevel=.003):
    x,y,z=[a/2 for a in size]
    o=mesh(name,[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)],[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],mat,coll)
    o.location=loc; o.rotation_euler.z=angle
    if bevel:
        b=o.modifiers.new('Edge radius','BEVEL'); b.width=bevel; b.segments=2
    return o

def rod(name,a,b,r,mat,coll='URBAN_VISIBLE',sides=10):
    a,b=Vector(a),Vector(b); axis=(b-a).normalized()
    tangent=axis.cross(Vector((0,0,1)))
    if tangent.length<.001:tangent=axis.cross(Vector((0,1,0)))
    tangent.normalize(); bitan=axis.cross(tangent)
    verts=[tuple(p+r*(tangent*math.cos(i*2*math.pi/sides)+bitan*math.sin(i*2*math.pi/sides))) for p in [a,b] for i in range(sides)]
    faces=[tuple(reversed(range(sides))),tuple(range(sides,sides*2))]+[(i,(i+1)%sides,(i+1)%sides+sides,i+sides) for i in range(sides)]
    o=mesh(name,verts,faces,mat,coll)
    for p in o.data.polygons[2:]:p.use_smooth=True
    return o

def hide(name):
    o=bpy.data.objects.get(name)
    if o:o.hide_render=True;o.hide_set(True)

# Return depth at the entrance: real jambs rather than a paper-thin portal.
T=Vector((2**-.5,-2**-.5,0)); N=Vector((2**-.5,2**-.5,0)); center=Vector((1.25,1.25,0))
for side in [-1,1]:
    p=center+T*(side*.858)+N*.12; p.z=1.435
    box('ENTRY_REVEAL_'+str(side),p,(.07,.32,2.49),M['wall'],angle=-math.pi/4)
    p=center+T*(side*1.2)-N*.15;p.z=1.8
    box('EXISTING_CORNER_WALL_LIGHT_'+str(side),p,(.20,.085,.095),M['steel'],angle=-math.pi/4)
    p=center+T*(side*1.2)-N*.197;p.z=1.8
    box('WALL_LIGHT_LENS_'+str(side),p,(.13,.01,.045),M['metal'],angle=-math.pi/4)
# Keep future door geometry in its own collection, excluded from the open rehearsal.
door=bpy.data.objects.get('2A_DOOR_CLOSED_PROXY_UNKNOWN_MECHANISM')
if door:door['production_status']='Mechanism not documented. No hinges, animation or hardware invented.'

# Horizontal grille ties, window reveal depth and simple visible masonry sills.
for idx,(lo,hi,bottom,top) in enumerate([(3,4.48,.58,3.38),(5.46,8.13,.58,3.38),(9.38,12.03,.56,3.32)],1):
    for z in [bottom+.65,top-1.05]:
        box(f'CHACABUCO_{idx}_GRILLE_TIE_{z}',((lo+hi)/2,-.128,z),(hi-lo,.026,.020),M['metal'],bevel=.002)
    box(f'CHACABUCO_{idx}_SILL',((lo+hi)/2,-.055,bottom-.025),(hi-lo+.08,.32,.06),M['base'])
    box(f'CHACABUCO_{idx}_RECESS_TOP',((lo+hi)/2,.13,top-.035),(hi-lo,.26,.05),M['wall'])
    if idx==2:
        box('CHACABUCO_CENTRAL_MULLION',((lo+hi)/2,-.08,1.93),(.046,.065,2.72),M['metal'])
    # Existing small wall luminaires visible between apertures.
    if idx<3:
        x=hi+.43
        box(f'FACADE_WALL_LIGHT_{idx}',(x,-.16,2.14),(.22,.09,.12),M['steel'])

# Garage lower leaves are geometric panels only; no invented opening animation.
for y in [5.04,6.32,7.6,8.88,10.21]:
    box('GARAGE_GATE_VERTICAL',(-.10,y,1.2),(.062,.045,1.99),M['metal'])
for z in [.23,1.65,2.19]:
    box('GARAGE_GATE_HORIZONTAL',(-.10,7.625,z),(.062,5.23,.045),M['metal'])

# Upper structure: three visible triangular bays and their sheet panels.
# Main dimensions retained from approved blockout; smaller edge trims added.
for z in [4.28,4.62]:
    box('UPPER_FASCIA_TRIM',(.06,7.83,z),(.075,5.66,.055),M['metal'],'ROOF_DETAIL')

# Existing partial pitched roof behind the right front, seen in owner corner photo.
hide('2A_REAR_ROOF_PARTIAL_MASS')
roof=mesh('REAR_PITCHED_ROOF',[(6.35,2.7,4.42),(10.65,2.7,4.42),(10.65,4.2,5.17),(6.35,4.2,5.17),(6.35,5.7,4.42),(10.65,5.7,4.42)],[(0,1,2,3),(3,2,5,4)],M['tile'],'ROOF_DETAIL')
roof['reference']='Owner photos 01/03: partial pitched roof. Heights estimated.'
for x in [6.35,10.65]:
    rod('ROOF_EDGE',(x,2.7,4.42),(x,4.2,5.17),.026,M['base'],'ROOF_DETAIL')
    rod('ROOF_EDGE',(x,4.2,5.17),(x,5.7,4.42),.026,M['base'],'ROOF_DETAIL')
for j in range(31):
    x=6.36+j*.143
    rod('ROOF_TILE_RIDGE',(x,2.7,4.425),(x,4.2,5.175),.028,M['tile'],'ROOF_DETAIL',6)

# Tank cap and circumferential seam; no new tank lettering.
rod('TANK_CAP',(4.6,4.2,5.477),(4.6,4.2,5.525),.43,M['wall'],'ROOF_DETAIL',32)
rod('TANK_BASE_RING',(4.6,4.2,4.34),(4.6,4.2,4.39),.49,M['base'],'ROOF_DETAIL',32)

# Sidewalk square slabs. Physical joints read at ground level without displacement.
random.seed(39)
verts=[]; faces=[]
def tile(x,y,dx=.30,dy=.30):
    i=len(verts); gap=.004; z=.151+random.uniform(-.001,.001)
    verts.extend([(x+gap,y+gap,z),(x+dx-gap,y+gap,z),(x+dx-gap,y+dy-gap,z),(x+gap,y+dy-gap,z)])
    faces.append((i,i+1,i+2,i+3))
for i in range(53):
    x=-1.57+i*.30
    for j in range(43):
        y=-1.57+j*.30
        # Exclude building; follow the chamfer strip without paving the street.
        outside=(x+.15<-.11 or y+.15<-.11 or x+y+.30<2.26)
        onwalk=(x+y+.30>.31 and x>=-1.58 and y>=-1.58)
        if outside and onwalk:tile(x,y)
paving=mesh('SIDEWALK_SLAB_JOINTS',verts,faces,M['walk'],'PAVING')
uvmap(paving)
# Coarse anti-slip grooves only on the entrance apron, as observed in the photos.
v=[]; f=[]
for i in range(46):
    u=-1.36+i*.06
    for j in range(6):
        p=center+T*u-N*(.28+j*.22); p.z=.155
        a=p-T*.002-N*.086;b=p+T*.002-N*.086;c=p+T*.002+N*.086;d=p-T*.002+N*.086
        n=len(v);v.extend([a,b,c,d]);f.append((n,n+1,n+2,n+3))
mesh('APRON_ANTI_SLIP_GROOVES',v,f,M['base'],'PAVING')

# Utility pole, traffic signal and hanging cables, all visible in owner photos.
hide('2A_UTILITY_POLE_APPROX'); hide('2A_STREET_LIGHT_ARM'); hide('2A_TRAFFIC_LIGHT_PROXY')
rod('UTILITY_WOOD_POLE',(-1,2.65,.10),(-1,2.65,6.9),.112,M['wood'],sides=24)
for z in [2.6,3.6,5.8]:rod('POLE_BAND',(-1,2.65,z),(-1,2.65,z+.036),.119,M['steel'],sides=24)
box('TRAFFIC_SIGNAL_HOUSING',(-1.34,2.17,3.25),(.29,.24,.84),M['black'],'URBAN_VISIBLE',bevel=.025)
for i,col in enumerate([(.12,.008,.005),(.16,.062,.003),(.008,.14,.044)]):
    mat=M['black'].copy();mat.name='VIS_SIGNAL_LENS_'+str(i)
    p=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(*col,1)
    if i==2:p.inputs['Emission Color'].default_value=(*col,1);p.inputs['Emission Strength'].default_value=1.5
    rod('TRAFFIC_SIGNAL_LENS',(-1.34,2.038,3.53-i*.28),(-1.34,2.025,3.53-i*.28),.098,mat,sides=20)
    box('SIGNAL_VISOR',(-1.34,1.99,3.65-i*.28),(.23,.18,.028),M['black'],'URBAN_VISIBLE')
pts=[]
for i in range(13):
    t=i/12;pts.append((-1.34-1.81*t,2.17,5.15+.60*math.sin(t*math.pi/2)))
for a,b in zip(pts,pts[1:]):rod('CURVED_SIGNAL_ARM',a,b,.038,M['steel'],sides=10)
for o in list(s.objects):
    if 'OVERHEAD_LINE_PROXY' in o.name:hide(o.name)
for j,(y,z,sag) in enumerate([(2.25,6.55,.19),(2.52,6.52,.25),(2.70,6.46,.33),(1.68,5.35,.29)]):
    pts=[(-11+24*k/16,y+.05*math.sin(k/16*math.pi),z-sag*4*(k/16)*(1-k/16)) for k in range(17)]
    for k,(a,b) in enumerate(zip(pts,pts[1:])):rod('OVERHEAD_CABLE_'+str(j),a,b,.009 if j<3 else .006,M['black'],sides=6)

# Adjacent building color divisions/window strip, visible in owner garage photograph.
red=M['context'].copy();red.name='VIS_NEIGHBOUR_MUTED_RED'
next(n for n in red.node_tree.nodes if n.type=='BSDF_PRINCIPLED').inputs['Base Color'].default_value=(.22,.075,.055,1)
box('NEIGHBOUR_RED_FRONT',(-.115,12.55,2.4),(.06,3.7,3.2),red,'URBAN_VISIBLE')
box('NEIGHBOUR_UPPER_WINDOW',(-.15,12.45,5.82),(.035,2.6,.84),M['glass'],'URBAN_VISIBLE')
for y in [11.17,11.8,12.45,13.1,13.73]:box('NEIGHBOUR_WINDOW_MULLION',(-.182,y,5.82),(.045,.045,.88),M['metal'],'URBAN_VISIBLE')

# Interior remains only floor, enclosing planes and soft light. No fabricated inventory.
for o in C['FACADE_DETAIL'].objects:
    if o.type=='MESH':uvmap(o)
for c in [C['ROOF_DETAIL'],C['URBAN_VISIBLE']]:
    for o in c.objects:
        if o.type=='MESH':uvmap(o)
s['geometry_v1_done']=True
s['architectural_limit']='Photo-based approximate dimensions. No measured survey received. Logo and door hardware pending.'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'RP_Usados_Hero_Visual_v001.blend'))
print(json.dumps({'objects':len(s.objects),'new_collections':list(C),'camera_range':[s.frame_start,s.frame_end]}))
