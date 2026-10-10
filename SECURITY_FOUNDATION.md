# Base de seguridad de RP Usados

Implementación local sobre `a3cc84c33ee72968f4158fdddb6346ce6823f52c`.
Sin `/gestion`, UI nueva, login custom, endpoints nuevos, deploy, commit o push.
No cambia el frontend aprobado, CPT slug, campos almacenados, stock ni assets.

## Separación e instalación

El tema conserva el registro `vehiculo`, esquema de metadatos y editor nativo.
El plugin independiente `plugins/rp-usados-security` concentra roles, política de
Media y autorización en escrituras nativas de WordPress.

1. Instalar/activar `rp-usados-security` antes de usar el tema actualizado.
2. La activación/migración versionada agrega las capabilities al Administrador y
   crea `rp_stock_manager`; no asigna ese rol automáticamente a ningún usuario.
3. El Administrador asigna el rol al dueño cuando se prepare su acceso.
4. Mantener el plugin activo. Al desactivarlo por WordPress se revocan las
   escrituras/uploads del gestor sin borrar usuarios, stock o archivos, y el
   Administrador mantiene su acceso. Borrar el directorio a mano omite ese hook.

`node tools/package-security-plugin.mjs` genera `dist/rp-usados-security.zip`,
separado del ZIP del tema. No contiene fixtures, pruebas, secretos o renders.

## Roles y capabilities

CPT: `capability_type = [vehiculo, vehiculos]`, `map_meta_cap = true`, creación
independiente mediante `create_vehiculos`.

El rol **RP Usados - Gestor de stock** recibe `read`, `upload_files`,
`rp_manage_vehicle_media` y estas capabilities primitivas:

- `create_vehiculos`, `edit_vehiculos`, `edit_others_vehiculos`;
- `edit_private_vehiculos`, `edit_published_vehiculos`, `publish_vehiculos`;
- `read_private_vehiculos`;
- `delete_vehiculos`, `delete_others_vehiculos`, `delete_private_vehiculos`,
  `delete_published_vehiculos`.

`read_post/edit_post/delete_post` se resuelven por objeto. No se conceden
capabilities genéricas de posts/páginas, settings, plugins, themes, usuarios o
código. Un filtro server-side evita que un segundo rol no administrativo o una
capability individual amplíen silenciosamente una cuenta de stock. Administrador
y superadmin de multisite mantienen acceso completo. Perfil/contraseña propios
siguen usando las reglas nativas de WordPress.

## Política de imágenes

Para el gestor:

| Control | Política |
|---|---|
| Tipos | JPEG, PNG, WebP; SVG/GIF/HEIC/PDF/ejecutables no permitidos |
| Extensión y MIME | Coincidencia con bytes reales; no confiar en MIME del cliente |
| Decodificación | Editor de imágenes WordPress, luego de controles de bytes/dimensiones |
| Peso | Hasta 12 MiB por archivo |
| Dimensiones | Hasta 6000 px por lado y 24 millones de píxeles |
| Asociación | Hasta 20 imágenes distintas, contando portada + galería |
| Pendientes | Hasta 40 imágenes propias sin vehículo |
| Nombres/payload | Rechazar extensiones peligrosas intermedias y arrays donde corresponde un archivo |

Se aplican filtros de upload **y** sideload, contexto del REST nativo y protección
de los IDs/parent/author. La biblioteca AJAX, REST y listado nativo quedan
acotados a imágenes propias de stock o pendientes. Consultar un ID manualmente
tampoco evade la autorización. Los checks por objeto siguen siendo la protección;
el filtrado de listados solamente complementa esos checks.

El Administrador queda exento de restricciones propias del gestor. Los límites
de cantidad de uploads son controles de aplicación, no una cuota transaccional
de disco: solicitudes simultáneas pueden competir por un cupo. La lista final
asociada al vehículo se valida completa. Al eliminar una asociación no se borra
automáticamente el archivo; eliminar un archivo requiere permisos propios.

