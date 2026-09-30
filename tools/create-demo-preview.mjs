// Generates a separate, local-only WordPress Playground blueprint. No QA data
// enters the normal site, theme, or published preview.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'tools/.preview/rich-demo');
await mkdir(output, { recursive: true });
const images = {};
for (const name of ['landscape', 'portrait', 'square', 'wide']) {
  images[name] = { ext:'png', mime:'image/png', data:(await readFile(resolve(root, `tools/demo-fixtures/${name}.png`))).toString('base64') };
}
for (const name of ['vento-side', 'vento-rear', 'vento-front']) {
  images[name] = { ext:'jpg', mime:'image/jpeg', data:(await readFile(resolve(root, `tools/demo-fixtures/${name}.jpg`))).toString('base64') };
}
const records = [
  { slug:'demo-vento', brand:'Volkswagen', model:'Vento', version:'Highline', year:'2019', km:'62000', state:'disponible', image:'vento-side', gallery:['vento-side','vento-rear','vento-front','portrait'] },
  { slug:'demo-hilux', brand:'Toyota', model:'Hilux', version:'SRV 4x4', year:'2021', km:'41000', state:'reservado', image:'portrait', gallery:['portrait','landscape'] },
  { slug:'demo-cronos', brand:'Fiat', model:'Cronos', version:'Precision', year:'2022', km:'28000', state:'disponible', image:'wide' },
  { slug:'demo-fit', brand:'Honda', model:'Fit', version:'EXL', year:'2018', km:'84000', state:'disponible', image:'square' },
  { slug:'demo-duster', brand:'Renault', model:'Duster', version:'', year:'2020', km:'', state:'disponible', image:'landscape' },
  { slug:'demo-208', brand:'Peugeot', model:'208', version:'Allure', year:'2023', km:'19000', state:'reservado', image:'wide' },
  { slug:'demo-ranger', brand:'Ford', model:'Ranger', version:'XLT', year:'2020', km:'71000', state:'disponible', image:'portrait' },
  { slug:'demo-kicks', brand:'Nissan', model:'Kicks', version:'Advance', year:'2022', km:'36000', state:'disponible', image:'square' },
  { slug:'demo-onix', brand:'Chevrolet', model:'Onix', version:'LTZ', year:'2021', km:'48000', state:'disponible', image:'landscape' },
  { slug:'demo-vendido', brand:'Toyota', model:'Corolla', version:'XEi', year:'2019', km:'56000', state:'vendido', image:'square' },
];
const json64 = value => Buffer.from(JSON.stringify(value)).toString('base64');
const code = `<?php
require '/wordpress/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/image.php';
if (get_option('rp_local_demo_seeded')) return;
$images = json_decode(base64_decode('${json64(images)}'), true);
$records = json_decode(base64_decode('${json64(records)}'), true);
$uploads = wp_upload_dir();
$image_ids = [];
foreach ($images as $name => $image) {
  $file = $uploads['path'] . '/demo-' . $name . '.' . $image['ext'];
  file_put_contents($file, base64_decode($image['data']));
  $id = wp_insert_attachment(['post_mime_type'=>$image['mime'],'post_title'=>'DEMO VISUAL — medio ' . $name,'post_status'=>'inherit'], $file);
  if (is_wp_error($id)) throw new Exception($id->get_error_message());
  wp_update_attachment_metadata($id, wp_generate_attachment_metadata($id, $file));
  update_post_meta($id, '_wp_attachment_image_alt', 'Fotografía o patrón de prueba ' . $name . ' — NO ES STOCK REAL');
  $image_ids[$name] = $id;
}
foreach (array_reverse($records) as $record) {
  $title = 'DEMO VISUAL — ' . $record['brand'] . ' ' . $record['model'];
  $id = wp_insert_post(['post_type'=>'vehiculo','post_status'=>'publish','post_name'=>$record['slug'],
    'post_title'=>$title,
    'post_content'=>'DEMO VISUAL / DATOS DE DESARROLLO. Esta unidad y sus fotografías de prueba no representan stock real de RP Usados.']);
  if (is_wp_error($id)) throw new Exception($id->get_error_message());
  foreach (['rp_marca'=>$record['brand'],'rp_modelo'=>$record['model'] . ' · DEMO','rp_version'=>$record['version'],
    'rp_anio'=>$record['year'],'rp_kilometraje'=>$record['km'],'rp_estado_stock'=>$record['state'],
    'rp_precio_monto'=>'12345.67','rp_precio_moneda'=>'TST'] as $key=>$value) {
    if ($value !== '') update_post_meta($id, $key, $value);
  }
  set_post_thumbnail($id, $image_ids[$record['image']]);
  if (!empty($record['gallery'])) update_post_meta($id, 'rp_galeria_ids', array_map(static fn($name)=>$image_ids[$name], $record['gallery']));
}
update_option('rp_local_demo_seeded', '1');
flush_rewrite_rules();
echo 'Local-only visual demo seeded: ' . count($records) . ' records';`;
const banner = `<?php
/* Local QA instance only; never copy to the production theme. */
add_action('wp_body_open', static function () {
  echo '<aside aria-label="Datos de prueba" style="position:absolute;z-index:80;top:68px;right:12px;max-width:min(320px,calc(100% - 24px));padding:8px 12px;background:#8f1721;color:white;font:700 11px/1.4 system-ui;letter-spacing:.04em;pointer-events:none">DEMO VISUAL · NO ES STOCK REAL</aside>';
});`;
const blueprint = {
  landingPage:'/',
  preferredVersions:{php:'8.3',wp:'6.8'},
  steps:[
    {step:'activateTheme',themeFolderName:'rp-usados'},
    {step:'setSiteOptions',options:{blogname:'RP Usados · DEMO VISUAL',blogdescription:'No es stock real',permalink_structure:'/%postname%/',timezone_string:'America/Argentina/Buenos_Aires'}},
    {step:'runPHP',code},
    {step:'mkdir',path:'/wordpress/wp-content/mu-plugins'},
    {step:'writeFile',path:'/wordpress/wp-content/mu-plugins/rp-local-demo.php',data:banner},
  ],
};
await writeFile(resolve(output,'blueprint.json'),JSON.stringify(blueprint));
console.log(resolve(output,'blueprint.json'));
