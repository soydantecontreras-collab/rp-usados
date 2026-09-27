"""RP Usados / 2A. Run through Blender MCP in a separate scene.
All dimensions are provisional modeling hypotheses, not survey measurements.
No source photo, original scene, or website file is changed.
"""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector

OUT = Path(r'C:/Users/dante.DESKTOP/Desktop/rp-usados-gpt/rp-usados/blender/stage-2a')
OUT.mkdir(parents=True, exist_ok=True)
assert 'RP_2A_CLOSED' not in bpy.data.scenes, 'Do not overwrite existing work.'
original_scene = bpy.context.scene
s = bpy.data.scenes.new('RP_2A_CLOSED')
bpy.context.window.scene = s
s.unit_settings.system = 'METRIC'
s['stage'] = '2A — BLOCKOUT ONLY. Dimensions approximate; no final materials.'
s['reference_priority'] = 'Owner photos > Street View. Current corner surround BLACK.'
s['door'] = 'Closed proxy, mechanism UNKNOWN. No opening animation.'
s['scale_assumption'] = 'Corner 3.54 m; entrance clear 1.62 x 2.48 m; wall 4.30 m. VERIFY.'
s['source_scene_preserved'] = original_scene.name
s.render.engine = original_scene.render.engine
s.render.resolution_x = 1440
s.render.resolution_y = 810
s.render.resolution_percentage = 100
s.render.image_settings.file_format = 'PNG'
s.render.image_settings.color_mode = 'RGB'
s.render.fps = 24
s.frame_start = 1
s.frame_end = 240
s.world = bpy.data.worlds.new('2A_WORLD_COOL_READABILITY')
s.world.use_nodes = True
bg = next(n for n in s.world.node_tree.nodes if n.type == 'BACKGROUND')
bg.inputs['Color'].default_value = (0.23, 0.30, 0.43, 1)
bg.inputs['Strength'].default_value = 0.45

COL = {}
for name in ['01_ENVELOPE_APPROX', '02_OPENINGS', '03_DOOR_CLOSED_PROXY',
             '04_ROOF_VISIBLE', '05_SIDEWALK_STREET', '06_CONTEXT_APPROX',
             '07_INTERIOR_SCHEMATIC', '08_LIGHTS_TEMP', '09_CAMERAS']:
    c = bpy.data.collections.new('2A_' + name)
    s.collection.children.link(c)
    COL[name] = c