## Portada y galería

`rp_usados_security_can_use_attachment(user, attachment, vehicle)` centraliza la
política y se aplica independientemente de la interfaz:

- Debe existir un vehículo editable y un attachment de imagen válido.
- Administrador: puede utilizar cualquier imagen válida.
- Gestor: puede usar una imagen ya vinculada a ese vehículo o una imagen propia
  pendiente; la primera asociación de una imagen propia la vincula al vehículo.
- Se preservan asociaciones heredadas existentes, incluso fotos subidas por
  Administrador sin parent. Esto no autoriza usar esa foto en otro vehículo ni
  editar/borrar archivos de otro propietario.
- No se permite cambiar propietario ni mover una foto ya vinculada a otro
  vehículo. IDs de posts/páginas, IDs ajenos y listas inválidas se rechazan.

Hooks de metadatos protegen ambas asociaciones; los guardas REST se ejecutan
antes de que el helper nativo de portada pueda borrar la foto anterior ante un
ID no-imagen. Se reutilizan las rutas nativas con sus permisos y autenticación;
no hay un endpoint nuevo del futuro panel.

## Datos inválidos y CSRF

Validación de estructura separada de sanitización. Valor válido guarda; vacío
intencional permitido borra; array/objeto en escalar, formato numérico inválido,
galería anidada/asociativa o IDs inválidos conservan el valor anterior y generan
la notificación existente del editor. El rechazo también cubre escrituras de
metadatos que no pasen por el formulario.

Se mantienen nonce + permiso por objeto del editor nativo. REST con cookies usa
nonce `wp_rest`; sin nonce no obtiene una sesión autenticada REST. Uploads AJAX
usan nonce nativo `media-form` y `upload_files`. Un nonce nunca reemplaza el
permiso. No hay autenticación frontend ni contraseña incorporada en código.

## Desarrollo local y LAN

Vite: `127.0.0.1` y CORS sólo para orígenes loopback por defecto. Para LAN:

```powershell
$env:RP_USADOS_ALLOW_LAN = '1'
$env:RP_USADOS_DEV_ORIGINS = 'http://192.168.1.50:9470' # sustituir por la IP real
```

Las herramientas Playground deben arrancar por `tools/playground.mjs`; este
launcher fija el bind TCP antes de cargar CLI, sin modificar vendor. No abrir el
CLI vendor directamente ni asumir que restringe su host por sí solo. LAN activa
bind `0.0.0.0` explícitamente; no es una configuración de producción. Ajustar el
site-url de Playground si se requiere navegación desde otro dispositivo.

Auto-login administrativo de Playground deshabilitado por defecto. Un `--login`
explícito sólo puede utilizarse en loopback; en LAN se rechaza. Antes de habilitar
LAN, usar una contraseña de desarrollo no predeterminada, red confiable y cerrar
el servidor al terminar. No exponer Playground a Internet. Los servidores ya
arrancados con configuración vieja necesitan reinicio.

## Dependencias

- `source-map-js`: 1.2.1 → 1.2.2 dentro de los rangos de Sass/PostCSS.
- Playground CLI: 3.1.54 → 3.1.57, misma rama compatible.
- CLI fija Express 4.22.2. Se utiliza un ajuste **limitado a ese padre/version**
  para Express **4.22.3**, cuyo rango upstream admite `qs ~6.16.0` naturalmente.
  No se fuerza una versión de qs fuera del rango declarado de Express.
- Se conserva la prohibición anterior de build scripts de `fs-ext-extra-prebuilt`.
- Audits de tema/herramientas: cero vulnerabilidades conocidas en la ejecución
  registrada. Revisar nuevamente al actualizar CLI; el ajuste está versionado.

## Verificación

Comandos reproducibles desde la raíz, con dependencias instaladas:

