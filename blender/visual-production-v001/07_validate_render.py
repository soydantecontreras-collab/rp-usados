"""Validate camera invariance, material portability and counts; render review only."""
import bpy,json,math,traceback,time
from pathlib import Path
from mathutils import Vector
ROOT=Path(r'C:/Users/dante.DESKTOP/Desktop/rp-usados-gpt/rp-usados/blender/visual-production-v001');OUT=ROOT/'review'
s=bpy.data.scenes['RP_VISUAL_01_APPROVED_CAMERA'];bpy.context.window.scene=s
reference=json.loads((ROOT/'camera-original.json').read_text())
collisions=[];previous=None
for item in reference:
    s.frame_set(item['frame']);bpy.context.view_layer.update()
    err=(s.camera.location-Vector(item['location'])).length
    assert err<1e-7
    assert max(abs(a-b) for a,b in zip(s.camera.rotation_euler,item['rotation']))<1e-7
    assert s.camera.data.lens==item['lens']
    loc=s.camera.matrix_world.translation.copy()
    if previous is not None:
        d=loc-previous
        if d.length>1e-6:
            hit,p,n,idx,obj,matrix=s.ray_cast(bpy.context.evaluated_depsgraph_get(),previous,d.normalized(),distance=d.length)
            if hit and not obj.hide_render:collisions.append({'frame':item['frame'],'object':obj.name})
    previous=loc
assert not collisions,collisions
s.frame_set(1);bpy.context.view_layer.update()
meshes=[o for o in s.objects if o.type=='MESH' and not o.hide_render]
dg=bpy.context.evaluated_depsgraph_get();triangles=0;vertices=0
for o in meshes:
    evaluated=o.evaluated_get(dg);me=evaluated.to_mesh();me.calc_loop_triangles()
    triangles+=len(me.loop_triangles);vertices+=len(me.vertices);evaluated.to_mesh_clear()
materials={slot.material for o in meshes for slot in o.material_slots if slot.material}
images={n.image for m in materials if m.use_nodes for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image}
stats={'visible_duration_seconds':85/24,'visible_frame_range':[1,85],'fps':24,
 'all_115_camera_samples_unchanged':True,'centerline_collisions':collisions,
 'visible_mesh_objects':len(meshes),'evaluated_triangles':triangles,'evaluated_vertices':vertices,
 'used_materials':len(materials),'used_texture_maps':len(images),
 'texture_files_bytes':sum(Path(bpy.path.abspath(i.filepath)).stat().st_size for i in images),
 'texture_rgba8_with_mipmaps_estimate_bytes':sum(i.size[0]*i.size[1]*4*4/3 for i in images),
 'geometry_vertex32_index32_estimate_bytes':vertices*32+triangles*3*4,
 'mesh_scales_not_one':[o.name for o in meshes if any(abs(v-1)>1e-6 for v in o.scale)],
 'texture_dimensions':{i.name:list(i.size) for i in images},
 'material_node_types':sorted({n.type for m in materials for n in m.node_tree.nodes}),
 'limits':['PBR shader structure checked; browser rendering not tested.','Area lights and blue-hour world must be baked/recreated for web.','No original logo, confirmed door mechanism or measured survey.','Diagnostic frames105/115 do not extend the approved visible movie.']}
assert not stats['mesh_scales_not_one']
assert not any(t in stats['material_node_types'] for t in ['TEX_NOISE','TEX_VORONOI','BUMP'])
(ROOT/'validation.json').write_text(json.dumps(stats,indent=2))
s['validation']='Camera identical at all115 samples; visible timeline ends85; no centerline collisions; scales1.'
s['approval_status']='Visual work in progress: original signage and interior/door references pending. Not approved for web.'
s.cycles.samples=96
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'RP_Usados_Hero_Visual_v001.blend'))
print(json.dumps(stats,indent=2))

def render_review():
    status=OUT/'render-status.json'
    def report(**kw):status.write_text(json.dumps(kw))
    try:
        bpy.context.window.scene=s
        for frame,name in [(1,'A-initial'),(43,'B-middle'),(85,'C-arrival'),(105,'D-before-threshold-DIAGNOSTIC'),(115,'E-inside-20cm-DIAGNOSTIC')]:
            report(status='rendering',item=name,frame=frame)
            s.frame_set(frame);bpy.context.view_layer.update();s.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
        lab=bpy.data.scenes['RP_MATERIALS_NEUTRAL_REVIEW'];bpy.context.window.scene=lab
        report(status='rendering',item='F-materials')
        lab.render.filepath=str(OUT/'F-materials.png');bpy.ops.render.render(write_still=True)
        bpy.context.window.scene=s;s.frame_set(43)
        warm=[bpy.data.objects['VIS_'+n] for n in ['WARM_INTERIOR_MAIN','WARM_INTERIOR_REAR','INTERIOR_GARAGE','SIGN_SOFT_ACCENT']]
        for light in warm:light.hide_render=True
        report(status='rendering',item='G-cool-light-only')
        s.render.filepath=str(OUT/'G-cool-light-only.png');bpy.ops.render.render(write_still=True)
        for light in warm:light.hide_render=False
        # Same scene and camera, reduced review resolution/samples only.
        report(status='rendering',item='movie',frames=85)
        s.frame_set(1);s.render.resolution_x=960;s.render.resolution_y=562;s.cycles.samples=24
        s.render.image_settings.media_type='VIDEO';s.render.image_settings.file_format='FFMPEG'
        s.render.ffmpeg.format='MPEG4';s.render.ffmpeg.codec='H264';s.render.ffmpeg.constant_rate_factor='HIGH'
        s.render.filepath=str(OUT/'RP-visual-v001-3_54s.mp4');bpy.ops.render.render(animation=True)
        report(status='complete',movie_duration_seconds=85/24,stills=7)
    except Exception:report(status='error',detail=traceback.format_exc())
    finally:
        bpy.context.window.scene=s;s.frame_set(1);s.render.resolution_x=1440;s.render.resolution_y=844;s.cycles.samples=96
        s.render.image_settings.media_type='IMAGE';s.render.image_settings.file_format='PNG'
        for name in ['WARM_INTERIOR_MAIN','WARM_INTERIOR_REAR','INTERIOR_GARAGE','SIGN_SOFT_ACCENT']:bpy.data.objects['VIS_'+name].hide_render=False
    return None
bpy.app.timers.register(render_review,first_interval=2)
