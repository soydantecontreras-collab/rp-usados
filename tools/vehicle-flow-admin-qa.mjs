// Local, explicitly labelled QA only. Uses native WordPress forms and media dialogs.
import {createRequire} from 'node:module';
import {writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire('C:/Users/dante.DESKTOP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const b=await chromium.launch({channel:'msedge',headless:true});
const c=await b.newContext({storageState:'tools/.preview/vehicle-flow/auth.json',viewport:{width:1440,height:1000}}),p=await c.newPage();
const ROOT='http://127.0.0.1:9440',OUT='artifacts/vehicle-flow';
p.on('pageerror',e=>console.log('PAGE ERROR',e.message));
const report=await readFile(OUT+'/admin-report.json','utf8').then(JSON.parse).catch(()=>({method:'Native WordPress editor and media dialogs; isolated localhost:9440. Not real inventory.',vehicles:[],checks:[]}));
const check=(name,value)=>{assert(value,name);report.checks.push(name);};
try {
 for(const [i,name,state,photo] of [[0,'Disponible','disponible','landscape'],[1,'Reservado','reservado','portrait'],[2,'Vendido','vendido','square'],[3,'Opcionales vacíos','disponible',null],[4,'Galería','disponible','wide']]) {
  if(report.vehicles.some(v=>v.name===name))continue;
  console.log('Creating QA:',name);
  await p.goto(ROOT+'/wp-admin/post-new.php?post_type=vehiculo');
  const required=await p.locator('#rp-vehicle-data [required]').count();check(name+': no mandatory meta fields in form',required===0);
  await p.locator('#title').fill('QA LOCAL — '+name+' — NO ES STOCK');
  await p.locator('#rp_estado_stock').selectOption(state);
  if(i!==3) {
   for(const [key,value] of Object.entries({rp_marca:'QA LOCAL',rp_modelo:name+' / NO ES STOCK',rp_version:'Datos de desarrollo',rp_anio:'2000',rp_kilometraje:i===1?'0':'12345',rp_precio_monto:'12345.67',rp_precio_moneda:'TST',rp_whatsapp_numero:'99999999',rp_whatsapp_mensaje:'PRUEBA LOCAL — NO CONTACTAR'}))await p.locator('#'+key).fill(value);
  }
  if(photo) {
   await p.locator('#set-post-thumbnail').click();
   await p.getByRole('tab',{name:'Upload files'}).click();
   const files=i===0?['landscape','portrait','square','wide']:[photo];
   const chooser=await Promise.all([p.waitForEvent('filechooser'),p.getByRole('button',{name:'Select Files',exact:true}).click()]);
   await chooser[0].setFiles(files.map(f=>'tools/.preview/vehicle-flow/'+f+'.png'));
   await p.waitForFunction(()=>!document.querySelector('.media-modal .uploading')&&document.querySelectorAll('.media-modal .attachment').length>0);
   const item=p.locator('.media-modal:visible .attachment').filter({has:p.locator('img[src*="'+photo+'"]')}).first();
   if(!await item.evaluate(e=>e.classList.contains('selected')))await item.click();
   await p.locator('.media-modal:visible .media-button-select').click();
   await p.locator('#postimagediv img').waitFor();
  }
  if(i===4){
   await p.locator('#rp-select-gallery').click();
   await p.getByRole('tab',{name:'Media Library',exact:true}).click();
   await p.locator('.media-modal:visible .attachment').first().waitFor();
   for(const photo of ['landscape','portrait','square']){
    const item=p.locator('.media-modal:visible .attachment[aria-label="'+photo+'"]').last();
    await item.focus();await p.keyboard.press('Control+Space');
    const mediaId=await item.getAttribute('data-id');
    await p.waitForFunction(id=>[...document.querySelectorAll('.media-modal')].filter(e=>e.offsetWidth).some(e=>e.querySelector('[data-id="'+id+'"]')?.getAttribute('aria-checked')==='true'),mediaId);
    console.log('Selected gallery items',await p.locator('.media-modal:visible .attachment[aria-checked="true"]').count());
   }
   await p.screenshot({path:OUT+'/admin-gallery-selection.png'});
   await p.getByRole('button',{name:'Usar estas imágenes',exact:true}).click();
   await p.waitForFunction(()=>document.querySelector('#rp_galeria_ids').value.split(',').length>=3);
   check('gallery IDs populated from visual library', (await p.locator('#rp_galeria_ids').inputValue()).split(',').length>=3);
  }
  if(i===0)await p.screenshot({path:OUT+'/admin-filled.png',fullPage:true});
  await Promise.all([p.waitForURL(/post\.php\?post=\d+&action=edit/),p.locator('#publish').click()]);
  await p.locator('#message').waitFor();
  const id=new URL(p.url()).searchParams.get('post'),url=await p.locator('#sample-permalink a').getAttribute('href');
  check(name+': state persists after publishing',await p.locator('#rp_estado_stock').inputValue()===state);
  if(i===4)check('gallery survives save',await p.locator('#rp-gallery-preview img').count()>=3);
  report.vehicles.push({name,state,id,url});
  await writeFile(OUT+'/admin-report.json',JSON.stringify(report,null,2));
 }
 // Invalid input must retain the valid value and explain what happened.
 await p.goto(ROOT+'/wp-admin/post.php?post='+report.vehicles[0].id+'&action=edit');
 await p.locator('#rp_kilometraje').fill('-5');await Promise.all([p.waitForNavigation(),p.locator('#publish').click()]);
 check('invalid km retains previous value',await p.locator('#rp_kilometraje').inputValue()==='12345');
 check('invalid km has visible explanation',(await p.locator('#rp-vehicle-data').innerText()).includes('Se conservó su valor anterior'));
 await p.locator('#rp-vehicle-data').scrollIntoViewIfNeeded();await p.screenshot({path:OUT+'/admin-validation.png'});
 await p.goto(ROOT+'/wp-admin/edit.php?post_type=vehiculo');await p.screenshot({path:OUT+'/admin-inventory.png'});
 await writeFile(OUT+'/admin-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
} catch(e){await p.screenshot({path:OUT+'/admin-error.png',fullPage:true});console.error(await p.locator('body').innerText());throw e;}
finally{await b.close();}
