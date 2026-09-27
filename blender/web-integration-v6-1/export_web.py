"""Run against the approved source with Blender --background --disable-autoexec.
Writes a separate working copy and reproducible web assets; never saves source.
"""
import bpy, json, math, hashlib, time
from pathlib import Path
from mathutils import Quaternion

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'theme/rp-usados/assets/hero/v6-1'
WORK = Path(__file__).resolve().parent
OUT.mkdir(parents=True, exist_ok=True)
scene = bpy.context.scene
source = Path(bpy.data.filepath)
report = {'source': str(source), 'sourceSHA256': hashlib.sha256(source.read_bytes()).hexdigest(),
          'blender': bpy.app.version_string, 'excluded': [], 'bakedBaseColor': [], 'warnings': []}

def status(message):
    print('RP_WEB: ' + message, flush=True)
    (WORK / 'status.txt').write_text(message, encoding='utf-8')

def write_report():
    (WORK / 'export-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')

prefs = bpy.context.preferences.addons['cycles'].preferences
try:
    prefs.compute_device_type = 'OPTIX'
    prefs.get_devices()
    for device in prefs.devices:
        device.use = device.type == 'OPTIX'
    scene.cycles.device = 'GPU'
except Exception as error:
    report['warnings'].append('GPU unavailable: ' + str(error))
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.render.resolution_percentage = 100
scene.render.resolution_x = 1600
scene.render.resolution_y = 900
scene.frame_set(1)
bpy.context.view_layer.update()
camera = scene.camera
report['camera'] = {'name': camera.name, 'lens': camera.data.lens,
                    'sensorWidth': camera.data.sensor_width, 'shiftX': camera.data.shift_x,
                    'shiftY': camera.data.shift_y, 'aspect': 16/9}
report['timeline'] = {'start': scene.frame_start, 'end': scene.frame_end,
                      'fps': scene.render.fps, 'durationSeconds': 3, 'sampleSpanSeconds': 71/24}
report['colorManagement'] = {'view': scene.view_settings.view_transform,
                            'look': scene.view_settings.look, 'exposure': scene.view_settings.exposure}

status('Rendering original first frame for fallback')
scene.render.image_settings.media_type = 'IMAGE'
scene.render.image_settings.file_format = 'WEBP'
scene.render.image_settings.quality = 92
scene.render.filepath = str(OUT / 'poster.webp')
if not (OUT / 'poster.webp').exists():
    bpy.ops.render.render(write_still=True)

# Preserve evaluated camera constraints at every original frame, not a new trajectory.
samples = []
for frame in range(1, 73):
    scene.frame_set(frame)
    bpy.context.view_layer.update()
    samples.append(camera.evaluated_get(bpy.context.evaluated_depsgraph_get()).matrix_world.copy())
camera.animation_data_clear()
camera.constraints.clear()
camera.parent = None
camera.rotation_mode = 'QUATERNION'
last_q = None
for frame, matrix in enumerate(samples, 1):
    location, rotation, scale = matrix.decompose()
    if last_q and last_q.dot(rotation) < 0:
        rotation.negate()
    last_q = rotation.copy()
    camera.location, camera.rotation_quaternion, camera.scale = location, rotation, scale
    camera.keyframe_insert('location', frame=frame)
    camera.keyframe_insert('rotation_quaternion', frame=frame)
camera.animation_data.action.name = 'RP_Hero_Approved_72_Frames'
scene.frame_set(1)
bpy.context.view_layer.update()

# Render the source world to a linear HDR; no replacement sky or external asset.
status('Baking original world to HDR environment')
hidden = {o: o.hide_render for o in scene.objects}
for obj in scene.objects:
    obj.hide_render = True
env_data = bpy.data.cameras.new('WEB_Environment_Bake')
env_camera = bpy.data.objects.new('WEB_Environment_Bake', env_data)
scene.collection.objects.link(env_camera)
env_data.type = 'PANO'
env_data.panorama_type = 'EQUIRECTANGULAR'
# Panorama looking along +Y, up +Z, corresponding to the glTF world conversion.
env_camera.rotation_euler = (math.pi / 2, 0, 0)
scene.camera = env_camera
scene.render.resolution_x, scene.render.resolution_y = 1024, 512
scene.cycles.samples = 8
scene.render.image_settings.file_format = 'HDR'
scene.render.filepath = str(OUT / 'environment.hdr')
if not (OUT / 'environment.hdr').exists():
    bpy.ops.render.render(write_still=True)
scene.camera = camera
bpy.data.objects.remove(env_camera, do_unlink=True)
for obj, value in hidden.items():
    obj.hide_render = value
scene.render.resolution_x, scene.render.resolution_y = 1600, 900

# Explicit source UVs keep existing maps stable when adding a bake UV channel.
for mat in bpy.data.materials:
    if not mat.use_nodes:
        continue
    tree = mat.node_tree
    for node in list(tree.nodes):
        if node.type == 'TEX_COORD' and node.outputs['UV'].is_linked:
            uv = tree.nodes.new('ShaderNodeUVMap')
            uv.uv_map = 'UVMap'
            for link in list(node.outputs['UV'].links):
                tree.links.new(uv.outputs['UV'], link.to_socket)

complex_objects = [o for o in scene.objects if o.type == 'MESH' and any(
    m and m.use_nodes and any(n.type == 'MIX' for n in m.node_tree.nodes) for m in o.data.materials)]