def mat(name, color):
    m = bpy.data.materials.new('2A_' + name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = 0.86
    return m

M = {
    'wall': mat('LIGHT_GREY_PLASTER_PROXY', (0.52, 0.54, 0.53)),
    'base': mat('CHARCOAL_BASE_PROXY', (0.105, 0.119, 0.117)),
    'black': mat('BLACK_CORNER_CURRENT', (0.025, 0.028, 0.031)),
    'metal': mat('LIGHT_METAL_PROXY', (0.46, 0.49, 0.48)),
    'glass': mat('OPAQUE_OPENING_PROXY_NOT_GLASS', (0.07, 0.095, 0.10)),
    'walk': mat('SIDEWALK_PROXY', (0.31, 0.32, 0.30)),
    'road': mat('STREET_PROXY', (0.115, 0.13, 0.145)),
    'curb': mat('YELLOW_CURB_PROXY', (0.64, 0.40, 0.075)),
    'context': mat('NEIGHBOUR_UNDETAILED', (0.25, 0.28, 0.30)),
    'inside': mat('INTERIOR_SCHEMATIC', (0.38, 0.37, 0.33)),
    'mark': mat('CROSSWALK_PROXY', (0.59, 0.59, 0.54)),
}

def mesh(name, verts, faces, material, coll='01_ENVELOPE_APPROX'):
    data = bpy.data.meshes.new('GEO_' + name)
    data.from_pydata(verts, [], faces)
    data.update()
    o = bpy.data.objects.new('2A_' + name, data)
    COL[coll].objects.link(o)
    data.materials.append(material)
    return o

def box(name, loc, size, material, coll='01_ENVELOPE_APPROX', angle=0):
    x, y, z = (v / 2 for v in size)
    v = [(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),
         (-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]
    f = [(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    o = mesh(name,v,f,material,coll)
    o.location = loc
    o.rotation_euler.z = angle
    return o

def beam(name, a, b, width, material, coll):
    a, b = Vector(a), Vector(b)
    o = box(name, (a+b)/2, (width,width,(b-a).length), material, coll)
    o.rotation_euler = (b-a).to_track_quat('Z','Y').to_euler()
    return o

def prism(name, points, bottom, top, material, coll):
    n = len(points)
    verts = [(x,y,bottom) for x,y in points] + [(x,y,top) for x,y in points]
    faces = [tuple(reversed(range(n))),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    return mesh(name,verts,faces,material,coll)

# Coordinate convention: building in +X/+Y. Garage on X=0, Chacabuco on Y=0.
# Chamfer ends (2.5,0) / (0,2.5). Street and camera southwest, no fictitious extension.
H, BASE = 4.30, 1.06
footprint = [(2.5,0),(12.6,0),(12.6,10.7),(0,10.7),(0,2.5)]
prism('FLOOR', footprint, 0.11, 0.19, M['inside'], '07_INTERIOR_SCHEMATIC')
prism('ROOF_SLAB', footprint, 4.12, 4.30, M['wall'], '04_ROOF_VISIBLE')
box('BACK_WALL', (6.3,10.6,2.2), (12.6,.2,4.2), M['wall'])
box('SIDE_PARTY_WALL', (12.5,5.35,2.2), (.2,10.7,4.2), M['wall'])

def facebox(name, axis, u, z, width, height, material, depth=.20, offset=0,
            coll='01_ENVELOPE_APPROX'):
    if axis == 'Y':
        return box(name,(u,offset,z),(width,depth,height),material,coll)
    return box(name,(offset,u,z),(depth,width,height),material,coll)

def wallstrip(name, axis, lo, hi, zlo=.19, zhi=H):
    if hi-lo < .001 or zhi-zlo < .001: return
    for a,b,m in [(zlo,min(zhi,BASE),M['base']), (max(zlo,BASE),zhi,M['wall'])]:
        if b > a:
            facebox(name+'_'+str(round(a,2)),axis,(lo+hi)/2,(a+b)/2,hi-lo,b-a,m)

def facade(axis, start, end, openings):
    cursor = start
    for idx,(lo,hi,bottom,top,garage) in enumerate(openings):
        label = ('CHACABUCO' if axis=='Y' else 'GARAGE') + '_' + str(idx+1)
        wallstrip(label+'_PIER',axis,cursor,lo)
        wallstrip(label+'_SILL',axis,lo,hi,.19,bottom)
        wallstrip(label+'_HEADER',axis,lo,hi,top,H)
        w, h, c = hi-lo, top-bottom, (hi+lo)/2
        facebox(label+'_DARK_RECESS',axis,c,(top+bottom)/2,w,h,M['glass'],.035,.07,'02_OPENINGS')
        for u in [lo+.025,hi-.025]:
            facebox(label+'_JAMB',axis,u,(top+bottom)/2,.05,h,M['metal'],.06,-.085,'02_OPENINGS')
        for z in [bottom+.025,top-.025,top-.32]:
            facebox(label+'_RAIL',axis,c,z,w,.05,M['metal'],.06,-.085,'02_OPENINGS')
        # Simplified grille: coarse spacing, no decorative details.
        grate_low = 2.20 if garage else bottom+.04
        grate_high = top-.36
        count = max(2,round(w/.19))
        for j in range(1,count):
            facebox(label+'_BAR_%02d'%j,axis,lo+j*w/count,(grate_low+grate_high)/2,
                    .016,grate_high-grate_low,M['metal'],.025,-.11,'02_OPENINGS')
        if garage:
            for z in [2.2,2.6,3.0,3.4,3.8]:
                if z<top: facebox(label+'_GRID',axis,c,z,w,.018,M['metal'],.035,-.11,'02_OPENINGS')
            for u in [lo+w*.25,lo+w*.75]:
                facebox(label+'_LOWER_GATE_PROXY',axis,u,1.18,.045,2.0,M['metal'],.06,-.10,'02_OPENINGS')
        elif axis=='Y':
            facebox(label+'_CANOPY',axis,c,top+.15,w+.18,.075,M['base'],.36,-.18,'02_OPENINGS')
        cursor=hi
    wallstrip(axis+'_FINAL_PIER',axis,cursor,end)

facade('Y',2.5,12.6,[(3.0,4.48,.58,3.38,False),(5.46,8.13,.58,3.38,False),
                       (9.38,12.03,.56,3.32,False)])
facade('X',2.5,10.7,[(2.94,4.05,.40,3.22,False),(5.00,10.25,.20,3.98,True)])

# True opening in chamfer wall. Sign panel above passage is intentionally unlettered.
# The original logo is missing. This is neither replacement branding nor a new logo.
T=Vector((1/math.sqrt(2),-1/math.sqrt(2),0))
IN=Vector((1/math.sqrt(2),1/math.sqrt(2),0))
C=Vector((1.25,1.25,0))
ANGLE=-math.pi/4
def cornerbox(name,u,z,w,h,material,depth=.20,inset=0,coll='01_ENVELOPE_APPROX'):
    p=C+T*u+IN*inset
    p.z=z
    return box(name,p,(w,depth,h),material,coll,ANGLE)

W=math.sqrt(2)*2.5
DOOR=1.62
for sign in [-1,1]:
    cornerbox('OCHAVA_SIDE_'+str(sign),sign*(W+DOOR)/4,2.23,(W-DOOR)/2,4.14,M['wall'])
cornerbox('OCHAVA_LINTEL',0,3.48,DOOR,1.64,M['wall'])
# Current black trapezoidal surround: thin face, leaving the access truly open.
def cornerpanel(name,uvs):
    verts=[]
    for u,z in uvs:
        p=C+T*u-IN*.112; verts.append((p.x,p.y,z))
    return mesh(name,verts,[tuple(range(len(verts)))],M['black'])
cornerpanel('BLACK_SURROUND_LEFT',[(-1.17,.19),(-.86,.19),(-.86,3.33),(-1.68,3.90)])
cornerpanel('BLACK_SURROUND_RIGHT',[(.86,.19),(1.17,.19),(1.68,3.90),(.86,3.33)])
cornerpanel('BLACK_SURROUND_TOP',[(-1.68,3.90),(1.68,3.90),(.86,3.33),(-.86,3.33)])
cornerbox('SIGN_PANEL_NO_LOGO_ASSET',0,3.0,1.66,.61,M['black'],.08,-.13,'02_OPENINGS')
for u in [-.835,.835]:
    cornerbox('ENTRY_FRAME',u,1.75,.045,3.12,M['metal'],.055,-.14,'02_OPENINGS')
cornerbox('ENTRY_FRAME_TOP',0,3.30,1.71,.045,M['metal'],.055,-.14,'02_OPENINGS')
cornerbox('ENTRY_TRANSOM',0,2.67,1.71,.045,M['metal'],.055,-.14,'02_OPENINGS')
cornerbox('THRESHOLD',0,.19,1.71,.05,M['curb'],.28)
door=cornerbox('DOOR_CLOSED_PROXY_UNKNOWN_MECHANISM',0,1.43,1.62,2.48,M['glass'],.055,.025,'03_DOOR_CLOSED_PROXY')
door['status']='PROXY ONLY — no hinge, track, handle or opening direction assumed.'

# Roof structure visible above garage: three simple triangular bays, not a fabricated showroom.
for y,z in [(5.0,5.25),(10.65,4.58)]:
    beam('UPPER_END_POST',(0.14,y,4.28),(0.14,y,z),.065,M['metal'],'04_ROOF_VISIBLE')
beam('UPPER_SLOPING_TOP',(0.14,5.0,5.25),(0.14,10.65,4.58),.075,M['base'],'04_ROOF_VISIBLE')
mesh('UPPER_OPAQUE_PANEL',[(.16,5,4.3),(.16,10.65,4.3),(.16,10.65,4.58),(.16,5,5.25)],[(0,1,2,3)],M['context'],'04_ROOF_VISIBLE')
for i in range(3):
    a=5+i*1.88; b=a+1.88; mid=(a+b)/2; peak=5.25-(mid-5)*.67/5.65
    beam('ROOF_TRIANGLE_A',(.08,a,4.65),(.08,mid,peak),.045,M['metal'],'04_ROOF_VISIBLE')
    beam('ROOF_TRIANGLE_B',(.08,mid,peak),(.08,b,4.65),.045,M['metal'],'04_ROOF_VISIBLE')
    beam('ROOF_VERTICAL',(.08,a,4.3),(.08,a,4.65),.045,M['metal'],'04_ROOF_VISIBLE')
beam('ROOF_HORIZONTAL',(.08,5,4.65),(.08,10.65,4.65),.045,M['metal'],'04_ROOF_VISIBLE')
box('REAR_ROOF_PARTIAL_MASS',(8.5,4.2,4.6),(4.3,3.0,.6),M['context'],'04_ROOF_VISIBLE')
# Low-poly tank silhouette (approximate placement, needs dimensions).
def cylinder(name,loc,radius,height,material,coll,n=12):
    pts=[(loc[0]+radius*math.cos(i*2*math.pi/n),loc[1]+radius*math.sin(i*2*math.pi/n)) for i in range(n)]
    return prism(name,pts,loc[2]-height/2,loc[2]+height/2,material,coll)
cylinder('WATER_TANK_APPROX',(4.6,4.2,4.91),.46,1.15,M['wall'],'04_ROOF_VISIBLE')
beam('ANTENNA_SILHOUETTE',(4.3,4,4.3),(4.3,4,6.55),.018,M['base'],'04_ROOF_VISIBLE')

# Continuous sidewalk, angled curb and street. No complete city block.
walk=[(-1.65,1.82),(-1.65,14.0),(15.2,14.0),(15.2,-1.65),(1.82,-1.65)]
prism('SIDEWALK_CONTINUOUS',list(reversed(walk)),.0,.145,M['walk'],'05_SIDEWALK_STREET')
box('STREET_PATCH',(2.5,2.5,-.10),(47,47,.16),M['road'],'05_SIDEWALK_STREET')
for a,b in [((-1.65,1.82,.07),(-1.65,14,.07)),((-1.65,1.82,.07),(1.82,-1.65,.07)),((1.82,-1.65,.07),(15.2,-1.65,.07))]:
    beam('YELLOW_CURB',a,b,.13,M['curb'],'05_SIDEWALK_STREET')
# Crossing bars only where the street continuation is visible.
for j in range(5):
    box('CROSSING_STRIPE_%02d'%j,(-3.0-j*.93,1.0,.002),(.46,2.7,.01),M['mark'],'05_SIDEWALK_STREET')

box('NEIGHBOUR_GARAGE_END',(1.8,12.55,3.45),(3.8,3.7,6.6),M['context'],'06_CONTEXT_APPROX')
box('NEIGHBOUR_CHACABUCO_END',(14.0,3,2.25),(2.5,6,4.2),M['context'],'06_CONTEXT_APPROX')
cylinder('UTILITY_POLE_APPROX',(-1.0,2.65,3.45),.115,6.9,M['context'],'06_CONTEXT_APPROX',8)
cylinder('TRAFFIC_POLE_APPROX',(-1.34,2.17,2.6),.055,5.2,M['base'],'06_CONTEXT_APPROX',8)
box('TRAFFIC_LIGHT_PROXY',(-1.34,2.17,3.25),(.23,.20,.70),M['black'],'06_CONTEXT_APPROX')
beam('STREET_LIGHT_ARM',(-1.34,2.17,5.15),(-3.15,2.17,5.50),.07,M['base'],'06_CONTEXT_APPROX')
for y in [2.25,2.6]:
    beam('OVERHEAD_LINE_PROXY',(-10,y,6.4),(12,y,6.7),.013,M['base'],'06_CONTEXT_APPROX')

# Interior is a non-documentary volume proxy, not the actual internal layout.
# Keep the threshold in a large open space, no invented corridor.
box('INTERIOR_FAR_STOP_PROXY',(7.0,7.65,1.95),(10.6,.12,3.5),M['inside'],'07_INTERIOR_SCHEMATIC')
box('INTERIOR_SIMPLE_PLINTH_A',(6.2,3.1,.55),(2.6,1.25,.72),M['base'],'07_INTERIOR_SCHEMATIC')
box('INTERIOR_SIMPLE_PLINTH_B',(3.4,5.8,.55),(1.3,2.7,.72),M['base'],'07_INTERIOR_SCHEMATIC')

def area(name,loc,target,power,color,size):
    d=bpy.data.lights.new('2A_'+name,'AREA'); d.energy=power; d.color=color; d.shape=d.shape; d.size=size
    o=bpy.data.objects.new('2A_'+name,d); COL['08_LIGHTS_TEMP'].objects.link(o)
    o.location=loc; o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    return o
area('SKY_SOFT',(-5,-7,12),(3,3,1.5),2300,(.66,.77,1),12)
area('FACADE_READABILITY',(-7,4,7),(1,4,2),1000,(.74,.82,1),8)
area('INTERIOR_TEMP',(4,4,3.7),(1.2,1.2,1),650,(1,.76,.48),4)
area('INTERIOR_FILL',(5,6,3.5),(7,7,1),420,(1,.82,.60),3)

def camera(name,loc,target,lens=34):
    d=bpy.data.cameras.new('2A_'+name); d.lens=lens; d.clip_start=.05; d.clip_end=150
    o=bpy.data.objects.new('2A_'+name,d); COL['09_CAMERAS'].objects.link(o)
    o.location=loc; o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    o['lens_note']='Fixed focal length, no roll. Preliminary framing.'
    return o
camera('CAM_A_BALANCED',(-11.7,-12.1,1.78),(3.25,3.35,2.48),34)
camera('CAM_B_CHACABUCO',(-8.0,-14.7,1.78),(4.0,2.6,2.38),34)
camera('CAM_C_GARAGE',(-14.0,-8.0,1.78),(2.6,4.1,2.46),34)
s.camera=bpy.data.objects['2A_CAM_A_BALANCED']
s.frame_set(1)
for screen in bpy.data.screens:
    for a in screen.areas:
        if a.type == 'VIEW_3D':
            a.spaces.active.region_3d.view_perspective='CAMERA'
            a.spaces.active.shading.type='MATERIAL'

readme=bpy.data.texts.new('READ_ME_2A.txt')
readme.write('RP USADOS — STAGE 2A ONLY\nCurrent owner photos control form. All dimensions provisional.\nScene RP_2A_CLOSED contains a closed door proxy, NO invented opening mechanism.\nNo original logo recreation. The sign is intentionally a plain proxy.\nOriginal scene preserved: '+original_scene.name+'\nInterior back wall and blocks are only depth cues, NOT confirmed layout.\n')
print(json.dumps({'scene':s.name,'objects':len(s.objects),'mesh_objects':sum(o.type=='MESH' for o in s.objects),'original_preserved':original_scene.name,'dimensions_approx':True}))
