"""Second MCP step: camera alternatives and explicitly provisional entry rehearsal."""
import bpy, math, json
from pathlib import Path
from mathutils import Vector

OUT=Path(r'C:/Users/dante.DESKTOP/Desktop/rp-usados-gpt/rp-usados/blender/stage-2a')
s=bpy.data.scenes['RP_2A_CLOSED']
assert 'RP_2A_PATH_OPEN_PROVISIONAL' not in bpy.data.scenes
path=s.copy()
path.name='RP_2A_PATH_OPEN_PROVISIONAL'
path.collection.children.unlink(bpy.data.collections['2A_03_DOOR_CLOSED_PROXY'])
path['door']='ACCESS FREE ONLY FOR CAMERA REHEARSAL. Not an opening animation.'
path['interior']='Schematic depth cues ONLY. Actual internal layout unverified.'
path.frame_end=289
s.frame_end=289

C=Vector((1.25,1.25,0))
N=Vector((1/math.sqrt(2),1/math.sqrt(2),0))
T=Vector((1/math.sqrt(2),-1/math.sqrt(2),0))
start=bpy.data.objects['2A_CAM_A_BALANCED']
cam=start.copy(); cam.data=start.data.copy(); cam.name='2A_CAM_PATH_A_12S_REHEARSAL'
bpy.data.collections['2A_09_CAMERAS'].objects.link(cam)
path.camera=cam
cam.rotation_mode=cam.rotation_mode
cam['time_note']='12-second review only. No scroll timing has been approved.'
cam['crossing_note']='Door absent in rehearsal scene. Mechanism remains pending.'
d0=(start.location-C).dot(N)
side0=(start.location-C).dot(T)
knots=[(0,d0,0),(1.8,-16.3,2.4),(5.0,-7.7,2.2),(7.6,-2.9,1.35),
       (9.2,-.75,.9),(10.8,.30,.45),(12,.75,0)]

def distance(t):
    for (a,p,v),(b,q,w) in zip(knots,knots[1:]):
        if a <= t <= b+1e-7:
            u=(t-a)/(b-a)
            return (2*u**3-3*u**2+1)*p+(u**3-2*u**2+u)*(b-a)*v+(-2*u**3+3*u**2)*q+(u**3-u**2)*(b-a)*w
    return knots[-1][1]

samples=[]
for frame in range(1,290):
    t=(frame-1)/24
    u=t/12
    blend=min(1,t/7.0); blend=blend*blend*(3-2*blend)
    loc=C+N*distance(t)+T*side0*(1-blend)
    loc.z=1.78
    target=Vector((3.25,3.35,2.48)).lerp(C+N*4.5+Vector((0,0,1.86)),blend)
    cam.location=loc
    cam.rotation_euler=(target-loc).to_track_quat('-Z','Y').to_euler()
    cam.keyframe_insert(data_path='location',frame=frame)
    cam.keyframe_insert(data_path='rotation_euler',frame=frame)
    samples.append({'frame':frame,'seconds':round(t,4),'distance_to_threshold_m':round(distance(t),4),'position':list(loc)})
# Per-frame transforms deliberately baked. No constraints, camera rail, drivers or modifiers.
action=cam.animation_data.action
for layer in action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for fc in bag.fcurves:
                for k in fc.keyframe_points: k.interpolation='LINEAR'

for scene in [s,path]:
    for frame,label in [(1,'01 EXTERIOR'),(109,'02 APPROACH'),(193,'03 ACCESS'),
                        (235,'04 BEFORE THRESHOLD'),(250,'05 CROSSING PROVISIONAL'),(289,'06 INSIDE 0.75 M')]:
        m=scene.timeline_markers.new(label,frame=frame)

def addcam(name,position,target,lens=34):
    data=bpy.data.cameras.new(name); data.lens=lens; data.clip_start=.05; data.clip_end=150
    ob=bpy.data.objects.new(name,data)
    bpy.data.collections['2A_09_CAMERAS'].objects.link(ob)
    ob.location=position; ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
    return ob

close=addcam('2A_CAM_D_ACCESS_CLOSED',C-N*8.0+Vector((0,0,1.78)),C+Vector((0,0,2.18)),34)
plan=addcam('2A_CAM_PLAN_REFERENCE',(3,2,27),(3,2,0),30)
plan['purpose']='Spatial inspection only, NOT the hero trajectory.'
path.frame_set(1)
bpy.context.window.scene=s
s.camera=start
s.frame_set(1)
speeds=[(Vector(b['position'])-Vector(a['position'])).length*24 for a,b in zip(samples,samples[1:])]
crossing=next(x for x in samples if x['distance_to_threshold_m']>=0)
report={'stage':'2A','assumed_units':'meters; all building dimensions unmeasured',
        'camera':'A / 34mm / fixed eye height 1.78m over street',
        'duration_seconds':12,'frames':289,'fps':24,'inside_depth_m':.75,
        'crossing_frame':crossing['frame'],'max_speed_m_s':max(speeds),
        'door_mechanism':'[dato pendiente — confirmar con el cliente]',
        'samples':samples}
(OUT/'camera-path.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
bpy.data.texts['READ_ME_2A.txt'].write('\nCamera A / 34 mm / 12-second review, 289 frames at 24 fps.\nScene RP_2A_PATH_OPEN_PROVISIONAL omits the closed door collection only.\nFinal camera 0.75 m inside. NOT a documented interior.\n')
print(json.dumps({k:v for k,v in report.items() if k!='samples'},indent=2))
