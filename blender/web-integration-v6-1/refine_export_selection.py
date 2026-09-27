"""Re-export the existing web working copy, excluding remote background lights."""
import bpy, math, json
from pathlib import Path
WORK = Path(__file__).resolve().parent
OUT = WORK.parents[1] / 'theme/rp-usados/assets/hero/v6-1'
report = json.loads((WORK/'export-report.json').read_text(encoding='utf-8'))
for o in bpy.context.scene.objects:
    if o.name.startswith('Farol_Barrio_') and math.hypot(o.location.x,o.location.y)>40:
        o.select_set(False)
        if o.name not in report['excluded']:
            report['excluded'].append(o.name)
bpy.context.scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(WORK/'RP_Usados_Hero_v6_1_WEB.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'hero.glb'),export_format='GLB',use_selection=True,
    export_cameras=True,export_lights=True,export_animations=True,export_animation_mode='SCENE',
    export_frame_range=True,export_force_sampling=True,export_bake_animation=True,export_apply=True,
    export_extras=False,export_yup=True,export_image_format='AUTO',export_import_convert_lighting_mode='SPEC')
report['files']={p.name:p.stat().st_size for p in OUT.iterdir() if p.is_file()}
(WORK/'export-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
