"""Blender-native albedo baking: photo-derived microvariation, neutral reference colors.
The production shaders receive only bitmap textures and Principled BSDF.
No owner photograph is edited.
"""
import bpy, json, traceback
from pathlib import Path
ROOT=Path(r'C:/Users/dante.DESKTOP/Desktop/rp-usados-gpt/rp-usados/blender/visual-production-v001')
s=bpy.data.scenes['RP_VISUAL_01_APPROVED_CAMERA'];bpy.context.window.scene=s
assert not s.get('paint_bake_done')
def do_bake():
    status=ROOT/'review'/'render-status.json';status.write_text(json.dumps({'status':'baking'}))
    temp=[]
    try:
        for o in bpy.context.selected_objects:o.select_set(False)
        mesh=bpy.data.meshes.new('TEMP_BAKE_PLANE');mesh.from_pydata([(0,0,0),(1,0,0),(1,1,0),(0,1,0)],[],[(0,1,2,3)]);mesh.update()
        uv=mesh.uv_layers.new()
        for i,coord in enumerate([(0,0),(1,0),(1,1),(0,1)]):uv.data[i].uv=coord
        ob=bpy.data.objects.new('TEMP_BAKE_PLANE',mesh);s.collection.objects.link(ob);ob.location=(0,0,-30);temp.append(ob)
        ob.select_set(True);bpy.context.view_layer.objects.active=ob
        src=bpy.data.images.load(str(ROOT/'textures'/'painted_plaster_wall_diff_1k.jpg'),check_existing=True)
        m=bpy.data.materials.new('TEMP_BAKE_SHADER');m.use_nodes=True;mesh.materials.append(m)
        nt=m.node_tree;nt.nodes.clear()
        output=nt.nodes.new('ShaderNodeOutputMaterial');emit=nt.nodes.new('ShaderNodeEmission');nt.links.new(emit.outputs[0],output.inputs['Surface'])
        image=nt.nodes.new('ShaderNodeTexImage');image.image=src
        gray=nt.nodes.new('ShaderNodeRGBToBW');nt.links.new(image.outputs['Color'],gray.inputs[0])
        mult=nt.nodes.new('ShaderNodeMath');mult.operation='MULTIPLY';mult.inputs[1].default_value=.22;nt.links.new(gray.outputs[0],mult.inputs[0])
        add=nt.nodes.new('ShaderNodeMath');add.operation='ADD';add.inputs[1].default_value=.90;nt.links.new(mult.outputs[0],add.inputs[0])
        tint=nt.nodes.new('ShaderNodeMixRGB');tint.blend_type='MULTIPLY';tint.inputs[0].default_value=1;nt.links.new(add.outputs[0],tint.inputs[1]);nt.links.new(tint.outputs[0],emit.inputs['Color'])
        target=nt.nodes.new('ShaderNodeTexImage');nt.nodes.active=target
        outputs=[]
        for name in ['VIS_01_PAINT_LIGHT_GREY','VIS_02_PAINT_CHARCOAL','VIS_03_BLACK_CORNER_PAINT']:
            dest=bpy.data.materials[name];p=next(n for n in dest.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
            tint.inputs[2].default_value=p.inputs['Base Color'].default_value[:]
            im=bpy.data.images.new(name+'_ALBEDO',width=1024,height=1024,alpha=False);target.image=im
            bpy.ops.object.bake(type='EMIT',use_clear=True,margin=2)
            im.filepath_raw=str(ROOT/'textures'/(name+'_albedo.png'));im.file_format='PNG';im.save()
            t=dest.node_tree.nodes.new('ShaderNodeTexImage');t.image=im;dest.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
            outputs.append(im.filepath_raw)
        ob.select_set(False);bpy.data.objects.remove(ob,do_unlink=True);temp.clear()
        bpy.data.materials.remove(m);bpy.data.meshes.remove(mesh)
        s['paint_bake_done']=True
        (ROOT/'textures'/'baked-paint.json').write_text(json.dumps({'source':'https://polyhaven.com/a/painted_plaster_wall','license':'CC0','method':'Blender emission bake, subdued luminance modulation around owner-photo-based paint colors','outputs':outputs},indent=2))
        bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'RP_Usados_Hero_Visual_v001.blend'))
        status.write_text(json.dumps({'status':'complete','pass':'paint baked'}))
    except Exception:status.write_text(json.dumps({'status':'error','detail':traceback.format_exc()}))
    finally:
        for ob in temp:bpy.data.objects.remove(ob,do_unlink=True)
    return None
bpy.app.timers.register(do_bake,first_interval=2)
print('Three paint albedo maps queued for Blender-native bake.')
