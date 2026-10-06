# RP Usados — frontend productivo local

Implementación del 27/09/2026. Sin deploy. Respaldo previo a cambios: **c84025a**.

Actualización local 05/10/2026: envolvente negra mobile en 100dvh y escena visual
compartida por media/copy/CTA con altura 100svh capturada antes del primer paint.
Sólo cambios de ancho restablecen esa altura; los cambios de barras no recentran
la imagen ni desplazan el CTA. Layout sticky/travel reservado antes del módulo
GSAP, con fallback estático explícito. No refresh de aplicación ni compensación
de scroll por cambios de altura mobile. Videos y composición inicial intactos.
Preview DEMO local: http://127.0.0.1:9470/. Ajuste aprobado para guardar en main y
publicar una nueva preview estática de testing; no es producción definitiva.
Evidencia y límites: `HERO_MOBILE_VIEWPORT_QA.md`.

## Revisar

- Home real del tema: http://127.0.0.1:9400/
- Archivo del CPT: http://127.0.0.1:9400/vehiculos/
- Entorno QA aislado, con datos de desarrollo: http://127.0.0.1:9430/
- Ficha QA disponible: http://127.0.0.1:9430/vehiculos/qa-disponible/
- Ficha QA reservada: http://127.0.0.1:9430/vehiculos/qa-reservado/
- Ficha QA sin datos: http://127.0.0.1:9430/vehiculos/qa-sin-datos/

9400 usa WordPress 6.8 / PHP 8.3 y el tema real montado. No contiene unidades ficticias: muestra estado vacío hasta cargar inventario confirmado. 9430 es otra base temporal, rotulada QA LOCAL / NO ES STOCK; sus imágenes son patrones de comprobación, no fotografías de autos, y su moneda/número de contacto son datos de prueba que no se deben publicar. No se envió ningún mensaje. Fixtures y base no están en el ZIP.

## Implementado

Home sin query parameters: header oscuro fino → V2 A desktop/mobile → negro → puente HTML/CSS → curva sutil → catálogo CPT completo → trayectoria → financiación/permutas → mapa → WhatsApp → footer.

Los cuatro archivos de video/poster son idénticos byte por byte a la exploración aprobada y a su copia dentro del ZIP. No hubo rerender, recodificación, cambio de cámara o reinterpretación del hero. Se conserva selector por viewport/puntero, scroll reversible, frame presentado, retorno/resize/orientación y fallback. Landscape táctil sigue con vertical completo y fondo negro.

Manrope y Archivo se autoalojan desde los archivos aprobados. Se trasladaron los estilos de Stage 1/02 y se retiraron los selectores exclusivos de la exploración. Las adaptaciones son datos WordPress, imágenes reales cuando existan, galería nativa progresiva, logo configurado y contacto pendiente, sin una nueva dirección visual.

Catálogo en Home y archivo: todos los publicados disponibles/reservados; sin paginación, filtros, buscador ni destacados. Card completa enlazada, sin precio ni descripción editorial. Versión/año/km sólo si existen. Estado sin stock honesto.

Ficha: fotografía amplia sin recorte forzado, navegación de galería por botones/teclado/enlaces y desplazamiento touch; con JavaScript deshabilitado siguen accesibles las imágenes y sus enlaces. Specs disponibles, precio con la guarda existente y CTA que usa el título/URL de la unidad y su número configurado. Barra inferior de contacto y layout específico mobile.

Mapa: mismo embed estándar aprobado, con carga diferida, marcador de R.P. Usados, dirección, indicaciones y enlace a Google Maps; sin clave ni API paga. Se verificó carga real de tiles y marcador. Los enlaces siguen presentes aunque se bloquee contenido externo.

## Backend preservado

Comparación contra c84025a sin diferencias en `inc/vehicle-data.php`, `inc/vehicle-admin.php`, `inc/post-types/vehiculo.php`, `src/scripts/admin.js`, `inc/customizer.php` e `inc/setup.php`. Se mantienen estados, campos, galería, reglas de precio, sanitización, nonces, permisos y números/mensajes de WhatsApp. `functions.php` sólo registra el nuevo módulo de presentación.

`inc/frontend.php` adapta consultas completas y enlaces al markup. El hook de archivo ajusta únicamente el tamaño de la página a todo el stock; conserva la cláusula de elegibilidad existente. No se cambió esquema de datos ni administración.

## Lo que dejó de ejecutarse

- Hero PHP anterior y bifurcación por `rp_hero_preview`.
- Bootstrap/controladores Three.js V1 y sus GLB/HDR/materiales.
- CSS anterior `main.scss`, `_tokens.scss`, `_base.scss`, `_hero-webgl.scss` como fuentes de interfaz activa.
- Sección de destacados y markup anterior de cards/ficha/header/footer.
- Dependencia `three` del paquete activo.

