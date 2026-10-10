# Cierre técnico local — 10/10/2026

## Resultado

La QA del estado visual aprobado pasa. No se detectó un bug reproducible del frontend que requiriera modificar el producto. No se cambió el diseño, la administración, el CPT, el contrato de datos ni el hero durante este cierre. Se conservan los cambios aprobados pendientes del checkpoint anterior: contenido comercial confirmado, composición de financiación, eliminación de labels numerados y desktop 1080p con poster correspondiente.

Se actualizaron expectativas obsoletas de las pruebas: nombre del MP4/poster mobile v4, WhatsApp ya confirmado, tres servicios y eliminación de labels. También se parametrizó la prueba de lifecycle para usar el WordPress aislado actual. Se agregó una regresión final reproducible de Home, navegación, recursos y fallback.

## Entorno y alcance

- WordPress Playground 6.8 / PHP 8.3, tema compilado montado; activación y enlaces permanentes en instancias descartables.
- Fixtures aislados: 10 unidades publicadas, 9 elegibles (7 disponibles, 2 reservadas), 1 vendida excluida. Vento con cuatro imágenes; Duster con campos opcionales vacíos. Una segunda instancia sin stock valida el estado vacío.
- El contacto confirmado se configura solamente dentro del fixture local; no se escribe sobre inventario ni configuración remota.
- Edge 154.0.4258.62 y Chrome 154.0.8037.99. Revisión visual adicional en navegador integrado.
- Desktop: 1920, 1440, 1280, 1024 y 900 px. Intermedios: 899 y 768 px. Mobile emulado: 375, 390 y 430 px. Orientación portrait/landscape.
- Mobile es emulación de viewport/touch. No constituye una nueva certificación física de Android o Safari/iOS. La investigación anterior de iOS queda documentada y no se reabrió.

## Pruebas ejecutadas

| Suite | Resultado |
|---|---:|
| `tools/final-closure-qa.mjs` | 231 comprobaciones |
| `tools/vehicle-experience-qa.mjs` | 85 comprobaciones |
| `tools/institutional-qa.mjs` | 59 comprobaciones |
| `tools/brand-cursors-qa.mjs` | 52 comprobaciones, Chrome y Edge |
| `tools/hero-lifecycle-qa.mjs` | 22 comprobaciones |
| `node --test tools/hero-seek-controller.test.mjs` | 23 assertions, 1 test pasado |
| `tools/hero-reload-qa.mjs` | 60 recargas consecutivas, 0 fallos |

Las recargas cubren 375/390/430 × caché fría/caliente × scroll inicial/medio × 5 repeticiones. CPU 4× y autoplay restringido; ninguna llamada a `play()` ni promesa rechazada. Forward/reverse, ráfagas de scroll, vuelta arriba, retorno por historial, visibilidad, pageshow/pagehide persistidos, cambio de orientación, ruta sin rVFC y fallo real de carga de MP4 pasan.

## Hallazgos funcionales y visuales

- Home completa y secciones presentes, sin labels numerados recuperados. Financiación prendaria/banco/financiera, permutas y consignaciones muestran el contenido confirmado.
- Anchors reales para Vehículos, Nosotros y Financiación y permutas dejan los destinos debajo del header. Menú mobile abre/cierra, selección cierra, Escape devuelve foco, click fuera cierra. Teclado, skip y zoom al 200% pasan.
- Sin JavaScript: poster correcto, sin descarga MP4, menú `details` y anchors nativos utilizables; ficha con información, precio y enlaces de galería accesibles. La comprobación de click nativo utiliza hit-testing y entrada de puntero porque el waiter de estabilidad RAF de Playwright puede bloquearse con JavaScript deshabilitado, aun con la animación CSS terminada. No se aplicó un workaround al producto.
- Sin overflow horizontal en los perfiles probados; sin imagen deformada ni título tapado por header. Portadas con ratios diferentes y datos opcionales vacíos pasan.
- Card completa enlaza a la ficha; interacción editorial B y cursor convencional rojo/negro permanecen. Touch no descarga los assets de cursor.
- Ficha: fotografía principal, panel informativo, precio, estado, specs, galería, miniaturas, contador y lightbox; navegación por controles/teclado, cierre Escape y WhatsApp contextual pasan.
- Vendido no aparece en Home/archive; reservado identificado. Precio ausente en catálogo y presente exclusivamente en ficha. WhatsApp usa `5491125348193`, con título y URL de unidad en la ficha.
- Embed y links confirmados de Google Maps presentes; sin HTTP local 4xx/5xx, requests locales fallidos inesperados ni errores JS/consola en la matriz final. Tampoco se registraron fallos externos en esa ejecución.