scene.cycles.samples = 1
scene.render.bake.margin = 4
scene.render.bake.use_clear = True
scene.render.bake.use_selected_to_active = False
for index, obj in enumerate(complex_objects):
    status(f'Baking base color {index+1}/{len(complex_objects)}: {obj.name}')
    bpy.ops.object.select_all(action='DESELECT')
    obj.hide_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    uv = obj.data.uv_layers.new(name='WEB_BaseColor')
    uv_name = uv.name
    obj.data.uv_layers.active = uv
    uv.active_render = True
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.025)
    bpy.ops.object.mode_set(mode='OBJECT')
    size = 1024
    atlas = bpy.data.images.new('WEB_BaseColor_' + obj.name, width=size, height=size, alpha=False)
    atlas.colorspace_settings.name = 'sRGB'
    restore = []
    for slot in obj.material_slots:
        if not slot.material or not slot.material.use_nodes:
            continue
        slot.material = slot.material.copy()
        mat = slot.material
        tree = mat.node_tree
        bsdf = next((n for n in tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        output = next((n for n in tree.nodes if n.type == 'OUTPUT_MATERIAL' and n.is_active_output), None)
        if not bsdf or not output:
            raise RuntimeError('Unrecognized material for bake: ' + mat.name)
        base = bsdf.inputs['Base Color']
        is_complex = base.is_linked and base.links[0].from_node.type in ['MIX', 'MIX_RGB']
        old_surface = output.inputs['Surface'].links[0].from_socket
        emission = tree.nodes.new('ShaderNodeEmission')
        if base.is_linked:
            tree.links.new(base.links[0].from_socket, emission.inputs['Color'])
        else:
            emission.inputs['Color'].default_value = base.default_value
        tree.links.new(emission.outputs[0], output.inputs['Surface'])
        target = tree.nodes.new('ShaderNodeTexImage')
        target.image = atlas
        tree.nodes.active = target
        restore.append((mat, bsdf, output, old_surface, emission, target, is_complex))
    bpy.ops.object.bake(type='EMIT')
    atlas.filepath_raw = str(WORK / (atlas.name + '.png'))
    atlas.file_format = 'PNG'
    atlas.save()
    atlas.pack()
    for mat, bsdf, output, old_surface, emission, target, is_complex in restore:
        tree = mat.node_tree
        tree.links.new(old_surface, output.inputs['Surface'])
        tree.nodes.remove(emission)
        if is_complex:
            uv_node = tree.nodes.new('ShaderNodeUVMap')
            uv_node.uv_map = uv_name
            tree.links.new(uv_node.outputs['UV'], target.inputs['Vector'])
            tree.links.new(target.outputs['Color'], bsdf.inputs['Base Color'])
        else:
            tree.nodes.remove(target)
    # Export default maps from their original UV channel.
    obj.data.uv_layers[0].active_render = True
    report['bakedBaseColor'].append({'object': obj.name, 'size': size, 'uv': uv_name})

status('Preparing export selection and source light metadata')
area_lights = []
for obj in scene.objects:
    if obj.type == 'LIGHT' and obj.data.type == 'AREA' and not obj.hide_render:
        light = obj.data
        area_lights.append({'name': obj.name, 'matrix': [v for row in obj.matrix_world for v in row],
                            'color': list(light.color), 'powerWatts': light.energy,
                            'width': light.size, 'height': light.size_y if light.shape in ['RECTANGLE','ELLIPSE'] else light.size,
                            'shape': light.shape, 'normalize': light.normalize})
report['areaLights'] = area_lights
bpy.ops.object.select_all(action='DESELECT')
selected = []
for obj in list(scene.objects):
    include = not obj.hide_render and (
        obj.type == 'MESH' or obj == camera or
        (obj.type == 'CURVE' and obj.data.bevel_depth > 0) or
        (obj.type == 'LIGHT' and obj.data.type in ['SUN','SPOT','POINT'] and obj.data.energy > 0))
    if obj.name.startswith('Farol_Barrio_') and math.hypot(obj.location.x, obj.location.y) > 40:
        include = False
    if not include:
        report['excluded'].append(obj.name)
        continue
    if obj.type == 'CURVE':
        evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
        mesh = bpy.data.meshes.new_from_object(evaluated)
        replacement = bpy.data.objects.new(obj.name + '_WEB', mesh)
        scene.collection.objects.link(replacement)
        replacement.matrix_world = obj.matrix_world.copy()
        obj.hide_render = True
        obj = replacement
    obj.hide_set(False)
    obj.select_set(True)
    selected.append(obj)
bpy.context.view_layer.objects.active = camera
scene.frame_set(1)
metadata = {'camera': report['camera'], 'timeline': report['timeline'],
            'colorManagement': report['colorManagement'], 'areaLights': area_lights}
(OUT / 'scene.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(WORK / 'RP_Usados_Hero_v6_1_WEB.blend'))
status('Exporting GLB with camera and existing door animation')
bpy.ops.export_scene.gltf(filepath=str(OUT / 'hero.glb'), export_format='GLB',
    use_selection=True, export_cameras=True, export_lights=True,
    export_animations=True, export_animation_mode='SCENE', export_frame_range=True,
    export_force_sampling=True, export_bake_animation=True, export_apply=True,
    export_extras=False, export_yup=True, export_image_format='AUTO',
    export_import_convert_lighting_mode='SPEC')
report['files'] = {p.name: p.stat().st_size for p in OUT.iterdir() if p.is_file()}
report['sourceUnchanged'] = hashlib.sha256(source.read_bytes()).hexdigest() == report['sourceSHA256']
write_report()
status('Complete')