Las referencias V1, Stage 1, Iteración 02, Hero V2, Blender/prerender y QA anteriores se preservan. Los módulos V1 quedan fuera del grafo Vite y sus assets/plantillas fuera del ZIP, sin borrarlos del repositorio.

## Archivos principales

| Archivos | Responsabilidad |
|---|---|
| `theme/rp-usados/front-page.php`, `header.php`, `footer.php` | Composición productiva y navegación |
| `theme/rp-usados/template-parts/home/{hero,catalog,trajectory,services,location,contact}.php` | Hero y secciones aprobadas |
| `theme/rp-usados/archive-vehiculo.php`, `single-vehiculo.php` | Catálogo completo y ficha amplia |
| `theme/rp-usados/template-parts/vehicle/{card,empty,whatsapp}.php` | Presentación reutilizable, vacíos y CTA |
| `theme/rp-usados/inc/frontend.php`, `functions.php` | Adaptadores de presentación y registro |
| `theme/rp-usados/src/styles/{main.scss,stage-1.css,hero-v2.css,production.css}` | Sistema aprobado y adaptadores WordPress |
| `theme/rp-usados/src/scripts/main.js`, `gallery.js`, `hero-v2/` | Mejora progresiva y módulo hero sólo Home |
| `theme/rp-usados/assets/hero/v2/`, `assets/brand/`, `src/fonts/`, `licenses/` | Media/fuentes aprobadas y licencias |
| `theme/rp-usados/package.json`, `pnpm-lock.yaml`, `scripts/package-theme.mjs` | Retirada de Three y empaquetado |
| `tools/production-qa.mjs`, `artifacts/production/` | Verificación del tema real y evidencia |

## Build y QA

```powershell
cd theme/rp-usados
pnpm package
cd ../..
node tools/check-php.mjs
node tools/production-qa.mjs
```

Para repetir el QA con stock, arrancar primero el Playground aislado de 9430 con el blueprint local `tools/.preview/production-qa/blueprint.json`. No aplicarlo a otra instalación. El sitio normal se inicia con `tools/start-preview.ps1` y conserva la configuración sin inventario de prueba.

- **180 comprobaciones aprobadas** en `artifacts/production/report.json`: 1920, 1440, 1280, 768, 430, 390 y 375 px; scroll forward/reverse/lento/brusco, recarga, cambio de orientación, retorno arriba, teclado/foco, zoom 200 %, reduced motion, video fallando y sin JS.
- WordPress con 15 registros elegibles en QA: se muestran todos, superando el antiguo límite de 12; reservados incluidos, vendidos/drafts/estado ausente excluidos. Sin precio en cards/Home/archivo; precio sólo en ficha. CTA específico comprobado sin abrir WhatsApp.
- Galería de tres fotos, navegación y estados ausentes; sin overflow. Páginas individuales no cargan hero, videos, posters ni inicializan GSAP/hero.
- Red: desktop sólo pide su MP4/poster; mobile sólo los verticales. Sin Three.js, GLB, HDR o assets V1.
- Comprobaciones adicionales después del ajuste WordPress: query de preview irrelevante; barra admin con offset correcto (simulación del layout); contacto pendiente visible con contraste. `artifacts/production/final-checks.json`.
- PHP 8.3: 25 archivos sin errores de sintaxis. Manifest Vite leído correctamente por el tema en WordPress.
- ZIP `dist/rp-usados.zip`: **8.983.087 bytes**, 54 entradas bajo `rp-usados/`; sin node_modules, src, herramientas, V1, fixtures, GLB o HDR. Manifest y archivos referenciados presentes.
- JS común ≈2,97 KB / 1,42 KB gzip; módulo hero + GSAP ≈121,57 KB / 47,89 KB gzip sólo Home; CSS ≈27,82 KB / 6,53 KB gzip. Fuentes Manrope 24,84 KB y Archivo 34,93 KB. Videos conservan 4,78 MB desktop y 2,38 MB mobile.

Las comprobaciones se realizaron en Edge/Chromium 154 local. No se afirma validación en Safari/iPhone físico ni tiempos representativos de red móvil. La carga externa de Google puede tardar; las capturas `map-loaded-*` muestran el mapa ya cargado.

## Capturas

- `artifacts/production/home-desktop-initial.png` y `home-mobile-390-initial.png`.
- `artifacts/production/home-full-1440.png` y `home-full-390.png`.
- `artifacts/production/stock-qa-1440.png` y `stock-qa-390.png` (QA, no stock).
- `artifacts/production/vehicle-qa-1440.png` y `vehicle-qa-390.png` (QA, no stock).
- `artifacts/production/vehicle-info-qa-1440.png` y `vehicle-info-qa-390.png`.
- `artifacts/production/map-loaded-desktop.png` y `map-loaded-mobile.png`.

## Datos pendientes del dueño y límites de entrega