## Hero y recursos

- Desktop descarga sólo `hero-desktop-1080-crf18.mp4` y su poster; mobile sólo `hero-mobile-v4-1080-crf18.mp4` y su poster.
- No solicitudes Three.js, GLB, HDR ni V1. Archive/ficha no inicializan el hero ni descargan el chunk de GSAP/hero.
- Desktop: H.264 High / YUV420p, 1920×1080, 48 fps, 144 frames, 3.000 s, 6.697.013 bytes, faststart. Poster idéntico píxel a píxel al primer frame decodificado. Interior oscuro conserva lectura de puertas; media mobile y JS/CSS del hero coinciden con el baseline previo a la sustitución desktop.
- Poster/video tienen cajas, object-fit y posición coincidentes. En mobile, resize emulado +16/+72 px conserva imagen y CTA con menos de 1 px de diferencia; la altura del canvas queda estable. Esto comprueba el layout, no las barras físicas de Chrome.
- Reduced motion conserva estado estático y no solicita MP4. Fallo de video conserva poster y navegación.
- El catálogo renderiza una sola portada por unidad, sin segunda foto/galería. `srcset`, `sizes`, dimensiones y lazy están presentes.
- En fixtures con fotos reutilizadas: 4–5 URLs de uploads al inicio de archive y 5 tras recorrer todas las portadas. Son URLs únicas, no cantidad de cards. Ninguna foto secundaria Vento fue solicitada desde el catálogo.
- Ficha Vento: 6 URLs al inicio (principal, precarga de próxima foto y thumbnails pequeños), 8 después de recorrer galería/lightbox. Fotos grandes secundarias se habilitan progresivamente; no bloquean el panel.

## Build, PHP y paquete

- Vite 6.4.3: build correcto, 15 módulos. CSS 54,25 kB; entrada JS 6,75 kB; chunk hero/GSAP 121,42 kB (47,87 kB gzip).
- Manifest: 9 entradas y todos los archivos/imports/css/assets referenciados existen; el tema lo consume correctamente.
- PHP 8.3: 26 archivos sin errores de sintaxis.
- ZIP local: `dist/rp-usados.zip`, 26.890.794 bytes, 72 entradas bajo `rp-usados/`. Incluye manifest y videos actuales; excluye node_modules, src, herramientas de build, fixtures, credenciales, diagnóstico iOS, Blender, GLB y HDR. El ZIP es un artifact ignorado, no se añade a Git.
- Registro CPT, metadatos, sanitización, permisos/nonces, portada, galería y query de estados revisados sin alterar el backend.

## Limpieza y evidencia

Se retiraron los tres ejecutables temporales iOS no trackeados (`ios-hero-probe.js`, `ios-hero-webkit-qa.mjs`, `prepare-ios-hero-diagnostics.mjs`). El informe histórico iOS se conserva. No se añadió ruta de diagnóstico al producto. No hay logging/debug temporal en la ejecución actual del hero.

Capturas y resultados detallados permanecen localmente en `tools/.preview/final-qa-20261010/`, excluidos por `.gitignore`, junto con fixtures descartables. Las secuencias PNG y renders intermedios externos no se incorporan al repositorio. Stage 1, Iteración 02, V2 y fuentes/documentación Blender útiles se preservan.

El checkpoint Git incluye el estado aprobado y estas pruebas/documentación. El hash, igualdad HEAD local/remoto y limpieza final se verifican en la transacción de commit/push y se entregan en la respuesta final. No se hace deploy ni se continúa con el admin después del push.