```powershell
node tools/security-tests.mjs
node tools/security-http-qa.mjs
node --test tools/security-network.test.mjs tools/hero-seek-controller.test.mjs
node tools/check-php.mjs
powershell -File tools/start-demo-preview.ps1
node tools/security-public-qa.mjs
```

Las pruebas de seguridad usan instalaciones descartables de WordPress 6.8.11 /
PHP 8.3.33. No crean cuentas o stock en una instalación real. Las credenciales de
la prueba HTTP son aleatorias, quedan fuera de su raíz web y se eliminan al
cerrar la prueba. El cliente REST cargado para obtener nonces sólo existe en el
fixture del admin; no forma parte del plugin entregable.

Resultados finales: **161** comprobaciones aisladas WordPress, **18** HTTP con
sesiones reales/uploads, **47** de regresión pública, **3** de red/Vite y **23**
assertions existentes del controlador del hero. **31** archivos PHP válidos.
Build Vite y manifest correctos; hashes de assets públicos sin cambios. Ambos
`pnpm audit` reportan **0** vulnerabilidades conocidas.

Los reportes quedan ignorados bajo `tools/.preview/security*`. Incluyen matriz
de roles, nonces, REST, multipart nativo, archivo no-imagen/MIME falso/corrupto,
bytes/dimensiones/cantidad, gallery/cover IDs, ownership, input malformado y
activación/desactivación. La regresión pública comprueba Home/archivo/ficha,
disponibles/reservados/vendidos, precio sólo en ficha, galerías, imágenes
responsive y perfiles 1440/375/390/430, con fuentes públicas idénticas al commit
base. Emulación Chromium, no certificación de un dispositivo físico ni de iOS.

## Antes del futuro /gestion y producción

La UI y endpoints nuevos siguen pendientes: usar sesiones/cookies WordPress,
nonce de sesión, permiso por objeto y la política central en cada operación.
No exponer el registro de precios en respuestas auxiliares del catálogo.

Hosting: HTTPS, cookies seguras, WordPress actualizado, backups restaurables,
debug público apagado, editor de código deshabilitado y ejecución de scripts
prohibida en uploads. Esto requiere verificar la configuración del servidor
real; el plugin no sustituye ese endurecimiento. Dimensionar memoria/procesador
para decodificar imágenes de hasta 24 MP y definir cuotas/rate limits si se
necesitan garantías transaccionales ante concurrencia. Esta fase no modifica
wp-config del servidor ni construye autenticación o rutas privadas nuevas.

## Archivos de esta implementación

- Plugin: `plugins/rp-usados-security/rp-usados-security.php`, `inc/roles.php`,
  `inc/media.php` y `README.md` dentro de esa carpeta.
- Tema: `theme/rp-usados/inc/post-types/vehiculo.php`, `inc/vehicle-data.php`,
  `inc/vehicle-admin.php`, `vite.config.js` y `pnpm-lock.yaml` dentro del tema.
- Herramientas: `tools/playground.mjs`, `tools/playground-network.mjs`,
  `tools/start-preview.ps1`, `tools/start-demo-preview.ps1`,
  `tools/preview-blueprint.json`, `tools/create-demo-preview.mjs`,
  `tools/check-php.mjs`, `tools/pnpm-lock.yaml`, `tools/pnpm-workspace.yaml`.
- Pruebas/paquete: `tools/security-tests.mjs`, `tools/security-http-qa.mjs`,
  `tools/security-public-qa.mjs`, `tools/security-network.test.mjs`,
  `tools/package-security-plugin.mjs`, `tests/security/security.php`,
  `tests/security/http-fixture.php`.
- Documentación: este archivo y `openspec/changes/security-foundation/`
  (`proposal.md`, `design.md`, `tasks.md`, `specs/stock-security/spec.md`).

Derivados ignorados: build Vite, ZIP actualizado del tema, ZIP del plugin y
reportes locales. No se agregan bases, credenciales, uploads, fuentes PNG del
render ni archivos de debug al repositorio.