1. **Logo oficial separado**: no se encontró en el repositorio ni configurado en este WordPress local. Se solicitó su ubicación. El tema usa `custom_logo` nativo cuando se configure; mientras tanto conserva el texto identificatorio aprobado del header. La silueta sigue siendo secundaria, no se presenta como logo oficial. No se recreó una marca.
2. **Número de WhatsApp confirmado**: conservar vacío hasta validación; el campo existente del Customizer y los overrides por unidad ya son funcionales. Sin número, la acción explica el dato pendiente; no se usa el teléfono de una referencia como confirmación tácita.
3. **Stock real, fotos, estados, precios y monedas confirmados**: cargar en CPT existente. El sitio normal está listo para mostrarlos; no hay unidades reales disponibles en el repositorio para una ficha comercial final.
4. Horarios y condiciones específicas de financiación, si se desean publicar. Se muestran marcadores donde corresponde; no se inventaron condiciones, premios, garantías o estadísticas.

Pendiente revisión del usuario, logo/contacto/stock reales y Safari/iPhone físico. No hubo deploy. El `.zip` es un entregable local, no una autorización para publicar.

## Integración aprobada del overscan mobile — 06/10/2026

**Nota de versión:** el hold y matte descritos en este checkpoint histórico
quedan reemplazados por el render mobile v3, según la sección siguiente.

La Home principal incorpora el canvas máximo capturado de `100lvh`, anclado
arriba y recortado por el wrapper `100dvh`; el copy/CTA usa una capa separada
capturada de `100svh`. La altura de ambas capas sólo se recaptura cuando cambia
el ancho/orientación, no al ocultar barras. Sticky se establece antes del primer
paint. Se eliminó la compensación de orientación con `scrollTo`.

Con aprobación explícita del usuario, el tiempo solicitado mobile se limita al
frame 88 (1,8333 s del MP4 original), para conservar cartel, hojas, manijas y marco
al final del mismo tramo de scroll. Sólo el vano libre se oscurece mediante una
geometría SVG que sigue el frame presentado por el compositor, también al
retroceder. No hay fade completo a negro ni `opacity:0` de la escena mobile.
La salida continúa en flujo normal hacia el puente y la curva sutil.

Desktop conserva composición, recursos y curva. Ambos MP4 y posters permanecen
intactos. Catálogo, ficha, botones, cursor, Nosotros y financiación no se
rediseñaron. DEMO sólo existe en la instancia aislada y en el export de testing.

QA de esta integración: Vite build, PHP 8.3 (26 archivos), 24 comprobaciones del
controlador incluyendo sincronización del matte/reload; Home/ficha 375/390/430,
desktop, galería de cuatro fotos y lightbox/teclado. En el ensayo SVH 760/LVH 832,
imagen y CTA se desplazan 0 px al crecer +16/+72; se revelan 16/72 px de media,
sin espacio web adicional inferior. El ensayo usa un proxy sólo de QA, no
instrumentación entregada ni constantes específicas de un teléfono.

Ver `artifacts/near-final/` y `openspec/changes/integrate-mobile-overscan/`.
La validación física final en Android Chrome y Safari/iPhone sigue pendiente.

## Render mobile v3 completo — preview de testing, 06/10/2026

Fuente existente: `Downloads/render/RP_hero_mobile_v3_0001-0144.mp4`,
generado después del `.blend` v3 proporcionado. No se abrió/modificó Blender,
no se renderizó ni se aplicaron filtros visuales. La fuente ya es un MP4
comprimido; la recodificación no recupera detalle perdido en ese archivo.

Web: `hero-mobile-v3-crf18.mp4`, 720×1280, 48 fps, 144 frames / 3 segundos,
H.264 High / yuv420p, libx264 slow CRF 18, GOP 4, sin B-frames/audio y faststart.
Peso: 1.815.110 bytes; bitrate total 4,840 Mbps (video aprox. 4,835 Mbps).
SSIM contra el MP4 fuente: 0,995466. Poster PNG extraído del primer frame
de la nueva codificación. Los nombres versionados evitan reutilizar caché vieja.

Se retiraron el límite de frame 88, el SVG del vano y su callback/observer.
El progreso 0–1 ahora solicita los frames 0–143: no hay hold previo al final,
degradado interior ni máscara artificial. El negro y las puertas son parte
del render aprobado. Continúan intactos overscan LVH, overlays SVH, wrapper
DVH, scroll nativo/reversible, puente y curva sutil. Desktop mantiene el
MP4 SHA256 `f30f7e95c357e39601dfa14f2052b2bc6a6e6f49cff2d72c2598aabec01ded64`.

Verificación: build Vite, 26 archivos PHP y 23 assertions del controlador,
incluyendo presentación del último frame y regreso al primero. La preview
completa usa unidades explícitamente DEMO; no es producción definitiva.
