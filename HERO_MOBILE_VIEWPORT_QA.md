# Hero mobile — corrección local de viewport (05/10/2026)

Base: main / 6564690aed9268ab3755918c03776a61328eba97. Cambios locales sin
commit, push ni deploy. URL: http://127.0.0.1:9470/ (WordPress DEMO aislado).
Comparación contra export aprobado intacto: http://127.0.0.1:9491/.

## Cambio

- `.hero-stage` sigue siendo la envolvente negra dinámica 100dvh, con fallback svh.
- Nueva `.hero-scene` contiene los mismos poster/video, caption, CTA y cue.
  Su altura es 100svh menos header/admin-bar, capturada en píxeles antes de paint.
  Esto permite simular aumentos de viewport sin que el resize del emulador cambie
  también SVH. En el teléfono, SVH representa el viewport pequeño con barras.
- El espacio extra queda negro abajo. Usar el viewport pequeño también evita
  que el CTA quede fuera del viewport al recargar con barras ocultas y restaurarlas.
- Un bootstrap síncrono pequeño en el head de la Home reserva sticky y travel
  antes de cargar GSAP/media. El cambio data-mode del módulo ya no cambia layout.
  Sin JS, Save-Data, reduced motion o fallo explícito: poster y flujo estático.
- Los resizes mobile de sólo altura ya no solicitan ScrollTrigger.refresh; mantienen
  scroll nativo y progreso. Sin nuevos scrollTo, waits, timers ni handlers de gestos.
  Restauración previa por cambio de ancho/orientación y salto explícito al catálogo
  permanecen como estaban.

No cambios a seek-controller, assets, exposición, framing, duración, backend, curva,
catálogo, ficha ni Blender. No dependencias nuevas.

## Comparación controlada

Chrome y Edge dieron los mismos resultados a scrollY=12:

| Viewport inicial | Envolvente: inicial / +16 / +72 | Escena: inicial / +16 / +72 | Imagen top antes → después (+16 / +72) | CTA desplazamiento antes → después |
|---|---|---|---|---|
| 375 × 812 | 752 / 768 / 824 px | 752 / 752 / 752 px | +8 / +36 → 0 / 0 px | +16 / +72 → 0 / 0 px |
| 390 × 844 | 784 / 800 / 856 px | 784 / 784 / 784 px | +8 / +36 → 0 / 0 px | +16 / +72 → 0 / 0 px |
| 430 × 932 | 872 / 888 / 944 px | 872 / 872 / 872 px | +8 / +36 → 0 / 0 px | +16 / +72 → 0 / 0 px |

Top de envolvente/escena=60 px en todas las expansiones; CTA top=734 / 766 / 854 px
según ancho. Posición del contenido de video=102,67 / 105,33 / 113,78 px.
ScrollY permanece 12; progreso permanece igual; 0 llamadas scrollTo durante esos
resizes. La envolvente añade exactamente 16 / 72 px de negro.

Módulo hero deliberadamente retenido: antes, scroll inicial 12 px movía stage
60→48→60 px al inicializar. Ahora 60→60→60 px en ambos navegadores; position=sticky
desde antes de cargar el módulo. No cambio de altura por su inicialización.

## Verificación

- 24 recorridos touch nativos emulados: Chrome/Edge × 375/390/430 × caché fría/caliente
  × lento/rápido, primeros 200 px, regreso arriba. Sin desplazamiento geométrico
  del stage/imagen durante el gesto; sin compensación de scroll del sitio.
- 12 casos de resize del diagnóstico repetido; comparación +16/+72 y viewport corto.
  Un resize artificial menor que el SVH capturado recorta el escenario; no es
  equivalente a ocultar/mostrar barras dentro del rango nativo SVH–LVH.
- 36 recargas consecutivas: 375/390/430 × fría/caliente × arriba/progreso 0,56 × 3.
  CPU emulada 4x, autoplay restringido, play() rechazado si se invoca: 0 llamadas
  play(), 0 fallos; frame correcto presentado, avance/retroceso y seeks rápidos.
- 80 comprobaciones adicionales en Chrome/Edge: primeros 1/5/20 px, portrait →
  landscape → portrait, sin overflow, media responsive exclusiva, no V1, poster
  con reduced motion/sin JS/Save-Data/fallo de video y acceso al catálogo.
- Comparación de captura del stage inicial 390×844 y 1440×900 contra export aprobado:
  diferencia absoluta media por canal = 0 en Chrome y Edge; imagen/CTA/caption sin
  cambio de posición. Capturas con fuentes listas y primer frame presentado.
- Último build, después de consolidar variable: comprobación adicional en los tres
  anchos de +16/+72/retorno, progreso invariable, negro final/puente con mismo color,
  curva subtle y catálogo alcanzable.
- `pnpm package`: Vite correcto; manifest referenciado por el tema y servido en WP.
  `node tools/check-php.mjs`: 26 archivos PHP 8.3 válidos.
  ZIP: 9.742.835 bytes, 66 entradas bajo rp-usados; sin src/node_modules/tools/debug
  ni GLB/HDR. Bootstrap de layout incluido.
- SHA256 de MP4 desktop y mobile idéntico al checkpoint; posters sin diff Git.
  No Three.js/GLB/HDR/V1 descargado; cada dispositivo pide sólo su MP4/poster.

## Evidencia y límites

Instrumentación y trazas únicamente en browser/contextos de QA; no logs temporales
en el tema. Archivos locales ignorados en `tools/.preview/mobile-stable-stage/`:
`report.json`, `extra-report.json`, `final-build-report.json`,
`reloads/reload-report.json`, capturas initial desktop/mobile y expanded por ancho.
Baseline: `tools/.preview/initial-motion/report.json`.

La emulación no reproduce la barra real de Chrome Android ni rubber-band de Safari.
WebKit local no tiene binario disponible. Falta confirmación en Android/Chrome físico;
no se afirma que 0 px emulados garanticen 0 px en todos los teléfonos.
El negro adicional de 72 px fue inspeccionado en captura y es la absorción prevista.
El bootstrap usa script inline como otras partes actuales del tema; una futura CSP
que prohíba inline debe autorizarlo con nonce/hash antes de aplicarse.
