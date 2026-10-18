/** Isolated local fixture. Random credentials never enter source or a public directory. */
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..'), out = resolve(root, 'tools/.preview/gestion-local');
execFileSync(process.execPath, [resolve(root, 'tools/create-demo-preview.mjs')], { cwd: root, stdio: 'ignore' });
await mkdir(out, { recursive: true }); await rm(resolve(out, 'access.json'), { force: true });
const blueprint = JSON.parse(await readFile(resolve(root, 'tools/.preview/rich-demo/blueprint.json'), 'utf8'));
blueprint.steps.push({ step: 'runPHP', code: `<?php
require '/wordpress/wp-load.php';
wp_set_current_user(1);
$password = wp_generate_password(24, false);
$id = wp_insert_user(['user_login'=>'rp-stock-local','user_pass'=>$password,'role'=>'rp_stock_manager','display_name'=>'Gestor local de prueba']);
if(is_wp_error($id)) throw new Exception('No se pudo crear la cuenta local.');
file_put_contents('/gestion-local-output/access.json', wp_json_encode(['url'=>home_url('/gestion/'),'username'=>'rp-stock-local','password'=>$password,'scope'=>'Sólo esta instancia local de testing; no producción.']));
` });
await writeFile(resolve(out, 'blueprint.json'), JSON.stringify(blueprint, null, 2));
console.log('Blueprint de gestión local preparado; credenciales aleatorias fuera del webroot.');
