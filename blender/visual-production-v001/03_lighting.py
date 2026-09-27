"""Blue-hour lighting study, Cycles reference render. No bloom/compositor effects."""
import bpy,json,traceback
from pathlib import Path
from mathutils import Vector
ROOT=Path(r'C:/Users/dante.DESKTOP/Desktop/rp-usados-gpt/rp-usados/blender/visual-production-v001')
OUT=ROOT/'review'; OUT.mkdir(exist_ok=True)
s=bpy.data.scenes['RP_VISUAL_01_APPROVED_CAMERA'];bpy.context.window.scene=s
assert not s.get('lighting_v1_done')
for o in s.objects:
    if o.type=='LIGHT':o.hide_render=True;o.hide_set(True)
c=bpy.data.collections.new('VIS_LIGHT_RIG');s.collection.children.link(c)
def area(name,loc,target,power,color,size,other=None):
    d=bpy.data.lights.new('VIS_'+name,'AREA');d.energy=power;d.color=color;d.size=size
    if other is not None:d.shape='RECTANGLE';d.size_y=other
    o=bpy.data.objects.new('VIS_'+name,d);c.objects.link(o)
    o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
    o['note']='Art-directed photographic light; not a claim of installed hardware.'
    return o
area('BLUE_SKY_SOFTBOX',(-3,-5,13),(4,4,0),1500,(.48,.64,1.0),15)
area('STREET_BOUNCE',(3,-8,5),(4,1,2),550,(.74,.82,1),9)
area('GARAGE_SIDE_KEY',(-5,6,6),(0,5,2.4),950,(.70,.79,1),7)
area('WARM_INTERIOR_MAIN',(3.0,3.1,3.75),(1,1,.3),480,(1,.72,.44),2.7)
area('WARM_INTERIOR_REAR',(6,5.8,3.7),(4,3,.6),350,(1,.79,.59),3.2)
area('SIGN_SOFT_ACCENT',(-.2,-.3,4.15),(1.1,1.1,3.0),65,(1,.88,.72),1.8,.35)
area('INTERIOR_GARAGE',(1.0,7.2,3.7),(0,7.5,1.2),260,(1,.80,.57),2.6)
# Cool world radiance. Black access paint stays black under photographic light.
s.world=s.world.copy();s.world.name='VIS_BLUE_HOUR_WORLD'
bg=next(n for n in s.world.node_tree.nodes if n.type=='BACKGROUND')
bg.inputs['Color'].default_value=(.085,.145,.27,1);bg.inputs['Strength'].default_value=.28
try:s.render.engine='CYCLES'
except TypeError as e:raise RuntimeError(str(e))
prefs=bpy.context.preferences.addons['cycles'].preferences
prefs.get_devices()
for d in prefs.devices:d.use=d.type!='CPU'
s.cycles.device='GPU' if any(d.use for d in prefs.devices) else 'CPU'
s.cycles.samples=64;s.cycles.use_denoising=True
s.cycles.max_bounces=8;s.cycles.transmission_bounces=6
s.render.resolution_x=1440;s.render.resolution_y=844;s.render.resolution_percentage=100
s.render.image_settings.file_format='PNG';s.render.image_settings.media_type='IMAGE'
s.render.film_transparent=False
s.view_settings.exposure=0
s.frame_set(1)
s['lighting_v1_done']=True
s['light_transfer_note']='Area lights are Blender reference lighting, not glTF punctual lights. Later web must bake indirect light and recreate direct rig/environment.'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'RP_Usados_Hero_Visual_v001.blend'))
def test_render():
    status=OUT/'render-status.json'
    status.write_text(json.dumps({'status':'rendering','pass':'first light'}))
    try:
        s.render.filepath=str(OUT/'A-initial-test.png');bpy.ops.render.render(write_still=True)
        status.write_text(json.dumps({'status':'complete','pass':'first light'}))
    except Exception:status.write_text(json.dumps({'status':'error','detail':traceback.format_exc()}))
    return None
bpy.app.timers.register(test_render,first_interval=2)
print(json.dumps({'engine':s.render.engine,'device':s.cycles.device,'compute':prefs.compute_device_type,'lights':len(c.objects),'render_queued':True}))
